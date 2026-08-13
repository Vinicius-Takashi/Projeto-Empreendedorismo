import { Route } from '@app/helpers/routeRegistry';
import handler from './handler';

const route: Route = {
  method: 'post',
  path: '/residencies/resolve',
  handler,
};

export default route;
