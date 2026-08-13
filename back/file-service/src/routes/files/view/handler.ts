import client from '@app/db/client';
import { residencyFiles } from '@app/db/schema/file';
import {
  FILE_VIEW_BUILDING_PERMISSION,
  FILE_VIEW_RESIDENCY_PERMISSION,
  hasPermission,
  requirePermission,
} from '@app/helpers/permissions';
import Unauthorized from '@app/middlewares/error/errors/Unauthorized';
import { Context } from '@app/middlewares/routeWrapper';
import { and, desc, eq } from 'drizzle-orm';
import { Request } from 'express';

function requireResidencyId(ctx: Context) {
  if (!ctx.auth.residencyId) {
    throw Unauthorized;
  }

  return ctx.auth.residencyId;
}

export default async function getFiles(req: Request, ctx: Context) {
  const scope = req.query.scope;
  const referenceMonth = req.query.referenceMonth;

  const filters = [
    eq(residencyFiles.buildingId, ctx.auth.buildingId),
    eq(residencyFiles.isCurrent, true),
  ];

  if (typeof referenceMonth === 'string' && referenceMonth.length > 0) {
    filters.push(eq(residencyFiles.referenceMonth, referenceMonth));
  }

  if (scope === 'building') {
    requirePermission(ctx, [FILE_VIEW_BUILDING_PERMISSION]);
  } else if (scope === 'residency') {
    requirePermission(ctx, [FILE_VIEW_RESIDENCY_PERMISSION]);
    filters.push(eq(residencyFiles.residencyId, requireResidencyId(ctx)));
  } else if (scope !== undefined) {
    throw Unauthorized;
  } else if (hasPermission(ctx, FILE_VIEW_BUILDING_PERMISSION)) {
    requirePermission(ctx, [FILE_VIEW_BUILDING_PERMISSION]);
  } else {
    requirePermission(ctx, [FILE_VIEW_RESIDENCY_PERMISSION]);
    filters.push(eq(residencyFiles.residencyId, requireResidencyId(ctx)));
  }

  return client
    .select({
      id: residencyFiles.id,
      batchId: residencyFiles.batchId,
      buildingId: residencyFiles.buildingId,
      residencyId: residencyFiles.residencyId,
      residencyName: residencyFiles.residencyName,
      type: residencyFiles.type,
      referenceMonth: residencyFiles.referenceMonth,
      originalName: residencyFiles.originalName,
      sizeBytes: residencyFiles.sizeBytes,
      version: residencyFiles.version,
      createdAt: residencyFiles.createdAt,
    })
    .from(residencyFiles)
    .where(and(...filters))
    .orderBy(desc(residencyFiles.referenceMonth), desc(residencyFiles.createdAt));
}
