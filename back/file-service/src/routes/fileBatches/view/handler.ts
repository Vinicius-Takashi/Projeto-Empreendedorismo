import client from '@app/db/client';
import { fileBatchErrors, fileBatches, residencyFiles } from '@app/db/schema/file';
import { FILE_VIEW_BUILDING_PERMISSION, requirePermission } from '@app/helpers/permissions';
import BadRequest from '@app/middlewares/error/errors/BadRequest';
import NotFoundError from '@app/middlewares/error/errors/NotFoundError';
import { Context } from '@app/middlewares/routeWrapper';
import { and, desc, eq } from 'drizzle-orm';
import { Request } from 'express';

export async function listFileBatches(req: Request, ctx: Context) {
  requirePermission(ctx, [FILE_VIEW_BUILDING_PERMISSION]);

  return client
    .select()
    .from(fileBatches)
    .where(eq(fileBatches.buildingId, ctx.auth.buildingId))
    .orderBy(desc(fileBatches.createdAt));
}

export async function getFileBatch(req: Request, ctx: Context) {
  requirePermission(ctx, [FILE_VIEW_BUILDING_PERMISSION]);

  const { batchId } = req.params;
  if (Array.isArray(batchId)) {
    throw BadRequest;
  }

  const [batch] = await client
    .select()
    .from(fileBatches)
    .where(and(eq(fileBatches.id, batchId), eq(fileBatches.buildingId, ctx.auth.buildingId)));

  if (!batch) {
    throw NotFoundError;
  }

  const files = await client
    .select()
    .from(residencyFiles)
    .where(eq(residencyFiles.batchId, batchId))
    .orderBy(desc(residencyFiles.createdAt));

  const errors = await client
    .select()
    .from(fileBatchErrors)
    .where(eq(fileBatchErrors.batchId, batchId))
    .orderBy(desc(fileBatchErrors.createdAt));

  return { batch, files, errors };
}
