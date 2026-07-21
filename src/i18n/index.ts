import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import de from '@/locales/de.json';
import en from '@/locales/en.json';
import uk from '@/locales/uk.json';
import zhCN from '@/locales/zh-CN.json';
import type { UILang } from '@/types';
import { SUPPORTED_UI_LANGS } from '@/types';

export const I18N_STORAGE_KEY = 'polish-notebook-i18n';

const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
  zh: { translation: zhCN },
  de: { translation: de },
  uk: { translation: uk },
} as const;

export function normalizeUILang(lng: string | undefined): UILang {
  if (!lng) return 'en';
  if (lng === 'zh' || lng.startsWith('zh-')) return 'zh-CN';
  if (lng === 'en' || lng === 'de' || lng === 'uk') return lng;
  return 'en';
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: {
      'zh-CN': ['en'],
      zh: ['zh-CN', 'en'],
      default: ['en'],
    },
    supportedLngs: [...SUPPORTED_UI_LANGS, 'zh'],
    nonExplicitSupportedLngs: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: I18N_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export function changeAppLanguage(lang: UILang): void {
  void i18n.changeLanguage(lang);
}

export function getAppLanguage(): UILang {
  return normalizeUILang(i18n.language);
}

export default i18n;
