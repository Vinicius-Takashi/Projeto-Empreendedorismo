import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const fileBatchStatusEnum = pgEnum('file_batch_status', [
  'PROCESSING',
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED',
]);

export const fileTypeEnum = pgEnum('file_type', ['BOLETO']);

export const fileBatches = pgTable('file_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull(),
  uploadedByUserId: uuid('uploaded_by_user_id').notNull(),
  originalZipName: varchar('original_zip_name', { length: 255 }).notNull(),
  referenceMonth: varchar('reference_month', { length: 7 }).notNull(),
  status: fileBatchStatusEnum('status').default('PROCESSING').notNull(),
  totalFiles: integer('total_files').default(0).notNull(),
  processedFiles: integer('processed_files').default(0).notNull(),
  failedFiles: integer('failed_files').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  finishedAt: timestamp('finished_at'),
});

export const residencyFiles = pgTable('residency_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => fileBatches.id),
  buildingId: uuid('building_id').notNull(),
  residencyId: uuid('residency_id').notNull(),
  residencyName: varchar('residency_name', { length: 255 }).notNull(),
  type: fileTypeEnum('type').default('BOLETO').notNull(),
  referenceMonth: varchar('reference_month', { length: 7 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  objectKey: text('object_key').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  contentType: varchar('content_type', { length: 100 }).default('application/pdf').notNull(),
  version: integer('version').default(1).notNull(),
  isCurrent: boolean('is_current').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const fileBatchErrors = pgTable('file_batch_errors', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => fileBatches.id),
  entryName: text('entry_name').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type FileBatch = InferSelectModel<typeof fileBatches>;
export type FileBatchInsert = InferInsertModel<typeof fileBatches>;
export type ResidencyFile = InferSelectModel<typeof residencyFiles>;
export type ResidencyFileInsert = InferInsertModel<typeof residencyFiles>;
export type FileBatchError = InferSelectModel<typeof fileBatchErrors>;
export type FileBatchErrorInsert = InferInsertModel<typeof fileBatchErrors>;
