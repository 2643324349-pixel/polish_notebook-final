import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { createRow, deleteRow, sortRowsByOrder } from '@/lib/api/rows';
import { updateSheet } from '@/lib/api/sheets';
import { t } from '@/lib/i18n/t';
import { createEmptyCellsData } from '@/lib/sheet/defaultSheet';
import type { Row, Sheet } from '@/types';

const SAVE_DEBOUNCE_MS = 500;

interface UseSheetRowsOptions {
  sheet: Sheet | null;
  rows: Row[];
  setRows: (rows: Row[] | ((prev: Row[]) => Row[])) => void;
  onSheetChange: (sheet: Sheet) => void;
}

export function useSheetRows({
  sheet,
  rows,
  setRows,
  onSheetChange,
}: UseSheetRowsOptions) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOrderRef = useRef<string[] | null>(null);

  const flushSave = useCallback(async () => {
    if (!sheet || !pendingOrderRef.current) return;

    const order = pendingOrderRef.current;
    pendingOrderRef.current = null;

    try {
      const updated = await updateSheet(sheet.id, { rows_order: order });
      onSheetChange(updated);
    } catch (error) {
      console.error('Failed to save row order:', error);
      toast.error(t('sheet.toast.rowOrderSaveFailed'));
    }
  }, [sheet, onSheetChange]);

  const scheduleSave = useCallback(
    (order: string[]) => {
      pendingOrderRef.current = order;
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

  const addRow = useCallback(async () => {
    if (!sheet) return;

    try {
      const cellsData = createEmptyCellsData(sheet.columns_config.columns);
      const row = await createRow(sheet.id, cellsData);
      const nextOrder = [...(sheet.rows_order ?? []), row.id];

      setRows((prev) => sortRowsByOrder([...prev, row], nextOrder));
      onSheetChange({ ...sheet, rows_order: nextOrder });

      try {
        const updated = await updateSheet(sheet.id, { rows_order: nextOrder });
        onSheetChange(updated);
      } catch (error) {
        setRows((prev) => prev.filter((item) => item.id !== row.id));
        onSheetChange(sheet);
        void deleteRow(row.id).catch(() => undefined);
        throw error;
      }
    } catch (error) {
      console.error('Failed to add row:', error);
      toast.error(t('sheet.toast.addRowFailed'));
    }
  }, [sheet, setRows, onSheetChange]);

  const deleteRowById = useCallback(
    async (rowId: string) => {
      if (!sheet) return;

      const previousRows = rows;
      const previousOrder = sheet.rows_order ?? [];
      const nextOrder = previousOrder.filter((id) => id !== rowId);

      setRows((prev) => prev.filter((row) => row.id !== rowId));
      onSheetChange({ ...sheet, rows_order: nextOrder });

      try {
        await deleteRow(rowId);
        const updated = await updateSheet(sheet.id, { rows_order: nextOrder });
        onSheetChange(updated);
      } catch (error) {
        setRows(previousRows);
        onSheetChange(sheet);
        console.error('Failed to delete row:', error);
        toast.error(t('sheet.toast.deleteRowFailed'));
      }
    },
    [sheet, rows, setRows, onSheetChange],
  );

  const reorderRows = useCallback(
    (ordered: Row[]) => {
      setRows(ordered);
      scheduleSave(ordered.map((row) => row.id));
    },
    [setRows, scheduleSave],
  );

  return {
    addRow,
    deleteRow: deleteRowById,
    reorderRows,
  };
}
