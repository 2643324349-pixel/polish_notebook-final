import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useSettingsStore } from '@/store/settingsStore';

/** Sync settingsStore themeMode → next-themes (single source: zustand). */
export function ThemeSync() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const { setTheme } = useTheme();
  const lastAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastAppliedRef.current === themeMode) return;
    lastAppliedRef.current = themeMode;
    setTheme(themeMode);
  }, [themeMode, setTheme]);

  return null;
}
