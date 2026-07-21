import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage, normalizeUILang } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';
/** Keep settingsStore.uiLang and i18next in sync. */
export function LanguageSync() {
  const uiLang = useSettingsStore((s) => s.uiLang);
  const setUiLang = useSettingsStore((s) => s.setUiLang);
  const { i18n } = useTranslation();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (syncingRef.current) return;
    if (i18n.language !== uiLang) {
      syncingRef.current = true;
      changeAppLanguage(uiLang);
      syncingRef.current = false;
    }
  }, [uiLang, i18n.language]);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (syncingRef.current) return;
      const normalized = normalizeUILang(lng);
      if (normalized !== uiLang) {
        syncingRef.current = true;
        setUiLang(normalized);
        syncingRef.current = false;
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n, setUiLang, uiLang]);

  return null;
}
