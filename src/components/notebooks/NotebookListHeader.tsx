import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND_RED } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';

interface NotebookListHeaderProps {
  count: number;
  onNewNotebook: () => void;
}

export function NotebookListHeader({
  count,
  onNewNotebook,
}: NotebookListHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('notebooks.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('common.notebooksCount', { count })}
        </p>
      </div>
      <Button
        onClick={onNewNotebook}
        className="shrink-0 rounded-full px-5 text-white hover:opacity-90"
        style={{ backgroundColor: BRAND_RED }}
      >
        <Plus className="size-4" />
        {t('notebooks.new')}
      </Button>
    </div>
  );
}
