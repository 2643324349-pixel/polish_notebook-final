import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { updateSheet } from '@/lib/api/sheets';
import { t } from '@/lib/i18n/t';
import { DEFAULT_FROZEN_CONFIG } from '@/lib/sheet/defaultSheet';
import { clampFreezeConfig } from '@/lib/sheet/freezeUtils';
import type { FrozenConfig, Sheet } from '@/types';

const SAVE_DEBOUNCE_MS = 500;

interface UseSheetFreezeOptions {
  sheet: Sheet | null;
  columnCount: number;
  onSheetChange: (sheet: Sheet) => void;
}

export function useSheetFreeze({
  sheet,
  columnCount,
  onSheetChange,
}: UseSheetFreezeOptions) {
  const [frozenConfig, setFrozenConfig] = useState<FrozenConfig>(
    DEFAULT_FROZEN_CONFIG,
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConfigRef = useRef<FrozenConfig | null>(null);

  useEffect(() => {
    const config = sheet?.frozen_config ?? DEFAULT_FROZEN_CONFIG;
    setFrozenConfig(clampFreezeConfig(config, columnCount));
  }, [sheet?.id, sheet?.frozen_config, columnCount]);

  const flushSave = useCallback(async () => {
    if (!sheet || !pendingConfigRef.current) return;

    const config = pendingConfigRef.current;
    pendingConfigRef.current = null;

    try {
      const updated = await updateSheet(sheet.id, { frozen_config: config });
      onSheetChange(updated);
    } catch (error) {
      console.error('Failed to save freeze config:', error);
      toast.error(t('sheet.toast.freezeSaveFailed'));
    }
  }, [sheet, onSheetChange]);

  const scheduleSave = useCallback(
    (config: FrozenConfig) => {
      pendingConfigRef.current = config;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void flushSave();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const updateFrozenConfig = useCallback(
    (next: FrozenConfig) => {
      const clamped = clampFreezeConfig(next, columnCount);
      setFrozenConfig(clamped);
      scheduleSave(clamped);
    },
    [columnCount, scheduleSave],
  );

  const resetFrozenConfig = useCallback(() => {
    updateFrozenConfig({ freeze_rows: 0, freeze_cols: 0 });
  }, [updateFrozenConfig]);

  return {
    frozenConfig,
    updateFrozenConfig,
    resetFrozenConfig,
  };
}
