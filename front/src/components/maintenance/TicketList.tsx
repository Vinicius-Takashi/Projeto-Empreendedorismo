import { AlertTriangle, Clock3, MapPin, RefreshCw, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MaintenanceTicket, MaintenanceTicketStatus } from '../../types/Maintenance';
import { priorityColor, statusColor, ticketStatuses } from './constants';

interface TicketListProps {
  tickets: MaintenanceTicket[];
  selectedId: string | null;
  statusFilter: MaintenanceTicketStatus | '';
  isLoading: boolean;
  residencyNames: Record<string, string>;
  onFilterChange: (status: MaintenanceTicketStatus | '') => void;
  onRefresh: () => void;
  onSelect: (ticketId: string) => void;
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function TicketList({
  tickets,
  selectedId,
  statusFilter,
  isLoading,
  residencyNames,
  onFilterChange,
  onRefresh,
  onSelect,
}: TicketListProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 p-3">
        <select
          aria-label={t('maintenance:list.filter')}
          className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          value={statusFilter}
          onChange={(event) => onFilterChange(event.target.value as MaintenanceTicketStatus | '')}
        >
          <option value="">{t('maintenance:list.allStatuses')}</option>
          {ticketStatuses.map((status) => (
            <option key={status} value={status}>
              {t(`maintenance:status.${status}`)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-md border border-neutral-700 bg-neutral-950 p-2 text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50"
          onClick={onRefresh}
          disabled={isLoading}
          title={t('common:refresh')}
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-4 text-sm text-neutral-400">{t('common:loadingEllipsis')}</div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-neutral-500">
            <Wrench size={28} />
            <p className="text-sm">{t('maintenance:list.empty')}</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedId === ticket.id
                    ? 'border-cyan-400 bg-cyan-400/10'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-900'
                }`}
                onClick={() => onSelect(ticket.id)}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-[11px] font-bold ${statusColor(ticket.status)}`}
                  >
                    {t(`maintenance:status.${ticket.status}`)}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold ${priorityColor(ticket.priority)}`}
                  >
                    {ticket.priority === 'EMERGENCY' && <AlertTriangle size={13} />}
                    {t(`maintenance:priority.${ticket.priority}`)}
                  </span>
                </div>
                <h3 className="line-clamp-2 font-semibold text-neutral-100">{ticket.title}</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  {t(`maintenance:category.${ticket.category}`)}
                  {' · '}
                  {ticket.residencyId
                    ? residencyNames[ticket.residencyId] || t('maintenance:list.residency')
                    : t('common:commonArea')}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                  {ticket.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {ticket.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock3 size={12} /> {formatDate(ticket.createdAt, locale)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
