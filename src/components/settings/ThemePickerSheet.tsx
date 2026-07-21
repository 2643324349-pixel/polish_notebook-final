import { Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useSettingsStore,
  type ThemeMode,
} from '@/store/settingsStore';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: ThemeMode[] = ['light', 'dark', 'system'];

interface ThemePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemePickerSheet({ open, onOpenChange }: ThemePickerSheetProps) {
  const { t } = useTranslation();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const handleSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t('settings.themeMode')}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1">
          {THEME_OPTIONS.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleSelect(mode)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors hover:bg-muted',
                themeMode === mode && 'bg-muted font-medium',
              )}
            >
              {t(`settings.theme.${mode}`)}
              {themeMode === mode && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
