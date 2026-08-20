import config from '@app/config';
import { Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Unauthorized from './error/errors/Unauthorized';
import { Context } from './routeWrapper';

interface UserToken extends JwtPayload {
  tokenKind: 'user';
  userId: string;
  buildingId: string;
  residencyId?: string | null;
  residencyName?: string | null;
  permissions?: string[];
}

export default function authMiddleware(req: Request): Context['auth'] {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) throw Unauthorized;

  const result = jwt.verify(authorization.slice('Bearer '.length), config.jwtSecret) as UserToken;
  if (result.tokenKind !== 'user' || !result.userId || !result.buildingId) throw Unauthorized;

  return {
    userId: result.userId,
    buildingId: result.buildingId,
    residencyId: result.residencyId ?? null,
    residencyName: result.residencyName ?? null,
    permissions: result.permissions ?? [],
  };
}
