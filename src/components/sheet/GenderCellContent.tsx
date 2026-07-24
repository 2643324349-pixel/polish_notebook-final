import { Eye } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  cellHasAiGenerated,
  getCellDisplayLines,
} from '@/lib/sheet/cellUtils';
import { useTranslation } from '@/lib/i18n/t';
import { SHEET_CELL_TEXT_CLASS } from '@/lib/sheet/sheetStyles';
import { cn } from '@/lib/utils';
import type { CellData } from '@/types';

interface GenderCellContentProps {
  cell: CellData | undefined;
  hidden: boolean;
  empty: boolean;
  marked?: boolean;
  hasGenerateButton?: boolean;
  hasSelectionCheckbox?: boolean;
}

export function GenderCellContent({
  cell,
  hidden,
  empty,
  marked = false,
  hasGenerateButton = false,
  hasSelectionCheckbox = false,
}: GenderCellContentProps) {
  const { t } = useTranslation();
  const lines = getCellDisplayLines(cell);
  const aiGenerated = cellHasAiGenerated(cell);

  return (
    <>
      {hidden && (
        <Eye
          className={cn(
            'absolute top-1 size-3',
            marked ? 'opacity-70' : 'text-muted-foreground',
            hasGenerateButton ? 'right-14' : 'right-1',
          )}
        />
      )}
      {lines.length > 0 ? (
        <div
          className={cn(
            'space-y-0.5 break-words [overflow-wrap:anywhere]',
            SHEET_CELL_TEXT_CLASS,
            hasSelectionCheckbox && 'pl-4 pt-3',
          )}
        >
          {lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                'break-words [overflow-wrap:anywhere]',
                hidden && !marked && 'text-muted-foreground',
                hidden && marked && 'opacity-70',
                hidden && line === '•••' && 'tracking-wider',
              )}
            >
              {line}
            </div>
          ))}
        </div>
      ) : (
        <span
          className={cn(
            marked ? 'opacity-50' : 'text-muted-foreground/40',
          )}
        >
          {t('common.notAvailable')}
        </span>
      )}
      {aiGenerated && !hidden && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'absolute bottom-0.5 right-0.5 rounded px-1 py-px text-[10px] font-semibold leading-none',
                marked
                  ? 'bg-black/15 text-inherit'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
              )}
            >
              {t('sheet.cell.aiGenerated')}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {t('sheet.cell.aiTooltip')}
          </TooltipContent>
        </Tooltip>
      )}
      {empty && !hidden && (
        <span className="sr-only">{t('common.emptyCell')}</span>
      )}
    </>
  );
}
