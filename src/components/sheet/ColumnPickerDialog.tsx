import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getPosLabel,
  getPresetLabel,
  getPresetsForPos,
  POS_OPTION_KEYS,
  type ColumnPresetOption,
} from '@/lib/sheet/columnPresets';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import type { POS } from '@/types';

interface ColumnPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPreset: (preset: ColumnPresetOption) => void | Promise<void>;
  onAddCustom: (label: string) => void | Promise<void>;
}

export function ColumnPickerDialog({
  open,
  onOpenChange,
  onSelectPreset,
  onAddCustom,
}: ColumnPickerDialogProps) {
  const { t } = useTranslation();
  const [selectedPos, setSelectedPos] = useState<POS | 'custom'>('noun');
  const [customLabel, setCustomLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const presets = useMemo(
    () => getPresetsForPos(selectedPos),
    [selectedPos],
  );

  useEffect(() => {
    if (!open) {
      setSelectedPos('noun');
      setCustomLabel('');
      setSubmitting(false);
    }
  }, [open]);

  const handleSelectPreset = async (preset: ColumnPresetOption) => {
    setSubmitting(true);
    try {
      await onSelectPreset(preset);
      onOpenChange(false);
    } catch {
      toast.error(t('sheet.toast.addColumnFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCustom = async () => {
    const trimmed = customLabel.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await onAddCustom(trimmed);
      onOpenChange(false);
    } catch {
      toast.error(t('sheet.toast.addColumnFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{t('sheet.columnPicker.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-[360px] grid-cols-[180px_1fr]">
          <ScrollArea className="border-r">
            <div className="p-2">
              {POS_OPTION_KEYS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  disabled={submitting}
                  className={cn(
                    'flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                    selectedPos === pos && 'bg-accent font-medium',
                  )}
                  onClick={() => setSelectedPos(pos)}
                >
                  {getPosLabel(pos)}
                </button>
              ))}
            </div>
          </ScrollArea>

          <ScrollArea className="h-[360px]">
            <div className="p-3">
              {selectedPos === 'custom' ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('sheet.columnPicker.addCustomNoteColumn')}
                  </p>
                  <Input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder={t('sheet.columnPicker.columnNamePlaceholder')}
                    disabled={submitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleAddCustom();
                    }}
                  />
                  <Button
                    type="button"
                    disabled={!customLabel.trim() || submitting}
                    onClick={() => void handleAddCustom()}
                  >
                    {t('sheet.columnPicker.add')}
                  </Button>
                </div>
              ) : presets.length === 0 ? (
                <p className="px-2 py-4 text-sm text-muted-foreground">
                  {t('sheet.columnPicker.noPresetsForPos')}
                </p>
              ) : (
                <div className="space-y-1">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={submitting}
                      className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => void handleSelectPreset(preset)}
                    >
                      {getPresetLabel(preset)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
