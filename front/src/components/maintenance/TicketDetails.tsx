import { type FormEvent, useState } from 'react';
import {
  CalendarClock,
  Download,
  FileUp,
  History,
  MapPin,
  MessageSquare,
  Paperclip,
  UserRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useService from '../../helpers/useService';
import hasPermission from '../../helpers/hasPermission';
import type { MaintenanceTicketDetails } from '../../types/Maintenance';
import { useToast } from '../Toast';
import { attachmentTypes, maintenancePermissions, priorityColor, statusColor } from './constants';
import TicketActions from './TicketActions';

interface PersonOption {
  id: string;
  name: string;
}

interface TicketDetailsProps {
  ticket: MaintenanceTicketDetails | null;
  people: Record<string, string>;
  residencyNames: Record<string, string>;
  staff: PersonOption[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

function formatDate(value: string | null, locale: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function TicketDetails({
  ticket,
  people,
  residencyNames,
  staff,
  isLoading,
  onRefresh,
}: TicketDetailsProps) {
  const { i18n, t } = useTranslation();
  const maintenanceService = useService('maintenance');
  const fileService = useService('file');
  const { notifyError, notifySuccess, notifyWarning } = useToast();
  const [comment, setComment] = useState('');
  const [internalComment, setInternalComment] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<(typeof attachmentTypes)[number]>('OTHER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const locale = i18n.resolvedLanguage || i18n.language;
  const canInternalComment = hasPermission([maintenancePermissions.internalComment]);
  const currentUserId = localStorage.getItem('userId');
  const personName = (userId: string) =>
    userId === currentUserId
      ? t('maintenance:details.you')
      : people[userId] || t('maintenance:details.buildingTeam');

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !comment.trim()) {
      notifyWarning(t('maintenance:toast.requiredTitle'), t('maintenance:comments.required'));
      return;
    }

    setIsSubmitting(true);
    try {
      await maintenanceService.post(`/tickets/${ticket.id}/comments`, {
        content: comment.trim(),
        internal: canInternalComment && internalComment,
      });
      setComment('');
      setInternalComment(false);
      notifySuccess(t('maintenance:toast.commentTitle'), t('maintenance:toast.commentMessage'));
      await onRefresh();
    } catch (error) {
      console.error(error);
      notifyError(t('common:error'), t('maintenance:toast.commentError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAttachment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !attachment) {
      notifyWarning(t('maintenance:toast.requiredTitle'), t('maintenance:attachments.required'));
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('file', attachment);
      data.append('ownerId', ticket.id);
      data.append('attachmentType', attachmentType);
      await fileService.post('/files', data);
      setAttachment(null);
      notifySuccess(t('maintenance:toast.fileTitle'), t('maintenance:toast.fileMessage'));
      await onRefresh();
    } catch (error) {
      console.error(error);
      notifyError(t('common:error'), t('maintenance:toast.fileError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDownload(fileId: string) {
    setDownloadingId(fileId);
    try {
      const response = await fileService.post<{ url: string }>(`/files/${fileId}/download-url`);
      window.open(response.data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(error);
      notifyError(t('common:error'), t('maintenance:toast.downloadError'));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleAction(action: string, payload: Record<string, unknown> = {}) {
    if (!ticket) return;
    setIsSubmitting(true);
    try {
      await maintenanceService.post(`/tickets/${ticket.id}/${action}`, payload);
      notifySuccess(t('maintenance:toast.updatedTitle'), t('maintenance:toast.updatedMessage'));
      await onRefresh();
    } catch (error) {
      console.error(error);
      notifyError(t('common:error'), t('maintenance:toast.actionError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-400">
        {t('common:loadingEllipsis')}
      </section>
    );
  }

  if (!ticket) {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/20 p-8 text-center text-neutral-500">
        <div>
          <WrenchPlaceholder />
          <p className="mt-3 text-sm">{t('maintenance:details.select')}</p>
        </div>
      </section>
    );
  }

  return (
    <article className="min-h-0 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900/40">
      <div className="border-b border-neutral-800 p-5 md:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded border px-2 py-1 text-xs font-bold ${statusColor(ticket.status)}`}
          >
            {t(`maintenance:status.${ticket.status}`)}
          </span>
          <span className={`text-xs font-bold ${priorityColor(ticket.priority)}`}>
            {t(`maintenance:priority.${ticket.priority}`)}
          </span>
          <span className="text-xs text-neutral-500">#{ticket.id.slice(0, 8)}</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-100">{ticket.title}</h2>
        <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-neutral-300">
          {ticket.description}
        </p>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <Info icon={MapPin} label={t('maintenance:fields.location')}>
            {ticket.location || '-'}
          </Info>
          <Info icon={UserRound} label={t('maintenance:fields.residency')}>
            {ticket.residencyId
              ? residencyNames[ticket.residencyId] || ticket.residencyId.slice(0, 8)
              : t('common:commonArea')}
          </Info>
          <Info icon={UserRound} label={t('maintenance:fields.assignee')}>
            {ticket.assignedToUserId
              ? personName(ticket.assignedToUserId)
              : t('maintenance:details.unassigned')}
          </Info>
          <Info icon={CalendarClock} label={t('maintenance:fields.createdAt')}>
            {formatDate(ticket.createdAt, locale)}
          </Info>
          <Info icon={CalendarClock} label={t('maintenance:fields.dueAt')}>
            {formatDate(ticket.dueAt, locale)}
          </Info>
          <Info icon={History} label={t('maintenance:fields.category')}>
            {t(`maintenance:category.${ticket.category}`)}
          </Info>
        </dl>

        {ticket.resolution && (
          <div className="mt-5 rounded-lg border border-emerald-800/60 bg-emerald-950/20 p-4">
            <p className="text-xs font-bold tracking-wide text-emerald-300 uppercase">
              {t('maintenance:fields.resolution')}
            </p>
            <p className="mt-1 text-sm text-neutral-200">{ticket.resolution}</p>
          </div>
        )}
      </div>

      <div className="grid gap-5 p-5 md:p-6">
        <TicketActions
          key={`${ticket.id}-${ticket.status}-${ticket.assignedToUserId}`}
          ticket={ticket}
          staff={staff}
          isSubmitting={isSubmitting}
          onAction={handleAction}
        />

        <section>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-neutral-100">
            <MessageSquare size={18} className="text-cyan-300" />
            {t('maintenance:comments.title')}
          </h3>
          <div className="mb-3 grid gap-2">
            {ticket.comments.length === 0 ? (
              <p className="text-sm text-neutral-500">{t('maintenance:comments.empty')}</p>
            ) : (
              ticket.comments.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 ${
                    item.internal
                      ? 'border-amber-800/60 bg-amber-950/20'
                      : 'border-neutral-800 bg-neutral-950/50'
                  }`}
                >
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-neutral-500">
                    <span>{personName(item.authorUserId)}</span>
                    <span>
                      {item.internal && `${t('maintenance:comments.internal')} · `}
                      {formatDate(item.createdAt, locale)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-neutral-200">
                    {item.content}
                  </p>
                </div>
              ))
            )}
          </div>
          <form className="grid gap-2" onSubmit={handleComment}>
            <textarea
              className="min-h-20 resize-y rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t('maintenance:comments.placeholder')}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              {canInternalComment ? (
                <label className="flex items-center gap-2 text-sm text-neutral-400">
                  <input
                    type="checkbox"
                    checked={internalComment}
                    onChange={(event) => setInternalComment(event.target.checked)}
                  />
                  {t('maintenance:comments.internalOption')}
                </label>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="rounded-md bg-cyan-300 px-3 py-2 text-sm font-bold text-neutral-950 hover:bg-cyan-200 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {t('maintenance:comments.submit')}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-neutral-100">
            <Paperclip size={18} className="text-cyan-300" />
            {t('maintenance:attachments.title')}
          </h3>
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            {ticket.attachments.length === 0 ? (
              <p className="text-sm text-neutral-500">{t('maintenance:attachments.empty')}</p>
            ) : (
              ticket.attachments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/50 p-3 text-left transition hover:border-neutral-700"
                  onClick={() => void handleDownload(item.fileId)}
                  disabled={downloadingId === item.fileId}
                >
                  <Download size={18} className="shrink-0 text-cyan-300" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-neutral-200">
                      {item.fileName}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {t(`maintenance:attachmentType.${item.attachmentType}`, {
                        defaultValue: item.attachmentType,
                      })}{' '}
                      · {formatBytes(item.sizeBytes)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
          <form className="flex flex-wrap gap-2" onSubmit={handleAttachment}>
            <select
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              value={attachmentType}
              onChange={(event) => setAttachmentType(event.target.value as typeof attachmentType)}
            >
              {attachmentTypes.map((value) => (
                <option key={value} value={value}>
                  {t(`maintenance:attachmentType.${value}`)}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="min-w-48 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-neutral-800 file:px-2 file:py-1 file:text-neutral-200"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50"
              disabled={isSubmitting}
            >
              <FileUp size={16} /> {t('maintenance:attachments.submit')}
            </button>
          </form>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-neutral-100">
            <History size={18} className="text-cyan-300" /> {t('maintenance:history.title')}
          </h3>
          <ol className="border-l border-neutral-700 pl-4">
            {ticket.history.map((item) => (
              <li key={item.id} className="relative pb-4 text-sm last:pb-0">
                <span className="absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full bg-cyan-300" />
                <p className="font-medium text-neutral-200">
                  {t(`maintenance:event.${item.eventType}`, { defaultValue: item.eventType })}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDate(item.createdAt, locale)}
                  {item.actorUserId && ` · ${personName(item.actorUserId)}`}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}

function WrenchPlaceholder() {
  return <History size={32} className="mx-auto" />;
}

function Info({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <Icon size={16} className="mt-0.5 shrink-0 text-neutral-500" />
      <div>
        <dt className="text-xs text-neutral-500">{label}</dt>
        <dd className="text-neutral-200">{children}</dd>
      </div>
    </div>
  );
}
