import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { clampFreezeConfig } from '@/lib/sheet/freezeUtils';
import { useTranslation } from '@/lib/i18n/t';
import type { FrozenConfig } from '@/types';

interface FreezeConfigPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FrozenConfig;
  columnCount: number;
  onSave: (config: FrozenConfig) => void;
  onReset: () => void;
}

export function FreezeConfigPanel({
  open,
  onOpenChange,
  config,
  columnCount,
  onSave,
  onReset,
}: FreezeConfigPanelProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(config);

  useEffect(() => {
    if (open) setDraft(config);
  }, [open, config]);

  const maxCols = Math.max(0, columnCount - 1);

  const handleSave = () => {
    onSave(clampFreezeConfig(draft, columnCount));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('sheet.freeze.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="freeze-rows">{t('sheet.freeze.freezeRowsLabel')}</Label>
            <input
              id="freeze-rows"
              type="range"
              min={0}
              max={5}
              value={draft.freeze_rows}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  freeze_rows: Number(e.target.value),
                }))
              }
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              {t('sheet.freeze.freezeRowsHint', { count: draft.freeze_rows })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="freeze-cols">{t('sheet.freeze.freezeColsLabel')}</Label>
            <input
              id="freeze-cols"
              type="range"
              min={0}
              max={Math.min(5, maxCols)}
              value={Math.min(draft.freeze_cols, maxCols)}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  freeze_cols: Number(e.target.value),
                }))
              }
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              {t('sheet.freeze.freezeColsHint', {
                count: Math.min(draft.freeze_cols, maxCols),
                max: maxCols,
              })}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onReset}>
            {t('sheet.freeze.reset')}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
