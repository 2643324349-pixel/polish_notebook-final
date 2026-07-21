import { changeAppLanguage } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import type { UILang } from '@/types';
import { SUPPORTED_UI_LANGS } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/t';

export function SidebarLanguageSwitcher() {
  const { t } = useTranslation();
  const uiLang = useSettingsStore((s) => s.uiLang);
  const setUiLang = useSettingsStore((s) => s.setUiLang);

  const handleSelect = (lang: UILang) => {
    setUiLang(lang);
    changeAppLanguage(lang);
  };

  return (
    <div className="px-3 pb-2">
      <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
        {t('layout.sidebar.language')}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SUPPORTED_UI_LANGS.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => handleSelect(lang)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
              uiLang === lang
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {t(`settings.language.${lang}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
