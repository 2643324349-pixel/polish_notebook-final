import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/t';
import { useSelectionStore } from '@/store/selectionStore';

interface SelectionModeBarProps {
  totalCells: number;
  onToggleAll: () => void;
  onDone: () => void;
}

export function SelectionModeBar({
  totalCells,
  onToggleAll,
  onDone,
}: SelectionModeBarProps) {
  const { t } = useTranslation();
  const { selectedCells, allSelected } = useSelectionStore();

  return (
    <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={allSelected && totalCells > 0}
            onCheckedChange={() => onToggleAll()}
          />
          {t('sheet.selection.selectAll')}
        </label>
        <span className="text-sm text-muted-foreground">
          {t('common.selectedCount', { count: selectedCells.length })}
        </span>
      </div>
      <Button type="button" variant="default" size="sm" onClick={onDone}>
        {t('sheet.selection.done')}
      </Button>
    </div>
  );
}
