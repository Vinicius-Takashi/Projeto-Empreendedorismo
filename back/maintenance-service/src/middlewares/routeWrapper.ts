import { Request, Response } from 'express';
import authMiddleware from './auth';

export interface Context {
  req: Request;
  auth: {
    userId: string;
    buildingId: string;
    residencyId: string | null;
    residencyName: string | null;
    permissions: string[];
  };
}

export type RouteHandler = (req: Request, ctx: Context) => Promise<unknown>;

export default function wrapHandler(handler: RouteHandler) {
  return async (req: Request, res: Response) => {
    const ctx: Context = { req, auth: authMiddleware(req) };
    const response = await handler(req, ctx);
    res.status(200);
    if (response !== undefined) res.send(response);
  };
}
