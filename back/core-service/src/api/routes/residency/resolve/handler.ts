import BadRequest from '@app/api/error/errors/BadRequest';
import client from '@app/db/client';
import { groups, residencies } from '@app/db/schema';
import { assertUserToken } from '@app/helpers/validateTokenKind';
import { Context } from '@app/middlewares/routeWrapper';
import { and, eq, inArray } from 'drizzle-orm';
import { Request } from 'express';

export default async function resolveResidencies(req: Request, ctx: Context) {
  assertUserToken(ctx.token);

  const { names } = req.body;

  if (!Array.isArray(names) || !names.every((name) => typeof name === 'string')) {
    throw BadRequest;
  }

  if (names.length === 0) {
    return { residencies: [] };
  }

  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];

  const result = await client
    .select({
      id: residencies.id,
      code: residencies.code,
      name: residencies.name,
    })
    .from(residencies)
    .innerJoin(groups, eq(residencies.groupId, groups.id))
    .where(and(eq(groups.building, ctx.token.buildingId), inArray(residencies.name, uniqueNames)));

  return { residencies: result };
}
