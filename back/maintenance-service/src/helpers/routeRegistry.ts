import { type Express } from 'express';
import wrapHandler, { RouteHandler } from '../middlewares/routeWrapper';
import log from './logger';

export interface Route {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  handler: RouteHandler;
}

const routes: Route[] = [];

export function registerRoute(route: Route) {
  routes.push(route);
}

export function setupRouter(app: Express) {
  routes.forEach((route) => {
    app[route.method](route.path, wrapHandler(route.handler));
    log('SETUP', `Registered route ${route.method} ${route.path}`);
  });
}
