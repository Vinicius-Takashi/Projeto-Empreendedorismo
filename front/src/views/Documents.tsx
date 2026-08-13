import { useState } from 'react';
import DocumentList from '../components/documents/DocumentList';
import DocumentsHeader from '../components/documents/DocumentsHeader';
import DocumentUploadForm from '../components/documents/DocumentUploadForm';
import type { DocumentViewMode, DocumentViewOption } from '../components/documents/types';
import { useTranslation } from 'react-i18next';
import hasPermission from '../helpers/hasPermission';
import hasResidency from '../helpers/hasResidency';

function getAvailableViews() {
  const options: DocumentViewOption[] = [];

  if (hasPermission(['@file:upload'])) {
    options.push({ mode: 'upload' });
  }

  if (hasPermission(['@file:view:residency']) && hasResidency()) {
    options.push({ mode: 'residency' });
  }

  return options;
}

function renderDocumentsView(mode: DocumentViewMode) {
  if (mode === 'upload') {
    return <DocumentUploadForm />;
  }

  return <DocumentList scope="residency" />;
}

export default function DocumentsView() {
  const { t } = useTranslation();
  const options = getAvailableViews();
  const [activeMode, setActiveMode] = useState<DocumentViewMode>(options[0]?.mode ?? 'residency');
  const currentMode = options.some((option) => option.mode === activeMode)
    ? activeMode
    : options[0]?.mode;

  if (!currentMode) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-2xl font-bold text-neutral-100">{t('common:accessDenied')}</h1>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-8">
      <DocumentsHeader activeMode={currentMode} options={options} onModeChange={setActiveMode} />
      {renderDocumentsView(currentMode)}
    </div>
  );
}
