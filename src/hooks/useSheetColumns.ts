import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { updateSheet } from '@/lib/api/sheets';
import { t } from '@/lib/i18n/t';
import {
  addColumnToConfig,
  addColumnToCellsData,
  createColumnFromPreset,
  createCustomNoteColumn,
  isColumnDuplicate,
  removeColumnFromCellsData,
  removeColumnFromConfig,
  renameColumnLabel,
  reorderColumnsInConfig,
} from '@/lib/sheet/columnUtils';
import { getOrderedVisibleColumns } from '@/lib/sheet/defaultSheet';
import type { ColumnPresetOption } from '@/lib/sheet/columnPresets';
import type { ColumnsConfig, Sheet } from '@/types';

const SAVE_DEBOUNCE_MS = 500;

interface UseSheetColumnsOptions {
  sheet: Sheet | null;
  onSheetChange: (sheet: Sheet) => void;
  onRowsUpdate: (
    updates: { rowId: string; cellsData: import('@/types').CellsData }[],
  ) => Promise<void>;
  rowIds: string[];
  getRowCells: (rowId: string) => import('@/types').CellsData;
}

export function useSheetColumns({
  sheet,
  onSheetChange,
  onRowsUpdate,
  rowIds,
  getRowCells,
}: UseSheetColumnsOptions) {
  const [columnsConfig, setColumnsConfig] = useState<ColumnsConfig | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConfigRef = useRef<ColumnsConfig | null>(null);

  useEffect(() => {
    setColumnsConfig(sheet?.columns_config ?? null);
  }, [sheet?.id, sheet?.columns_config]);

  const visibleColumns = useMemo(() => {
    if (!columnsConfig) return [];
    return getOrderedVisibleColumns(columnsConfig);
  }, [columnsConfig]);

  const flushSave = useCallback(async () => {
    if (!sheet || !pendingConfigRef.current) return;

    const config = pendingConfigRef.current;
    pendingConfigRef.current = null;

    try {
      const updated = await updateSheet(sheet.id, { columns_config: config });
      onSheetChange(updated);
    } catch (error) {
      console.error('Failed to save columns:', error);
      toast.error(t('sheet.toast.columnConfigSaveFailed'));
    }
  }, [sheet, onSheetChange]);

  const scheduleSave = useCallback(
    (config: ColumnsConfig) => {
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

  const applyConfig = useCallback(
    (config: ColumnsConfig, persist = true) => {
      setColumnsConfig(config);
      if (persist) scheduleSave(config);
    },
    [scheduleSave],
  );

  const addColumn = useCallback(
    async (preset: ColumnPresetOption) => {
      if (!columnsConfig) return false;

      if (isColumnDuplicate(columnsConfig, preset)) {
        toast.error(t('sheet.columns.alreadyAdded'));
        return false;
      }

      const column = createColumnFromPreset(preset);
      const next = addColumnToConfig(columnsConfig, column);
      applyConfig(next);

      if (rowIds.length > 0) {
        await onRowsUpdate(
          rowIds.map((rowId) => ({
            rowId,
            cellsData: addColumnToCellsData(getRowCells(rowId), column),
          })),
        );
      }

      return true;
    },
    [columnsConfig, applyConfig, rowIds, onRowsUpdate, getRowCells],
  );

  const addCustomColumn = useCallback(
    async (label: string) => {
      if (!columnsConfig) return false;

      const column = createCustomNoteColumn(label);
      const next = addColumnToConfig(columnsConfig, column);
      applyConfig(next);

      if (rowIds.length > 0) {
        await onRowsUpdate(
          rowIds.map((rowId) => ({
            rowId,
            cellsData: addColumnToCellsData(getRowCells(rowId), column),
          })),
        );
      }

      return true;
    },
    [columnsConfig, applyConfig, rowIds, onRowsUpdate, getRowCells],
  );

  const deleteColumn = useCallback(
    async (columnId: string) => {
      if (!columnsConfig) return;

      const next = removeColumnFromConfig(columnsConfig, columnId);
      if (!next) return;

      applyConfig(next, false);

      try {
        const updated = await updateSheet(sheet!.id, { columns_config: next });
        onSheetChange(updated);

        if (rowIds.length > 0) {
          await onRowsUpdate(
            rowIds.map((rowId) => ({
              rowId,
              cellsData: removeColumnFromCellsData(
                getRowCells(rowId),
                columnId,
              ),
            })),
          );
        }
      } catch (error) {
        console.error('Failed to delete column:', error);
        toast.error(t('sheet.toast.deleteColumnFailed'));
        setColumnsConfig(columnsConfig);
      }
    },
    [
      columnsConfig,
      sheet,
      onSheetChange,
      rowIds,
      onRowsUpdate,
      getRowCells,
      applyConfig,
    ],
  );

  const renameColumn = useCallback(
    (columnId: string, label: string) => {
      if (!columnsConfig) return;
      const next = renameColumnLabel(columnsConfig, columnId, label);
      if (!next) return;
      applyConfig(next);
    },
    [columnsConfig, applyConfig],
  );

  const reorderColumns = useCallback(
    (activeId: string, overId: string) => {
      if (!columnsConfig) return;
      const next = reorderColumnsInConfig(columnsConfig, activeId, overId);
      if (!next) return;
      applyConfig(next);
    },
    [columnsConfig, applyConfig],
  );

  return {
    columnsConfig,
    visibleColumns,
    addColumn,
    addCustomColumn,
    deleteColumn,
    renameColumn,
    reorderColumns,
  };
}
