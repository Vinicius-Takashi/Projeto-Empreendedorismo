import { type Express, RequestHandler } from 'express';
import wrapHandler, { RouteHandler } from '../middlewares/routeWrapper';
import log from './logger';

export interface Route {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  middlewares?: RequestHandler[];
  handler: RouteHandler;
}

const routes: Route[] = [];

export function registerRoute(route: Route) {
  routes.push(route);
}

export function setupRouter(app: Express) {
  routes.forEach((r) => {
    const wrappedHandler = wrapHandler(r.handler);
    app[r.method](r.path, ...(r.middlewares ?? []), wrappedHandler);
    log('SETUP', `Registered route ${r.method} ${r.path}`);
  });
}
