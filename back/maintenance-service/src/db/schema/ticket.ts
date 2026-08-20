import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const ticketStatusEnum = pgEnum('maintenance_ticket_status', [
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
]);

export const ticketPriorityEnum = pgEnum('maintenance_ticket_priority', [
  'LOW',
  'NORMAL',
  'HIGH',
  'EMERGENCY',
]);

export const ticketCategoryEnum = pgEnum('maintenance_ticket_category', [
  'PLUMBING',
  'ELECTRICAL',
  'ELEVATOR',
  'CLEANING',
  'SECURITY',
  'COMMON_AREA',
  'STRUCTURAL',
  'OTHER',
]);

export const tickets = pgTable(
  'maintenance_tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    buildingId: uuid('building_id').notNull(),
    residencyId: uuid('residency_id'),
    openedByUserId: uuid('opened_by_user_id').notNull(),
    assignedToUserId: uuid('assigned_to_user_id'),
    category: ticketCategoryEnum('category').notNull(),
    title: varchar('title', { length: 160 }).notNull(),
    description: text('description').notNull(),
    location: varchar('location', { length: 255 }),
    priority: ticketPriorityEnum('priority').default('NORMAL').notNull(),
    status: ticketStatusEnum('status').default('OPEN').notNull(),
    resolution: text('resolution'),
    dueAt: timestamp('due_at'),
    resolvedAt: timestamp('resolved_at'),
    closedAt: timestamp('closed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('maintenance_tickets_building_status_idx').on(table.buildingId, table.status),
    index('maintenance_tickets_opened_by_idx').on(table.openedByUserId),
    index('maintenance_tickets_assigned_to_idx').on(table.assignedToUserId),
  ],
);

export const ticketComments = pgTable(
  'maintenance_ticket_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id').notNull(),
    content: text('content').notNull(),
    internal: boolean('internal').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('maintenance_comments_ticket_idx').on(table.ticketId)],
);

export const ticketAttachments = pgTable(
  'maintenance_ticket_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id').notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    attachmentType: varchar('attachment_type', { length: 40 }).default('OTHER').notNull(),
    uploadedByUserId: uuid('uploaded_by_user_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('maintenance_attachments_file_id_idx').on(table.fileId)],
);

export const ticketHistory = pgTable(
  'maintenance_ticket_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    actorUserId: uuid('actor_user_id'),
    eventType: varchar('event_type', { length: 80 }).notNull(),
    previousValue: text('previous_value'),
    newValue: text('new_value'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('maintenance_history_ticket_idx').on(table.ticketId)],
);

export type Ticket = InferSelectModel<typeof tickets>;
export type TicketInsert = InferInsertModel<typeof tickets>;
export type TicketComment = InferSelectModel<typeof ticketComments>;
export type TicketAttachment = InferSelectModel<typeof ticketAttachments>;
export type TicketHistory = InferSelectModel<typeof ticketHistory>;
