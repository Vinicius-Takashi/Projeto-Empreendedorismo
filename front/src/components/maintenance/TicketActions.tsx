import { type FormEvent, useState } from 'react';
import { CheckCircle2, CirclePause, CirclePlay, RotateCcw, UserRoundCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  MaintenanceTicketDetails,
  MaintenanceTicketPriority,
  MaintenanceTicketStatus,
} from '../../types/Maintenance';
import hasPermission from '../../helpers/hasPermission';
import { maintenancePermissions, ticketPriorities, waitingStatuses } from './constants';

interface StaffOption {
  id: string;
  name: string;
}

interface TicketActionsProps {
  ticket: MaintenanceTicketDetails;
  staff: StaffOption[];
  isSubmitting: boolean;
  onAction: (action: string, payload?: Record<string, unknown>) => Promise<void>;
}

const actionButton =
  'inline-flex items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50';

export default function TicketActions({
  ticket,
  staff,
  isSubmitting,
  onAction,
}: TicketActionsProps) {
  const { t } = useTranslation();
  const [priority, setPriority] = useState<MaintenanceTicketPriority>(ticket.priority);
  const [dueAt, setDueAt] = useState(ticket.dueAt?.slice(0, 16) ?? '');
  const [assignedToUserId, setAssignedToUserId] = useState(ticket.assignedToUserId ?? '');
  const [waitingStatus, setWaitingStatus] = useState<MaintenanceTicketStatus>('WAITING_RESIDENT');
  const [resolution, setResolution] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const userId = localStorage.getItem('userId');
  const canTriage = hasPermission([maintenancePermissions.triage]);
  const canWork = hasPermission([maintenancePermissions.work, maintenancePermissions.triage]);
  const canClose = hasPermission([maintenancePermissions.close]);
  const canWorkOnTicket =
    canWork && (!ticket.assignedToUserId || ticket.assignedToUserId === userId || canTriage);
  const canCancel =
    ['OPEN', 'UNDER_REVIEW'].includes(ticket.status) &&
    (ticket.openedByUserId === userId || canTriage);

  function submitAction(action: string, payload?: Record<string, unknown>) {
    return (event: FormEvent) => {
      event.preventDefault();
      void onAction(action, payload);
    };
  }

  if (
    !canTriage &&
    !canWorkOnTicket &&
    !canClose &&
    !canCancel &&
    !(['RESOLVED', 'CLOSED'].includes(ticket.status) && canTriage)
  ) {
    return null;
  }

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4">
      <h3 className="mb-3 text-sm font-bold tracking-wide text-neutral-300 uppercase">
        {t('maintenance:actions.title')}
      </h3>

      <div className="grid gap-3">
        {ticket.status === 'OPEN' && canTriage && (
          <form
            className="grid gap-2 rounded-md border border-neutral-800 p-3 md:grid-cols-3"
            onSubmit={submitAction('triage', {
              priority,
              dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
            })}
          >
            <select
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              value={priority}
              onChange={(event) => setPriority(event.target.value as MaintenanceTicketPriority)}
            >
              {ticketPriorities.map((value) => (
                <option key={value} value={value}>
                  {t(`maintenance:priority.${value}`)}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
            <button type="submit" className={actionButton} disabled={isSubmitting}>
              <CheckCircle2 size={16} /> {t('maintenance:actions.triage')}
            </button>
          </form>
        )}

        {['OPEN', 'UNDER_REVIEW'].includes(ticket.status) && canTriage && (
          <form
            className="flex flex-wrap gap-2"
            onSubmit={submitAction('assign', { assignedToUserId })}
          >
            <select
              className="min-w-48 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              value={assignedToUserId}
              onChange={(event) => setAssignedToUserId(event.target.value)}
              required
            >
              <option value="">{t('maintenance:actions.selectAssignee')}</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            <button type="submit" className={actionButton} disabled={isSubmitting}>
              <UserRoundCheck size={16} /> {t('maintenance:actions.assign')}
            </button>
          </form>
        )}

        {['UNDER_REVIEW', ...waitingStatuses].includes(ticket.status) && canWorkOnTicket && (
          <button
            type="button"
            className={actionButton}
            disabled={isSubmitting}
            onClick={() => void onAction('start')}
          >
            <CirclePlay size={16} /> {t('maintenance:actions.start')}
          </button>
        )}

        {ticket.status === 'IN_PROGRESS' && canWorkOnTicket && (
          <>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={submitAction('wait', { status: waitingStatus })}
            >
              <select
                className="min-w-48 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                value={waitingStatus}
                onChange={(event) =>
                  setWaitingStatus(event.target.value as MaintenanceTicketStatus)
                }
              >
                {waitingStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(`maintenance:status.${status}`)}
                  </option>
                ))}
              </select>
              <button type="submit" className={actionButton} disabled={isSubmitting}>
                <CirclePause size={16} /> {t('maintenance:actions.wait')}
              </button>
            </form>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={submitAction('resolve', { resolution })}
            >
              <input
                className="min-w-48 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                minLength={3}
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                placeholder={t('maintenance:actions.resolutionPlaceholder')}
                required
              />
              <button type="submit" className={actionButton} disabled={isSubmitting}>
                <CheckCircle2 size={16} /> {t('maintenance:actions.resolve')}
              </button>
            </form>
          </>
        )}

        {ticket.status === 'RESOLVED' && canClose && (
          <button
            type="button"
            className={actionButton}
            disabled={isSubmitting}
            onClick={() => void onAction('close')}
          >
            <CheckCircle2 size={16} /> {t('maintenance:actions.close')}
          </button>
        )}

        {['RESOLVED', 'CLOSED'].includes(ticket.status) && canTriage && (
          <button
            type="button"
            className={actionButton}
            disabled={isSubmitting}
            onClick={() => void onAction('reopen')}
          >
            <RotateCcw size={16} /> {t('maintenance:actions.reopen')}
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            className={`${actionButton} border-red-900/70 text-red-300 hover:bg-red-950/40`}
            disabled={isSubmitting}
            onClick={() => void onAction('cancel')}
          >
            {t('maintenance:actions.cancel')}
          </button>
        )}

        {['OPEN', 'UNDER_REVIEW'].includes(ticket.status) && canTriage && (
          <form
            className="flex flex-wrap gap-2"
            onSubmit={submitAction('reject', { reason: rejectReason })}
          >
            <input
              className="min-w-48 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder={t('maintenance:actions.rejectPlaceholder')}
            />
            <button
              type="submit"
              className={`${actionButton} border-red-900/70 text-red-300 hover:bg-red-950/40`}
              disabled={isSubmitting}
            >
              {t('maintenance:actions.reject')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
