import { ClipboardList, Plus, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type MaintenanceViewMode = 'tickets' | 'create';

interface MaintenanceHeaderProps {
  activeMode: MaintenanceViewMode;
  canCreate: boolean;
  onModeChange: (mode: MaintenanceViewMode) => void;
}

const iconByMode = {
  tickets: ClipboardList,
  create: Plus,
};

export default function MaintenanceHeader({
  activeMode,
  canCreate,
  onModeChange,
}: MaintenanceHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-cyan-300">
          <Wrench size={24} />
          <h1 className="text-2xl font-bold text-neutral-100">{t('maintenance:title')}</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-400">{t('maintenance:subtitle')}</p>
      </div>

      <div className="flex rounded-lg border border-neutral-800 bg-neutral-950 p-1">
        {(['tickets', ...(canCreate ? (['create'] as const) : [])] as MaintenanceViewMode[]).map(
          (mode) => {
            const Icon = iconByMode[mode];
            const active = mode === activeMode;

            return (
              <button
                key={mode}
                type="button"
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  active ? 'bg-cyan-300 text-neutral-950' : 'text-neutral-300 hover:bg-neutral-800'
                }`}
                onClick={() => onModeChange(mode)}
              >
                <Icon size={16} />
                {t(`maintenance:views.${mode}`)}
              </button>
            );
          },
        )}
      </div>
    </header>
  );
}
