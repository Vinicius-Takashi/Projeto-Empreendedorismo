import { Route } from '@app/helpers/routeRegistry';
import { listTickets, viewTicket } from './handler';

export const listTicketsRoute: Route = {
  method: 'get',
  path: '/tickets',
  handler: listTickets,
};

export const viewTicketRoute: Route = {
  method: 'get',
  path: '/tickets/:ticketId',
  handler: viewTicket,
};
