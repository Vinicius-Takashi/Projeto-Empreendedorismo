import type {
  MaintenanceTicketCategory,
  MaintenanceTicketPriority,
  MaintenanceTicketStatus,
} from '../../types/Maintenance';

export const ticketCategories: MaintenanceTicketCategory[] = [
  'PLUMBING',
  'ELECTRICAL',
  'ELEVATOR',
  'CLEANING',
  'SECURITY',
  'COMMON_AREA',
  'STRUCTURAL',
  'OTHER',
];

export const ticketPriorities: MaintenanceTicketPriority[] = ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'];

export const ticketStatuses: MaintenanceTicketStatus[] = [
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
];

export const waitingStatuses: MaintenanceTicketStatus[] = [
  'WAITING_RESIDENT',
  'WAITING_VENDOR',
  'WAITING_MATERIAL',
];

export const attachmentTypes = [
  'PROBLEM_PHOTO',
  'RESOLUTION_PHOTO',
  'INVOICE',
  'REPORT',
  'OTHER',
] as const;

export const maintenancePermissions = {
  viewBuilding: '@maintenance:ticket:view:building',
  viewResidency: '@maintenance:ticket:view:residency',
  triage: '@maintenance:ticket:triage',
  work: '@maintenance:ticket:work',
  close: '@maintenance:ticket:close',
  internalComment: '@maintenance:ticket:comment:internal',
} as const;

export function statusColor(status: MaintenanceTicketStatus) {
  if (status === 'CLOSED' || status === 'RESOLVED') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  }

  if (status === 'REJECTED' || status === 'CANCELED') {
    return 'border-neutral-600 bg-neutral-800 text-neutral-300';
  }

  if (status.startsWith('WAITING')) {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  }

  if (status === 'IN_PROGRESS') {
    return 'border-blue-500/40 bg-blue-500/10 text-blue-300';
  }

  return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
}

export function priorityColor(priority: MaintenanceTicketPriority) {
  if (priority === 'EMERGENCY') return 'text-red-300';
  if (priority === 'HIGH') return 'text-orange-300';
  if (priority === 'LOW') return 'text-neutral-400';
  return 'text-cyan-300';
}
