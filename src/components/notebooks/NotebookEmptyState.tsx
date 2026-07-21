import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND_RED } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';

interface NotebookEmptyStateProps {
  notebookName: string;
  onBack: () => void;
  onCreatePage: () => void;
  creating?: boolean;
}

export function NotebookEmptyState({
  notebookName,
  onBack,
  onCreatePage,
  creating = false,
}: NotebookEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div
        className="mb-6 flex size-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${BRAND_RED}15` }}
      >
        <FileText className="size-8" style={{ color: BRAND_RED }} />
      </div>

      <h2 className="text-xl font-semibold">{notebookName}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t('notebooks.emptyStateDescription')}
      </p>

      <Button
        className="mt-6 rounded-full px-6 text-white hover:opacity-90"
        style={{ backgroundColor: BRAND_RED }}
        onClick={onCreatePage}
        disabled={creating}
      >
        <Plus className="size-4" />
        {creating ? t('notebooks.creating') : t('notebooks.newPage')}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground"
      >
        {t('notebooks.backToList')}
      </button>
    </div>
  );
}
