import config from '@app/config';
import { Ticket } from '@app/db/schema/ticket';
import { randomUUID } from 'crypto';
import log from './logger';

const FILE_STORED_SUBSCRIBER = `${config.serviceUrl}/internal/events/file-stored`;
const SUBSCRIBE_RETRY_DELAY_MS = 3000;
const SUBSCRIBE_MAX_ATTEMPTS = 10;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function subscribeToEventBus(attempt = 1): Promise<void> {
  try {
    const response = await fetch(`${config.eventBusUrl}/events/FILE_STORED/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: FILE_STORED_SUBSCRIBER }),
    });

    if (!response.ok) throw new Error(`Event Bus returned ${response.status}`);
    log('SETUP', 'Subscribed maintenance-service to FILE_STORED');
  } catch (error) {
    if (attempt >= SUBSCRIBE_MAX_ATTEMPTS) {
      console.error('Falha ao se inscrever no Event Bus', error);
      return;
    }

    log(
      'SETUP',
      `Event Bus indisponivel. Tentando novamente (${attempt + 1}/${SUBSCRIBE_MAX_ATTEMPTS})`,
    );
    await wait(SUBSCRIBE_RETRY_DELAY_MS);
    await subscribeToEventBus(attempt + 1);
  }
}

export async function publishTicketEvent(eventName: string, ticket: Ticket, data = {}) {
  const response = await fetch(`${config.eventBusUrl}/events/${eventName}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      data: {
        ticketId: ticket.id,
        buildingId: ticket.buildingId,
        residencyId: ticket.residencyId,
        openedByUserId: ticket.openedByUserId,
        assignedToUserId: ticket.assignedToUserId,
        status: ticket.status,
        title: ticket.title,
        ...data,
      },
    }),
  });

  if (!response.ok) throw new Error(`Event Bus returned ${response.status}`);
}

export async function publishTicketEventSafely(eventName: string, ticket: Ticket, data = {}) {
  try {
    await publishTicketEvent(eventName, ticket, data);
  } catch (error) {
    console.error(`Falha ao publicar ${eventName}`, error);
  }
}
