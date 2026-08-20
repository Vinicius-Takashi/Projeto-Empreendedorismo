import client from '@app/db/client';
import { Ticket, ticketHistory, tickets } from '@app/db/schema/ticket';
import {
  hasPermission,
  VIEW_BUILDING_PERMISSION,
  VIEW_RESIDENCY_PERMISSION,
} from '@app/helpers/permissions';
import NotFoundError from '@app/middlewares/error/errors/NotFoundError';
import Unauthorized from '@app/middlewares/error/errors/Unauthorized';
import { Context } from '@app/middlewares/routeWrapper';
import { and, eq } from 'drizzle-orm';

export async function getTicket(ticketId: string, buildingId: string) {
  const [ticket] = await client
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.buildingId, buildingId)));

  if (!ticket) throw NotFoundError;
  return ticket;
}

export function requireTicketAccess(ctx: Context, ticket: Ticket) {
  if (ticket.buildingId !== ctx.auth.buildingId) throw NotFoundError;
  if (hasPermission(ctx, VIEW_BUILDING_PERMISSION)) return;
  if (ticket.openedByUserId === ctx.auth.userId || ticket.assignedToUserId === ctx.auth.userId)
    return;
  if (
    hasPermission(ctx, VIEW_RESIDENCY_PERMISSION) &&
    ctx.auth.residencyId &&
    ticket.residencyId === ctx.auth.residencyId
  ) {
    return;
  }

  throw Unauthorized;
}

export async function addHistory(
  ticketId: string,
  actorUserId: string | null,
  eventType: string,
  previousValue?: string | null,
  newValue?: string | null,
  metadata?: Record<string, unknown>,
) {
  await client.insert(ticketHistory).values({
    ticketId,
    actorUserId,
    eventType,
    previousValue,
    newValue,
    metadata,
  });
}
