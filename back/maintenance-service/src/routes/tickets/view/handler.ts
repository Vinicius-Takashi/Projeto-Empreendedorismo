import client from '@app/db/client';
import { ticketAttachments, ticketComments, ticketHistory, tickets } from '@app/db/schema/ticket';
import {
  hasPermission,
  INTERNAL_COMMENT_PERMISSION,
  VIEW_BUILDING_PERMISSION,
  VIEW_RESIDENCY_PERMISSION,
} from '@app/helpers/permissions';
import { getTicket, requireTicketAccess } from '@app/helpers/tickets';
import BadRequest from '@app/middlewares/error/errors/BadRequest';
import { Context } from '@app/middlewares/routeWrapper';
import { and, desc, eq, or, SQL } from 'drizzle-orm';
import { Request } from 'express';

const STATUSES = [
  'OPEN',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'WAITING_RESIDENT',
  'WAITING_VENDOR',
  'WAITING_MATERIAL',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
  'CANCELED',
] as const;

export async function listTickets(req: Request, ctx: Context) {
  const filters: SQL[] = [eq(tickets.buildingId, ctx.auth.buildingId)];
  const status = req.query.status;

  if (typeof status === 'string') {
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) throw BadRequest;
    filters.push(eq(tickets.status, status as (typeof STATUSES)[number]));
  }

  if (!hasPermission(ctx, VIEW_BUILDING_PERMISSION)) {
    const personalFilters: SQL[] = [
      eq(tickets.openedByUserId, ctx.auth.userId),
      eq(tickets.assignedToUserId, ctx.auth.userId),
    ];

    if (hasPermission(ctx, VIEW_RESIDENCY_PERMISSION) && ctx.auth.residencyId) {
      personalFilters.push(eq(tickets.residencyId, ctx.auth.residencyId));
    }

    const personalScope = or(...personalFilters);
    if (personalScope) filters.push(personalScope);
  }

  return client
    .select()
    .from(tickets)
    .where(and(...filters))
    .orderBy(desc(tickets.createdAt));
}

export async function viewTicket(req: Request, ctx: Context) {
  const ticketId = req.params.ticketId;
  if (!ticketId || Array.isArray(ticketId)) throw BadRequest;

  const ticket = await getTicket(ticketId, ctx.auth.buildingId);
  requireTicketAccess(ctx, ticket);

  const canReadInternal = hasPermission(ctx, INTERNAL_COMMENT_PERMISSION);
  const comments = await client
    .select()
    .from(ticketComments)
    .where(
      canReadInternal
        ? eq(ticketComments.ticketId, ticket.id)
        : and(eq(ticketComments.ticketId, ticket.id), eq(ticketComments.internal, false)),
    )
    .orderBy(ticketComments.createdAt);

  const [attachments, history] = await Promise.all([
    client
      .select()
      .from(ticketAttachments)
      .where(eq(ticketAttachments.ticketId, ticket.id))
      .orderBy(ticketAttachments.createdAt),
    client
      .select()
      .from(ticketHistory)
      .where(eq(ticketHistory.ticketId, ticket.id))
      .orderBy(ticketHistory.createdAt),
  ]);

  return { ...ticket, comments, attachments, history };
}
