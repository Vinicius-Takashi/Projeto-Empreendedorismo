import client from '@app/db/client';
import { ticketHistory, tickets } from '@app/db/schema/ticket';
import { publishTicketEventSafely } from '@app/helpers/eventBus';
import { hasPermission, VIEW_BUILDING_PERMISSION } from '@app/helpers/permissions';
import BadRequest from '@app/middlewares/error/errors/BadRequest';
import { Context } from '@app/middlewares/routeWrapper';
import { Request } from 'express';

const CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'ELEVATOR',
  'CLEANING',
  'SECURITY',
  'COMMON_AREA',
  'STRUCTURAL',
  'OTHER',
] as const;

export default async function createTicket(req: Request, ctx: Context) {
  const { category, title, description, location } = req.body;
  if (
    !CATEGORIES.includes(category) ||
    typeof title !== 'string' ||
    title.trim().length < 3 ||
    title.length > 160 ||
    typeof description !== 'string' ||
    description.trim().length < 3 ||
    (location !== undefined && typeof location !== 'string')
  ) {
    throw BadRequest;
  }

  const isCommonArea = category === 'COMMON_AREA';
  const residencyId =
    isCommonArea && hasPermission(ctx, VIEW_BUILDING_PERMISSION) ? null : ctx.auth.residencyId;

  if (!residencyId && !hasPermission(ctx, VIEW_BUILDING_PERMISSION)) throw BadRequest;

  const ticket = await client.transaction(async (tx) => {
    const [created] = await tx
      .insert(tickets)
      .values({
        buildingId: ctx.auth.buildingId,
        residencyId,
        openedByUserId: ctx.auth.userId,
        category,
        title: title.trim(),
        description: description.trim(),
        location: location?.trim() || null,
      })
      .returning();

    await tx.insert(ticketHistory).values({
      ticketId: created.id,
      actorUserId: ctx.auth.userId,
      eventType: 'TICKET_CREATED',
      newValue: created.status,
    });

    return created;
  });

  await publishTicketEventSafely('MAINTENANCE_TICKET_CREATED', ticket);
  return ticket;
}
