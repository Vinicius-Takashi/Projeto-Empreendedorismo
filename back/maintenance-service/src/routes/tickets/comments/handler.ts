import client from '@app/db/client';
import { ticketComments, ticketHistory } from '@app/db/schema/ticket';
import { hasPermission, INTERNAL_COMMENT_PERMISSION } from '@app/helpers/permissions';
import { getTicket, requireTicketAccess } from '@app/helpers/tickets';
import BadRequest from '@app/middlewares/error/errors/BadRequest';
import Unauthorized from '@app/middlewares/error/errors/Unauthorized';
import { Context } from '@app/middlewares/routeWrapper';
import { Request } from 'express';

export default async function addComment(req: Request, ctx: Context) {
  const ticketId = req.params.ticketId;
  const content = req.body.content;
  const internal = req.body.internal === true;

  if (
    !ticketId ||
    Array.isArray(ticketId) ||
    typeof content !== 'string' ||
    content.trim().length === 0
  ) {
    throw BadRequest;
  }

  const ticket = await getTicket(ticketId, ctx.auth.buildingId);
  requireTicketAccess(ctx, ticket);
  if (internal && !hasPermission(ctx, INTERNAL_COMMENT_PERMISSION)) throw Unauthorized;

  return client.transaction(async (tx) => {
    const [comment] = await tx
      .insert(ticketComments)
      .values({
        ticketId: ticket.id,
        authorUserId: ctx.auth.userId,
        content: content.trim(),
        internal,
      })
      .returning();

    await tx.insert(ticketHistory).values({
      ticketId: ticket.id,
      actorUserId: ctx.auth.userId,
      eventType: internal ? 'INTERNAL_COMMENT_ADDED' : 'COMMENT_ADDED',
      metadata: { commentId: comment.id },
    });

    return comment;
  });
}
