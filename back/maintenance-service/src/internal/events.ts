import config from '@app/config';
import client from '@app/db/client';
import { ticketAttachments, tickets } from '@app/db/schema/ticket';
import BadRequest from '@app/middlewares/error/errors/BadRequest';
import Unauthorized from '@app/middlewares/error/errors/Unauthorized';
import { and, eq } from 'drizzle-orm';
import { Express, Request } from 'express';
import { addHistory } from '@app/helpers/tickets';

interface FileStoredData {
  fileId: string;
  buildingId: string;
  residencyId: string | null;
  uploadedByUserId: string;
  fileType: 'MAINTENANCE_ATTACHMENT';
  ownerType: 'MAINTENANCE_TICKET';
  ownerId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  attachmentType: string;
}

function readFileStoredEvent(req: Request): FileStoredData {
  if (req.headers['x-internal-secret'] !== config.internalSecret) throw Unauthorized;
  if (req.body?.eventName !== 'FILE_STORED') throw BadRequest;

  const data = req.body.data;
  if (
    typeof data?.fileId !== 'string' ||
    typeof data?.buildingId !== 'string' ||
    typeof data?.uploadedByUserId !== 'string' ||
    data?.fileType !== 'MAINTENANCE_ATTACHMENT' ||
    data?.ownerType !== 'MAINTENANCE_TICKET' ||
    typeof data?.ownerId !== 'string' ||
    typeof data?.fileName !== 'string' ||
    typeof data?.contentType !== 'string' ||
    typeof data?.sizeBytes !== 'number'
  ) {
    throw BadRequest;
  }

  return {
    ...data,
    residencyId: typeof data.residencyId === 'string' ? data.residencyId : null,
    attachmentType: typeof data.attachmentType === 'string' ? data.attachmentType : 'OTHER',
  };
}

export default function setupInternalEventRoutes(app: Express) {
  app.post('/internal/events/file-stored', async (req, res) => {
    const event = readFileStoredEvent(req);
    const [ticket] = await client
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, event.ownerId), eq(tickets.buildingId, event.buildingId)));

    if (!ticket || (event.residencyId && ticket.residencyId !== event.residencyId)) {
      res.status(200).send({ message: 'Ticket not found for this file' });
      return;
    }

    const inserted = await client
      .insert(ticketAttachments)
      .values({
        ticketId: ticket.id,
        fileId: event.fileId,
        fileName: event.fileName,
        contentType: event.contentType,
        sizeBytes: event.sizeBytes,
        attachmentType: event.attachmentType,
        uploadedByUserId: event.uploadedByUserId,
      })
      .onConflictDoNothing({ target: ticketAttachments.fileId })
      .returning();

    if (inserted.length > 0) {
      await addHistory(ticket.id, event.uploadedByUserId, 'ATTACHMENT_ADDED', null, event.fileId, {
        fileName: event.fileName,
      });
    }

    res.status(200).send({ attached: inserted.length > 0 });
  });
}
