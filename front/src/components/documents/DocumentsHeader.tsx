import { FileText, Home, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentViewMode, DocumentViewOption } from './types';

interface DocumentsHeaderProps {
  activeMode: DocumentViewMode;
  options: DocumentViewOption[];
  onModeChange: (mode: DocumentViewMode) => void;
}

const iconByMode = {
  upload: Upload,
  residency: Home,
};

export default function DocumentsHeader({
  activeMode,
  options,
  onModeChange,
}: DocumentsHeaderProps) {
  const { t } = useTranslation();
  const ActiveIcon = iconByMode[activeMode];

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-cyan-300">
        <ActiveIcon size={22} />
        <h1 className="text-2xl font-bold text-neutral-100">
          {t(`documents:views.${activeMode}.title`)}
        </h1>
      </div>

      {options.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {options.map((option) => {
            const Icon = iconByMode[option.mode] ?? FileText;
            const isActive = option.mode === activeMode;

            return (
              <button
                key={option.mode}
                type="button"
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'border-cyan-300 bg-cyan-300 text-neutral-950'
                    : 'border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-800'
                }`}
                onClick={() => onModeChange(option.mode)}
              >
                <Icon size={16} />
                {t(`documents:views.${option.mode}.label`)}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
