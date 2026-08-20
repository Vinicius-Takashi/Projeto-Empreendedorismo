import { type FormEvent, useState } from 'react';
import { Camera, CircleCheck, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useService from '../../helpers/useService';
import { useToast } from '../Toast';
import { attachmentTypes, ticketCategories } from './constants';
import type { MaintenanceTicket } from '../../types/Maintenance';

interface TicketCreateFormProps {
  onCreated: (ticketId: string) => void;
}

export default function TicketCreateForm({ onCreated }: TicketCreateFormProps) {
  const { t } = useTranslation();
  const maintenanceService = useService('maintenance');
  const fileService = useService('file');
  const { notifyError, notifySuccess, notifyWarning } = useToast();
  const [category, setCategory] = useState<(typeof ticketCategories)[number]>('PLUMBING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim().length < 3 || description.trim().length < 3) {
      notifyWarning(t('maintenance:toast.requiredTitle'), t('maintenance:toast.requiredMessage'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await maintenanceService.post<MaintenanceTicket>('/tickets', {
        category,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || undefined,
      });

      if (file) {
        const data = new FormData();
        data.append('file', file);
        data.append('ownerId', response.data.id);
        data.append('attachmentType', attachmentTypes[0]);
        await fileService.post('/files', data);
      }

      notifySuccess(t('maintenance:toast.createdTitle'), t('maintenance:toast.createdMessage'));
      onCreated(response.data.id);
    } catch (error) {
      console.error(error);
      notifyError(t('common:error'), t('maintenance:toast.createError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 md:p-7">
      <div className="mb-6 flex items-start gap-3">
        <span className="rounded-lg bg-cyan-300/10 p-2 text-cyan-300">
          <CircleCheck size={22} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">
            {t('maintenance:create.title')}
          </h2>
          <p className="text-sm text-neutral-400">{t('maintenance:create.description')}</p>
        </div>
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-neutral-300">
            {t('maintenance:fields.category')}
          </span>
          <select
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
          >
            {ticketCategories.map((value) => (
              <option key={value} value={value}>
                {t(`maintenance:category.${value}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-neutral-300">
            {t('maintenance:fields.title')}
          </span>
          <input
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('maintenance:create.titlePlaceholder')}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-neutral-300">
            {t('maintenance:fields.description')}
          </span>
          <textarea
            className="min-h-32 resize-y rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('maintenance:create.descriptionPlaceholder')}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-300">
              <MapPin size={15} /> {t('maintenance:fields.location')}
            </span>
            <input
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
              maxLength={255}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder={t('maintenance:create.locationPlaceholder')}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-300">
              <Camera size={15} /> {t('maintenance:create.attachment')}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-800 file:px-2 file:py-1 file:text-neutral-200"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-md bg-cyan-300 px-4 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('maintenance:create.submitting') : t('maintenance:create.submit')}
        </button>
      </form>
    </section>
  );
}
