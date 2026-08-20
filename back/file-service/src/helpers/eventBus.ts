import config from '@app/config';
import { ServiceFile } from '@app/db/schema/file';
import { randomUUID } from 'crypto';

export async function publishFileStored(file: ServiceFile) {
  const response = await fetch(`${config.eventBusUrl}/events/FILE_STORED/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      data: {
        fileId: file.id,
        buildingId: file.buildingId,
        residencyId: file.residencyId,
        uploadedByUserId: file.uploadedByUserId,
        fileType: file.type,
        ownerType: file.ownerType,
        ownerId: file.ownerId,
        attachmentType: file.attachmentType,
        fileName: file.originalName,
        contentType: file.contentType,
        sizeBytes: file.sizeBytes,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Event Bus returned ${response.status}`);
  }
}
