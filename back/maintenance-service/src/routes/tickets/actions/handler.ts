import client from '@app/db/client';
import { Ticket, tickets } from '@app/db/schema/ticket';
import { publishTicketEventSafely } from '@app/helpers/eventBus';
import {
  CLOSE_PERMISSION,
  hasPermission,
  requirePermission,
  TRIAGE_PERMISSION,
  WORK_PERMISSION,
} from '@app/helpers/permissions';
import { addHistory, getTicket } from '@app/helpers/tickets';
import BadRequest from '@app/middlewares/error/errors/BadRequest';
import Conflict from '@app/middlewares/error/errors/Conflict';
import Unauthorized from '@app/middlewares/error/errors/Unauthorized';
import { Context } from '@app/middlewares/routeWrapper';
import { eq } from 'drizzle-orm';
import { Request } from 'express';

type Action =
  | 'triage'
  | 'assign'
  | 'start'
  | 'wait'
  | 'resolve'
  | 'close'
  | 'reopen'
  | 'cancel'
  | 'reject';
type TicketStatus = Ticket['status'];

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'] as const;
const WAITING_STATUSES = ['WAITING_RESIDENT', 'WAITING_VENDOR', 'WAITING_MATERIAL'] as const;

function assertStatus(ticket: Ticket, allowed: TicketStatus[]) {
  if (!allowed.includes(ticket.status)) throw Conflict;
}

function requireWorkAccess(ctx: Context, ticket: Ticket) {
  requirePermission(ctx, [WORK_PERMISSION, TRIAGE_PERMISSION]);
  if (
    ticket.assignedToUserId &&
    ticket.assignedToUserId !== ctx.auth.userId &&
    !hasPermission(ctx, TRIAGE_PERMISSION)
  ) {
    throw Unauthorized;
  }
}

async function updateTicket(
  ticket: Ticket,
  ctx: Context,
  values: Partial<typeof tickets.$inferInsert>,
  eventType: string,
  eventName: string,
) {
  const [updated] = await client
    .update(tickets)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(tickets.id, ticket.id))
    .returning();

  await addHistory(ticket.id, ctx.auth.userId, eventType, ticket.status, updated.status, values);
  await publishTicketEventSafely(eventName, updated, { previousStatus: ticket.status });
  return updated;
}

export function ticketAction(action: Action) {
  return async (req: Request, ctx: Context) => {
    const ticketId = req.params.ticketId;
    if (!ticketId || Array.isArray(ticketId)) throw BadRequest;
    const ticket = await getTicket(ticketId, ctx.auth.buildingId);

    switch (action) {
      case 'triage': {
        requirePermission(ctx, [TRIAGE_PERMISSION]);
        assertStatus(ticket, ['OPEN']);
        const priority = req.body.priority ?? ticket.priority;
        if (!PRIORITIES.includes(priority)) throw BadRequest;
        const dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;
        if (dueAt && Number.isNaN(dueAt.getTime())) throw BadRequest;
        return updateTicket(
          ticket,
          ctx,
          { status: 'UNDER_REVIEW', priority, dueAt },
          'TICKET_TRIAGED',
          'MAINTENANCE_TICKET_STATUS_CHANGED',
        );
      }
      case 'assign': {
        requirePermission(ctx, [TRIAGE_PERMISSION]);
        assertStatus(ticket, ['OPEN', 'UNDER_REVIEW']);
        if (typeof req.body.assignedToUserId !== 'string') throw BadRequest;
        return updateTicket(
          ticket,
          ctx,
          { assignedToUserId: req.body.assignedToUserId, status: 'UNDER_REVIEW' },
          'TICKET_ASSIGNED',
          'MAINTENANCE_TICKET_ASSIGNED',
        );
      }
      case 'start':
        assertStatus(ticket, [
          'UNDER_REVIEW',
          'WAITING_RESIDENT',
          'WAITING_VENDOR',
          'WAITING_MATERIAL',
        ]);
        requireWorkAccess(ctx, ticket);
        return updateTicket(
          ticket,
          ctx,
          { status: 'IN_PROGRESS' },
          'TICKET_STARTED',
          'MAINTENANCE_TICKET_STATUS_CHANGED',
        );
      case 'wait': {
        assertStatus(ticket, ['IN_PROGRESS']);
        requireWorkAccess(ctx, ticket);
        const status = req.body.status;
        if (!WAITING_STATUSES.includes(status)) throw BadRequest;
        return updateTicket(
          ticket,
          ctx,
          { status },
          'TICKET_WAITING',
          'MAINTENANCE_TICKET_STATUS_CHANGED',
        );
      }
      case 'resolve': {
        assertStatus(ticket, ['IN_PROGRESS']);
        requireWorkAccess(ctx, ticket);
        if (typeof req.body.resolution !== 'string' || req.body.resolution.trim().length < 3) {
          throw BadRequest;
        }
        return updateTicket(
          ticket,
          ctx,
          { status: 'RESOLVED', resolution: req.body.resolution.trim(), resolvedAt: new Date() },
          'TICKET_RESOLVED',
          'MAINTENANCE_TICKET_RESOLVED',
        );
      }
      case 'close':
        requirePermission(ctx, [CLOSE_PERMISSION]);
        assertStatus(ticket, ['RESOLVED']);
        return updateTicket(
          ticket,
          ctx,
          { status: 'CLOSED', closedAt: new Date() },
          'TICKET_CLOSED',
          'MAINTENANCE_TICKET_STATUS_CHANGED',
        );
      case 'reopen':
        requirePermission(ctx, [TRIAGE_PERMISSION]);
        assertStatus(ticket, ['RESOLVED', 'CLOSED']);
        return updateTicket(
          ticket,
          ctx,
          { status: 'IN_PROGRESS', resolvedAt: null, closedAt: null },
          'TICKET_REOPENED',
          'MAINTENANCE_TICKET_STATUS_CHANGED',
        );
      case 'cancel':
        if (ticket.openedByUserId !== ctx.auth.userId && !hasPermission(ctx, TRIAGE_PERMISSION)) {
          throw Unauthorized;
        }
        assertStatus(ticket, ['OPEN', 'UNDER_REVIEW']);
        return updateTicket(
          ticket,
          ctx,
          { status: 'CANCELED' },
          'TICKET_CANCELED',
          'MAINTENANCE_TICKET_STATUS_CHANGED',
        );
      case 'reject':
        requirePermission(ctx, [TRIAGE_PERMISSION]);
        assertStatus(ticket, ['OPEN', 'UNDER_REVIEW']);
        return updateTicket(
          ticket,
          ctx,
          { status: 'REJECTED', resolution: req.body.reason ?? null },
          'TICKET_REJECTED',
          'MAINTENANCE_TICKET_STATUS_CHANGED',
        );
    }
  };
}
