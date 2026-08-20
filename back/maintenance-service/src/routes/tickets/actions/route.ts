import { Route } from '@app/helpers/routeRegistry';
import { ticketAction } from './handler';

const actions = [
  'triage',
  'assign',
  'start',
  'wait',
  'resolve',
  'close',
  'reopen',
  'cancel',
  'reject',
] as const;

export const ticketActionRoutes: Route[] = actions.map((action) => ({
  method: 'post',
  path: `/tickets/:ticketId/${action}`,
  handler: ticketAction(action),
}));
