import client from '@app/db/client';
import { fileBatchErrors, fileBatches, residencyFiles } from '@app/db/schema/file';
import BadRequest from '@app/middlewares/error/errors/BadRequest';
import { Context } from '@app/middlewares/routeWrapper';
import { FILE_UPLOAD_PERMISSION, requirePermission } from '@app/helpers/permissions';
import { parseZip } from '@app/helpers/zip';
import { resolveResidencies } from '@app/helpers/core';
import { uploadPdf } from '@app/helpers/minio';
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { Request } from 'express';

interface UploadRequest extends Request {
  file?: Express.Multer.File;
}

function validateReferenceMonth(referenceMonth: unknown) {
  if (typeof referenceMonth !== 'string' || !/^\d{4}-\d{2}$/.test(referenceMonth)) {
    throw BadRequest;
  }

  const month = Number(referenceMonth.slice(5, 7));
  if (month < 1 || month > 12) {
    throw BadRequest;
  }

  return referenceMonth;
}

async function getNextVersion(buildingId: string, residencyId: string, referenceMonth: string) {
  const existingFiles = await client
    .select({ version: residencyFiles.version })
    .from(residencyFiles)
    .where(
      and(
        eq(residencyFiles.buildingId, buildingId),
        eq(residencyFiles.residencyId, residencyId),
        eq(residencyFiles.referenceMonth, referenceMonth),
        eq(residencyFiles.type, 'BOLETO'),
      ),
    )
    .orderBy(desc(residencyFiles.version));

  return (existingFiles[0]?.version ?? 0) + 1;
}

async function markPreviousFilesAsOld(buildingId: string, residencyId: string, referenceMonth: string) {
  await client
    .update(residencyFiles)
    .set({ isCurrent: false })
    .where(
      and(
        eq(residencyFiles.buildingId, buildingId),
        eq(residencyFiles.residencyId, residencyId),
        eq(residencyFiles.referenceMonth, referenceMonth),
        eq(residencyFiles.type, 'BOLETO'),
      ),
    );
}

export async function createFileBatch(req: UploadRequest, ctx: Context) {
  requirePermission(ctx, [FILE_UPLOAD_PERMISSION]);

  const referenceMonth = validateReferenceMonth(req.body.referenceMonth);
  const uploadedFile = req.file;

  if (!uploadedFile || !uploadedFile.originalname.toLowerCase().endsWith('.zip')) {
    throw BadRequest;
  }

  const { pdfEntries, invalidEntries } = parseZip(uploadedFile.buffer);
  const totalFiles = pdfEntries.length + invalidEntries.length;

  const [batch] = await client
    .insert(fileBatches)
    .values({
      buildingId: ctx.auth.buildingId,
      uploadedByUserId: ctx.auth.userId,
      originalZipName: uploadedFile.originalname,
      referenceMonth,
      totalFiles,
    })
    .returning();

  const failures = [...invalidEntries];
  let processedFiles = 0;

  try {
    if (invalidEntries.length) {
      await client.insert(fileBatchErrors).values(
        invalidEntries.map((entry) => ({
          batchId: batch.id,
          entryName: entry.entryName,
          reason: entry.reason,
        })),
      );
    }

    const names = [...new Set(pdfEntries.map((entry) => entry.residencyName))];
    const resolvedResidencies = await resolveResidencies(names, ctx.auth.token);
    const residencyByName = new Map(
      resolvedResidencies.map((residency) => [residency.name, residency]),
    );

    for (const entry of pdfEntries) {
      const residency = residencyByName.get(entry.residencyName);

      if (!residency) {
        const error = {
          entryName: entry.entryName,
          reason: `Residencia ${entry.residencyName} nao encontrada neste predio.`,
        };
        failures.push(error);
        await client.insert(fileBatchErrors).values({
          batchId: batch.id,
          ...error,
        });
        continue;
      }

      try {
        const fileId = randomUUID();
        const version = await getNextVersion(ctx.auth.buildingId, residency.id, referenceMonth);
        const objectKey = [
          'buildings',
          ctx.auth.buildingId,
          'boletos',
          referenceMonth,
          'residencies',
          residency.id,
          `${fileId}.pdf`,
        ].join('/');

        await uploadPdf(objectKey, entry.buffer);
        await markPreviousFilesAsOld(ctx.auth.buildingId, residency.id, referenceMonth);

        await client.insert(residencyFiles).values({
          id: fileId,
          batchId: batch.id,
          buildingId: ctx.auth.buildingId,
          residencyId: residency.id,
          residencyName: residency.name ?? entry.residencyName,
          referenceMonth,
          originalName: entry.originalName,
          objectKey,
          sizeBytes: entry.buffer.length,
          version,
          isCurrent: true,
        });

        processedFiles += 1;
      } catch (error) {
        console.error('Falha ao processar arquivo do ZIP', error);
        const batchError = {
          entryName: entry.entryName,
          reason: 'Nao foi possivel armazenar este PDF.',
        };
        failures.push(batchError);
        await client.insert(fileBatchErrors).values({
          batchId: batch.id,
          ...batchError,
        });
      }
    }

    const status =
      processedFiles === 0 && failures.length > 0
        ? 'FAILED'
        : failures.length > 0
          ? 'COMPLETED_WITH_ERRORS'
          : 'COMPLETED';

    const [updatedBatch] = await client
      .update(fileBatches)
      .set({
        status,
        processedFiles,
        failedFiles: failures.length,
        finishedAt: new Date(),
      })
      .where(eq(fileBatches.id, batch.id))
      .returning();

    return {
      batch: updatedBatch,
      errors: failures,
    };
  } catch (error) {
    await client
      .update(fileBatches)
      .set({
        status: 'FAILED',
        processedFiles,
        failedFiles: totalFiles - processedFiles,
        finishedAt: new Date(),
      })
      .where(eq(fileBatches.id, batch.id));

    throw error;
  }
}
