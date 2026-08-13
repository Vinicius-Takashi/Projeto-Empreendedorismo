import { Route } from '@app/helpers/routeRegistry';
import getFiles from './handler';

const route: Route = {
  method: 'get',
  path: '/files',
  handler: getFiles,
};

export default route;
