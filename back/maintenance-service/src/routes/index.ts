import { registerRoute } from '@app/helpers/routeRegistry';
import { ticketActionRoutes } from './tickets/actions/route';
import addCommentRoute from './tickets/comments/route';
import createTicketRoute from './tickets/create/route';
import { listTicketsRoute, viewTicketRoute } from './tickets/view/route';

registerRoute(createTicketRoute);
registerRoute(listTicketsRoute);
registerRoute(viewTicketRoute);
registerRoute(addCommentRoute);
ticketActionRoutes.forEach(registerRoute);
