import { changeAppLanguage } from '@/i18n';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useSettingsStore } from '@/store/settingsStore';
import type { UILang } from '@/types';
import { SUPPORTED_UI_LANGS } from '@/types';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface LanguagePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LanguagePickerSheet({
  open,
  onOpenChange,
}: LanguagePickerSheetProps) {
  const { t } = useTranslation();
  const uiLang = useSettingsStore((s) => s.uiLang);
  const setUiLang = useSettingsStore((s) => s.setUiLang);

  const handleSelect = (lang: UILang) => {
    setUiLang(lang);
    changeAppLanguage(lang);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t('settings.changeLanguage')}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1">
          {SUPPORTED_UI_LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleSelect(lang)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors hover:bg-muted',
                uiLang === lang && 'bg-muted font-medium',
              )}
            >
              {t(`settings.language.${lang}`)}
              {uiLang === lang && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
