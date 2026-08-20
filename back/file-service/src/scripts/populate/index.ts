import client from '@app/db/client';
import { fileBatchErrors, fileBatches, residencyFiles, serviceFiles } from '@app/db/schema/file';
import { uploadFile, uploadPdf } from '@app/helpers/minio';
import { sql } from 'drizzle-orm';

const referenceMonth = new Date().toISOString().slice(0, 7);
const pdfBuffer = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
);
const attachmentBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZsT8AAAAASUVORK5CYII=',
  'base64',
);

const batches = [
  {
    id: '99999999-9999-9999-9999-999999999901',
    buildingId: '22222222-2222-2222-2222-222222222221',
    uploadedByUserId: '00000000-0000-0000-0000-000000000006',
    originalZipName: 'boletos-jardim-das-flores.zip',
    status: 'COMPLETED_WITH_ERRORS' as const,
    failedFiles: 1,
    files: [
      {
        id: '99999999-9999-9999-9999-999999999911',
        residencyId: '44444444-4444-4444-4444-444444444441',
        residencyName: 'Apartamento 101A',
      },
      {
        id: '99999999-9999-9999-9999-999999999912',
        residencyId: '44444444-4444-4444-4444-444444444442',
        residencyName: 'Apartamento 102A',
      },
    ],
  },
  {
    id: '99999999-9999-9999-9999-999999999902',
    buildingId: '22222222-2222-2222-2222-222222222222',
    uploadedByUserId: '00000000-0000-0000-0000-000000000008',
    originalZipName: 'boletos-bosque-verde.zip',
    status: 'COMPLETED' as const,
    failedFiles: 0,
    files: [
      {
        id: '99999999-9999-9999-9999-999999999913',
        residencyId: '44444444-4444-4444-4444-444444444444',
        residencyName: 'Casa 01',
      },
      {
        id: '99999999-9999-9999-9999-999999999914',
        residencyId: '44444444-4444-4444-4444-444444444445',
        residencyName: 'Casa 02',
      },
    ],
  },
];

const attachments = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    buildingId: '22222222-2222-2222-2222-222222222221',
    residencyId: '44444444-4444-4444-4444-444444444441',
    uploadedByUserId: '00000000-0000-0000-0000-000000000001',
    ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
    originalName: 'vazamento-jardim.png',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    buildingId: '22222222-2222-2222-2222-222222222222',
    residencyId: '44444444-4444-4444-4444-444444444444',
    uploadedByUserId: '00000000-0000-0000-0000-000000000003',
    ticketId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06',
    originalName: 'infiltracao-bosque.png',
  },
];

async function seed() {
  await client.execute(sql`
    TRUNCATE TABLE
      service_files,
      file_batch_errors,
      residency_files,
      file_batches
    CASCADE
  `);

  for (const batch of batches) {
    await client.insert(fileBatches).values({
      id: batch.id,
      buildingId: batch.buildingId,
      uploadedByUserId: batch.uploadedByUserId,
      originalZipName: batch.originalZipName,
      referenceMonth,
      status: batch.status,
      totalFiles: batch.files.length + batch.failedFiles,
      processedFiles: batch.files.length,
      failedFiles: batch.failedFiles,
      finishedAt: new Date(),
    });

    for (const boleto of batch.files) {
      const objectKey = [
        'buildings',
        batch.buildingId,
        'boletos',
        referenceMonth,
        'residencies',
        boleto.residencyId,
        `${boleto.id}.pdf`,
      ].join('/');
      await uploadPdf(objectKey, pdfBuffer);
      await client.insert(residencyFiles).values({
        id: boleto.id,
        batchId: batch.id,
        buildingId: batch.buildingId,
        residencyId: boleto.residencyId,
        residencyName: boleto.residencyName,
        type: 'BOLETO',
        referenceMonth,
        originalName: `boleto-${boleto.residencyName}.pdf`,
        objectKey,
        sizeBytes: pdfBuffer.length,
        contentType: 'application/pdf',
        version: 1,
        isCurrent: true,
      });
    }
  }

  await client.insert(fileBatchErrors).values({
    batchId: batches[0].id,
    entryName: 'unidade-inexistente.pdf',
    reason: 'Residência não encontrada neste condomínio.',
  });

  for (const attachment of attachments) {
    const objectKey = [
      'buildings',
      attachment.buildingId,
      'maintenance',
      attachment.ticketId,
      `${attachment.id}.png`,
    ].join('/');
    await uploadFile(objectKey, attachmentBuffer, 'image/png');
    await client.insert(serviceFiles).values({
      id: attachment.id,
      buildingId: attachment.buildingId,
      residencyId: attachment.residencyId,
      uploadedByUserId: attachment.uploadedByUserId,
      type: 'MAINTENANCE_ATTACHMENT',
      ownerType: 'MAINTENANCE_TICKET',
      ownerId: attachment.ticketId,
      attachmentType: 'PROBLEM_PHOTO',
      originalName: attachment.originalName,
      objectKey,
      sizeBytes: attachmentBuffer.length,
      contentType: 'image/png',
    });
  }

  console.log('File service populate complete');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
