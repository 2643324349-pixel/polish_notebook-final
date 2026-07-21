import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/t';
import { useSelectionStore } from '@/store/selectionStore';

interface BulkActionBarProps {
  actionableCount: number;
  hideableCount: number;
  showableCount: number;
  onHide: () => void;
  onShow: () => void;
  busy?: boolean;
}

export function BulkActionBar({
  actionableCount,
  hideableCount,
  showableCount,
  onHide,
  onShow,
  busy = false,
}: BulkActionBarProps) {
  const { t } = useTranslation();
  const { selectedCells } = useSelectionStore();

  return (
    <div className="fixed inset-x-0 bottom-0 z-[500] border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 md:bottom-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t('common.selectedWithActionable', {
            selected: selectedCells.length,
            actionable: actionableCount,
          })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || hideableCount === 0}
            className="gap-1.5"
            onClick={onHide}
          >
            <EyeOff className="size-4" />
            {t('sheet.selection.hide')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || showableCount === 0}
            className="gap-1.5"
            onClick={onShow}
          >
            <Eye className="size-4" />
            {t('sheet.selection.show')}
          </Button>
        </div>
      </div>
    </div>
  );
}
