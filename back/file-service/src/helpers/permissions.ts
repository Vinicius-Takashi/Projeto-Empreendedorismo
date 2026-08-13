import Unauthorized from '@app/middlewares/error/errors/Unauthorized';
import { Context } from '@app/middlewares/routeWrapper';
import _ from 'lodash';

export const FILE_UPLOAD_PERMISSION = '@file:upload';
export const FILE_VIEW_BUILDING_PERMISSION = '@file:view:building';
export const FILE_VIEW_RESIDENCY_PERMISSION = '@file:view:residency';

export function hasPermission(ctx: Context, permission: string) {
  const userPermissions = ctx.auth.permissions;
  if (userPermissions.includes('@core:admin')) {
    return true;
  }

  return userPermissions.includes(permission);
}

export function requirePermission(ctx: Context, permissions: string[]) {
  const userPermissions = ctx.auth.permissions;
  const allowedPermissions = ['@core:admin', ...permissions];
  const hasPermission = _.intersection(userPermissions, allowedPermissions).length > 0;

  if (!hasPermission) {
    throw Unauthorized;
  }
}
