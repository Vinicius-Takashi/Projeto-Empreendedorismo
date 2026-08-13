import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useService from '../../helpers/useService';
import { useToast } from '../Toast';
import type { ResidencyFile } from './types';

type DocumentListProps = {
  scope: 'residency';
};

function formatBytes(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale);
}

export default function DocumentList({ scope }: DocumentListProps) {
  const { i18n, t } = useTranslation();
  const fileService = useService('file');
  const { notifyError } = useToast();
  const [files, setFiles] = useState<ResidencyFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const locale = i18n.resolvedLanguage || i18n.language;

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fileService.get<ResidencyFile[]>('/files', {
        params: { scope },
      });
      setFiles(response.data);
    } catch (error) {
      console.error(error);
      notifyError(t('common:error'), t('documents:list.toast.listError'));
    } finally {
      setIsLoading(false);
    }
  }, [fileService, notifyError, scope, t]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  async function handleDownload(fileId: string) {
    setDownloadingId(fileId);
    try {
      const response = await fileService.post<{ url: string }>(`/files/${fileId}/download-url`);
      window.open(response.data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(error);
      notifyError(t('common:error'), t('documents:list.toast.downloadError'));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-2 rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={fetchFiles}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
          {isLoading ? t('documents:list.updating') : t('documents:list.refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-400">{t('common:loadingEllipsis')}</div>
      ) : files.length === 0 ? (
        <div className="text-sm text-neutral-400">{t('documents:list.empty')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-neutral-400 uppercase">
              <tr>
                <th className="py-2 pr-4">{t('documents:table.referenceMonth')}</th>
                <th className="py-2 pr-4">{t('documents:table.file')}</th>
                <th className="py-2 pr-4">{t('documents:table.size')}</th>
                <th className="py-2 pr-4">{t('documents:table.version')}</th>
                <th className="py-2 pr-4">{t('documents:table.createdAt')}</th>
                <th className="py-2 text-right">{t('documents:table.action')}</th>
              </tr>
            </thead>
            <tbody className="text-neutral-200">
              {files.map((file) => (
                <tr key={file.id} className="border-t border-neutral-800">
                  <td className="py-2 pr-4">{file.referenceMonth}</td>
                  <td className="py-2 pr-4">{file.originalName}</td>
                  <td className="py-2 pr-4">{formatBytes(file.sizeBytes)}</td>
                  <td className="py-2 pr-4">{file.version}</td>
                  <td className="py-2 pr-4">{formatDate(file.createdAt, locale)}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => handleDownload(file.id)}
                      disabled={downloadingId === file.id}
                    >
                      <Download size={16} />
                      {downloadingId === file.id
                        ? t('documents:list.downloading')
                        : t('documents:list.download')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
