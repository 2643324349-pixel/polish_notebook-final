import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { fetchRowsForSheet, sortRowsByOrder, updateRow } from '@/lib/api/rows';
import { t } from '@/lib/i18n/t';
import { createEmptyCell } from '@/lib/sheet/defaultSheet';
import { applyRowMarker, buildRowMarkerCellsData } from '@/lib/sheet/rowMeta';
import type { MarkerColor, Row, Sheet } from '@/types';

export function useRows(sheet: Sheet | null) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheetIdRef = useRef<string | undefined>(sheet?.id);

  const sheetId = sheet?.id;
  const rowsOrder = sheet?.rows_order ?? [];
  const rowsOrderKey = rowsOrder.join(',');

  const loadRows = useCallback(async (targetSheet: Sheet) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRowsForSheet({
        id: targetSheet.id,
        rows_order: targetSheet.rows_order ?? [],
      });
      setRows(data);
    } catch (err) {
      console.error('Failed to fetch rows:', err);
      setRows([]);
      setError(t('sheet.toast.rowsLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sheetId || !sheet) {
      sheetIdRef.current = undefined;
      setRows([]);
      return;
    }

    const shouldLoad = sheetIdRef.current !== sheetId;
    sheetIdRef.current = sheetId;

    if (shouldLoad) {
      void loadRows(sheet);
    }
  }, [sheetId, sheet, loadRows]);

  useEffect(() => {
    if (!sheetId) return;

    setRows((prev) => {
      if (prev.length === 0) return prev;
      return sortRowsByOrder(prev, rowsOrder);
    });
  }, [sheetId, rowsOrderKey, rowsOrder]);

  const updateRowsCells = useCallback(
    async (updates: { rowId: string; cellsData: Row['cells_data'] }[]) => {
      const results = await Promise.all(
        updates.map(({ rowId, cellsData }) =>
          updateRow(rowId, { cells_data: cellsData }),
        ),
      );
      setRows((prev) => {
        const map = new Map(results.map((row) => [row.id, row]));
        return prev.map((row) => map.get(row.id) ?? row);
      });
    },
    [],
  );

  const updateCellMarker = useCallback(
    async (rowId: string, columnId: string, color: MarkerColor | null) => {
      let snapshot: Row | undefined;

      setRows((prev) => {
        const row = prev.find((item) => item.id === rowId);
        if (!row) return prev;
        snapshot = row;

        const existing = row.cells_data[columnId];
        const nextCell = { ...(existing ?? createEmptyCell(false)) };
        if (color) {
          nextCell.marker_color = color;
        } else {
          delete nextCell.marker_color;
        }

        return prev.map((item) =>
          item.id === rowId
            ? {
                ...item,
                cells_data: {
                  ...item.cells_data,
                  [columnId]: nextCell,
                },
              }
            : item,
        );
      });

      if (!snapshot) return;

      const existing = snapshot.cells_data[columnId];
      const nextCell = { ...(existing ?? createEmptyCell(false)) };
      if (color) {
        nextCell.marker_color = color;
      } else {
        delete nextCell.marker_color;
      }

      try {
        const result = await updateRow(rowId, {
          cells_data: {
            ...snapshot.cells_data,
            [columnId]: nextCell,
          },
        });
        setRows((prev) =>
          prev.map((item) => (item.id === rowId ? result : item)),
        );
      } catch (err) {
        console.error('Failed to update cell marker:', err);
        toast.error(t('sheet.toast.cellMarkerSaveFailed'));
        if (sheet) void loadRows(sheet);
      }
    },
    [loadRows, sheet],
  );

  const updateRowMarker = useCallback(
    async (rowId: string, color: MarkerColor | null) => {
      let snapshot: Row | undefined;

      setRows((prev) => {
        const row = prev.find((item) => item.id === rowId);
        if (!row) return prev;
        snapshot = row;
        return prev.map((item) =>
          item.id === rowId ? applyRowMarker(item, color) : item,
        );
      });

      if (!snapshot) return;

      const nextCellsData = buildRowMarkerCellsData(snapshot.cells_data, color);

      try {
        let result: Row;
        try {
          result = await updateRow(rowId, {
            marker_color: color,
            cells_data: nextCellsData,
          });
        } catch {
          result = await updateRow(rowId, {
            cells_data: nextCellsData,
          });
        }

        setRows((prev) =>
          prev.map((item) =>
            item.id === rowId ? applyRowMarker(result, color) : item,
          ),
        );
      } catch (err) {
        console.error('Failed to update row marker:', err);
        toast.error(t('sheet.toast.rowMarkerSaveFailed'));
        if (sheet) void loadRows(sheet);
      }
    },
    [loadRows, sheet],
  );

  return {
    rows,
    loading,
    error,
    reload: () => (sheet ? loadRows(sheet) : Promise.resolve()),
    updateRowsCells,
    updateCellMarker,
    updateRowMarker,
    setRows,
  };
}
