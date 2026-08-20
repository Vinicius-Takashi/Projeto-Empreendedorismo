export type MaintenanceTicketStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'WAITING_RESIDENT'
  | 'WAITING_VENDOR'
  | 'WAITING_MATERIAL'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELED';

export type MaintenanceTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';

export type MaintenanceTicketCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'ELEVATOR'
  | 'CLEANING'
  | 'SECURITY'
  | 'COMMON_AREA'
  | 'STRUCTURAL'
  | 'OTHER';

export interface MaintenanceTicket {
  id: string;
  buildingId: string;
  residencyId: string | null;
  openedByUserId: string;
  assignedToUserId: string | null;
  category: MaintenanceTicketCategory;
  title: string;
  description: string;
  location: string | null;
  priority: MaintenanceTicketPriority;
  status: MaintenanceTicketStatus;
  resolution: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceTicketComment {
  id: string;
  ticketId: string;
  authorUserId: string;
  content: string;
  internal: boolean;
  createdAt: string;
}

export interface MaintenanceTicketAttachment {
  id: string;
  ticketId: string;
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  attachmentType: string;
  uploadedByUserId: string;
  createdAt: string;
}

export interface MaintenanceTicketHistory {
  id: string;
  ticketId: string;
  actorUserId: string | null;
  eventType: string;
  previousValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface MaintenanceTicketDetails extends MaintenanceTicket {
  comments: MaintenanceTicketComment[];
  attachments: MaintenanceTicketAttachment[];
  history: MaintenanceTicketHistory[];
}
