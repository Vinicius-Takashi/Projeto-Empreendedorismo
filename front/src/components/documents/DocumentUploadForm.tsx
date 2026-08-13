import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useService from '../../helpers/useService';
import { useToast } from '../Toast';
import type { FileBatch, FileBatchError } from './types';

interface UploadResponse {
  batch: FileBatch;
  errors: FileBatchError[];
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function DocumentUploadForm() {
  const { t } = useTranslation();
  const fileService = useService('file');
  const { notifyError, notifySuccess } = useToast();
  const [referenceMonth, setReferenceMonth] = useState(getCurrentMonth());
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || !referenceMonth) {
      notifyError(t('common:error'), t('documents:upload.toast.required'));
      return;
    }

    const formData = new FormData();
    formData.append('referenceMonth', referenceMonth);
    formData.append('file', file);

    setIsSubmitting(true);
    try {
      const response = await fileService.post<UploadResponse>('/file-batches', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLastUpload(response.data);
      notifySuccess(t('documents:upload.toast.successTitle'), t('documents:upload.toast.success'));
    } catch (error) {
      console.error(error);
      notifyError(t('common:error'), t('documents:upload.toast.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <form className="grid gap-4 md:grid-cols-[180px_1fr_auto]" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          {t('documents:upload.referenceMonth')}
          <input
            type="month"
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-cyan-300"
            value={referenceMonth}
            onChange={(event) => setReferenceMonth(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          {t('documents:upload.zipFile')}
          <input
            type="file"
            accept=".zip,application/zip"
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-neutral-100"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-end inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload size={16} />
          {isSubmitting ? t('documents:upload.submitting') : t('documents:upload.submit')}
        </button>
      </form>

      {lastUpload && (
        <div className="mt-5 rounded-md border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-200">
          <div className="grid gap-2 md:grid-cols-4">
            <span>
              {t('documents:upload.summary.status')}: {lastUpload.batch.status}
            </span>
            <span>
              {t('documents:upload.summary.total')}: {lastUpload.batch.totalFiles}
            </span>
            <span>
              {t('documents:upload.summary.processed')}: {lastUpload.batch.processedFiles}
            </span>
            <span>
              {t('documents:upload.summary.failed')}: {lastUpload.batch.failedFiles}
            </span>
          </div>

          {lastUpload.errors.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 text-sm font-semibold text-neutral-100">
                {t('documents:upload.errorsTitle')}
              </h2>
              <ul className="grid gap-2">
                {lastUpload.errors.map((error) => (
                  <li key={`${error.entryName}-${error.reason}`} className="text-neutral-400">
                    <span className="text-neutral-200">{error.entryName}</span>: {error.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
