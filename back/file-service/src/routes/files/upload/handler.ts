import client from '@app/db/client';
import { serviceFiles } from '@app/db/schema/file';
import { publishFileStored } from '@app/helpers/eventBus';
import { uploadFile } from '@app/helpers/minio';
import BadRequest from '@app/middlewares/error/errors/BadRequest';
import { Context } from '@app/middlewares/routeWrapper';
import { randomUUID } from 'crypto';
import { Request } from 'express';

interface UploadRequest extends Request {
  file?: Express.Multer.File;
}

const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export default async function uploadMaintenanceAttachment(req: UploadRequest, ctx: Context) {
  const uploadedFile = req.file;
  const ownerId = req.body.ownerId;
  const attachmentType = req.body.attachmentType ?? 'OTHER';

  if (!uploadedFile || typeof ownerId !== 'string' || ownerId.length === 0) {
    throw BadRequest;
  }

  if (!ALLOWED_CONTENT_TYPES.has(uploadedFile.mimetype)) {
    throw BadRequest;
  }

  if (
    !['PROBLEM_PHOTO', 'RESOLUTION_PHOTO', 'INVOICE', 'REPORT', 'OTHER'].includes(attachmentType)
  ) {
    throw BadRequest;
  }

  const fileId = randomUUID();
  const extension = uploadedFile.originalname.includes('.')
    ? uploadedFile.originalname.split('.').pop()?.toLowerCase()
    : undefined;
  const objectName = extension ? `${fileId}.${extension}` : fileId;
  const objectKey = ['buildings', ctx.auth.buildingId, 'maintenance', ownerId, objectName].join(
    '/',
  );

  await uploadFile(objectKey, uploadedFile.buffer, uploadedFile.mimetype);

  const [file] = await client
    .insert(serviceFiles)
    .values({
      id: fileId,
      buildingId: ctx.auth.buildingId,
      residencyId: ctx.auth.residencyId,
      uploadedByUserId: ctx.auth.userId,
      type: 'MAINTENANCE_ATTACHMENT',
      ownerType: 'MAINTENANCE_TICKET',
      ownerId,
      attachmentType,
      originalName: uploadedFile.originalname,
      objectKey,
      sizeBytes: uploadedFile.size,
      contentType: uploadedFile.mimetype,
    })
    .returning();

  try {
    await publishFileStored(file);
  } catch (error) {
    console.error('Falha ao publicar FILE_STORED', error);
  }

  return {
    id: file.id,
    ownerId: file.ownerId,
    type: file.type,
    attachmentType,
    originalName: file.originalName,
    contentType: file.contentType,
    sizeBytes: file.sizeBytes,
    createdAt: file.createdAt,
  };
}
