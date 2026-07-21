import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { t } from '@/lib/i18n/t';
import type { UILang } from '@/types';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  uiLang: UILang;
  themeMode: ThemeMode;
  setUiLang: (lang: UILang) => void;
  setThemeMode: (mode: ThemeMode) => void;
  getLangLabel: (lang?: UILang) => string;
  getThemeLabel: (mode?: ThemeMode) => string;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      uiLang: 'en' as UILang,
      themeMode: 'system',
      setUiLang: (uiLang) => set({ uiLang }),
      setThemeMode: (themeMode) => set({ themeMode }),
      getLangLabel: (lang) => t(`settings.language.${lang ?? get().uiLang}`),
      getThemeLabel: (mode) => t(`settings.theme.${mode ?? get().themeMode}`),
    }),
    {
      name: 'polish-notebook-settings',
      partialize: (state) => ({
        uiLang: state.uiLang,
        themeMode: state.themeMode,
      }),
    },
  ),
);
