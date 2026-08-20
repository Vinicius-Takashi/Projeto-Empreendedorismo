import Unauthorized from '@app/middlewares/error/errors/Unauthorized';
import { Context } from '@app/middlewares/routeWrapper';

export const VIEW_BUILDING_PERMISSION = '@maintenance:ticket:view:building';
export const VIEW_RESIDENCY_PERMISSION = '@maintenance:ticket:view:residency';
export const TRIAGE_PERMISSION = '@maintenance:ticket:triage';
export const WORK_PERMISSION = '@maintenance:ticket:work';
export const CLOSE_PERMISSION = '@maintenance:ticket:close';
export const INTERNAL_COMMENT_PERMISSION = '@maintenance:ticket:comment:internal';

export function hasPermission(ctx: Context, permission: string) {
  return ctx.auth.permissions.includes('@core:admin') || ctx.auth.permissions.includes(permission);
}

export function requirePermission(ctx: Context, permissions: string[]) {
  if (!permissions.some((permission) => hasPermission(ctx, permission))) {
    throw Unauthorized;
  }
}
