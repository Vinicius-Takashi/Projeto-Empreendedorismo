import client from '@app/db/client';
import { residencyFiles, serviceFiles } from '@app/db/schema/file';
import {
  FILE_VIEW_BUILDING_PERMISSION,
  FILE_VIEW_RESIDENCY_PERMISSION,
  hasPermission,
  requirePermission,
} from '@app/helpers/permissions';
import { createDownloadUrl } from '@app/helpers/minio';
import BadRequest from '@app/middlewares/error/errors/BadRequest';
import NotFoundError from '@app/middlewares/error/errors/NotFoundError';
import Unauthorized from '@app/middlewares/error/errors/Unauthorized';
import { Context } from '@app/middlewares/routeWrapper';
import { and, eq } from 'drizzle-orm';
import { Request } from 'express';

export default async function getDownloadUrl(req: Request, ctx: Context) {
  const { fileId } = req.params;
  if (Array.isArray(fileId)) {
    throw BadRequest;
  }

  const [residencyFile] = await client
    .select()
    .from(residencyFiles)
    .where(and(eq(residencyFiles.id, fileId), eq(residencyFiles.buildingId, ctx.auth.buildingId)));

  const [serviceFile] = residencyFile
    ? []
    : await client
        .select()
        .from(serviceFiles)
        .where(and(eq(serviceFiles.id, fileId), eq(serviceFiles.buildingId, ctx.auth.buildingId)));

  const file = residencyFile ?? serviceFile;
  if (!file) throw NotFoundError;

  if (hasPermission(ctx, FILE_VIEW_BUILDING_PERMISSION)) {
    requirePermission(ctx, [FILE_VIEW_BUILDING_PERMISSION]);
  } else {
    requirePermission(ctx, [FILE_VIEW_RESIDENCY_PERMISSION]);

    if (
      file.residencyId !== null &&
      (!ctx.auth.residencyId || ctx.auth.residencyId !== file.residencyId)
    ) {
      throw Unauthorized;
    }
  }

  const url = await createDownloadUrl(file.objectKey);
  return { url };
}
