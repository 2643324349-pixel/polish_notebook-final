import type { ReactNode } from 'react';
import { Pin, Plus, Search, SquareCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';

interface SheetToolbarProps {
  onAddRow: () => void;
  onOpenFreeze: () => void;
  onEnterSelectionMode: () => void;
  onOpenSearch: () => void;
  exportControl?: ReactNode;
  searchOpen?: boolean;
  selectionMode?: boolean;
  busy?: boolean;
}

const iconButtonClass = 'size-8 shrink-0 sm:size-auto sm:gap-1.5';

export function SheetToolbar({
  onAddRow,
  onOpenFreeze,
  onEnterSelectionMode,
  onOpenSearch,
  exportControl,
  searchOpen = false,
  selectionMode = false,
  busy = false,
}: SheetToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 border-b px-2 py-2 sm:gap-2 sm:px-4">
      {!selectionMode && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className={iconButtonClass}
            aria-label={t('sheet.toolbar.addRow')}
            onClick={onAddRow}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t('sheet.toolbar.addRow')}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={iconButtonClass}
            aria-label={t('sheet.freeze.srOnly')}
            onClick={onOpenFreeze}
          >
            <Pin className="size-4" />
            <span className="hidden sm:inline">{t('sheet.toolbar.freeze')}</span>
          </Button>
        </>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant={searchOpen ? 'secondary' : 'outline'}
          size="sm"
          disabled={busy}
          className={iconButtonClass}
          onClick={onOpenSearch}
          aria-label={t('sheet.search.open')}
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">{t('sheet.toolbar.search')}</span>
        </Button>
        <div className={cn('[&_button]:size-8 [&_button]:shrink-0 sm:[&_button]:size-auto sm:[&_button]:gap-1.5 [&_button_span]:hidden sm:[&_button_span]:inline')}>
          {exportControl}
        </div>
        <Button
          type="button"
          variant={selectionMode ? 'secondary' : 'outline'}
          size="sm"
          disabled={busy || selectionMode}
          className={iconButtonClass}
          aria-label={t('sheet.toolbar.select')}
          onClick={onEnterSelectionMode}
        >
          <SquareCheck className="size-4" />
          <span className="hidden sm:inline">{t('sheet.toolbar.select')}</span>
        </Button>
      </div>
    </div>
  );
}
