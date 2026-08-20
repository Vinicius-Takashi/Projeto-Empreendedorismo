import { Route } from '@app/helpers/routeRegistry';
import createTicket from './handler';

const route: Route = {
  method: 'post',
  path: '/tickets',
  handler: createTicket,
};

export default route;
