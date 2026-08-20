import { Route } from '@app/helpers/routeRegistry';
import addComment from './handler';

const route: Route = {
  method: 'post',
  path: '/tickets/:ticketId/comments',
  handler: addComment,
};

export default route;
