import type { ColumnConfig, FrozenConfig } from '@/types';

export const ROW_HANDLE_WIDTH = 40;
export const ADD_COLUMN_WIDTH = 100;

export function clampFreezeConfig(
  config: FrozenConfig,
  columnCount: number,
): FrozenConfig {
  const maxCols = Math.max(0, columnCount - 1);
  return {
    freeze_rows: Math.min(5, Math.max(0, config.freeze_rows)),
    freeze_cols: Math.min(5, Math.max(0, Math.min(config.freeze_cols, maxCols))),
  };
}

export function getColumnLeftOffsets(
  columns: ColumnConfig[],
  columnWidths?: number[],
): number[] {
  let left = ROW_HANDLE_WIDTH;
  return columns.map((column, index) => {
    const offset = left;
    left += columnWidths?.[index] ?? column.width;
    return offset;
  });
}

export function isColumnFrozen(colIndex: number, freezeCols: number): boolean {
  return colIndex < freezeCols;
}

export function isHeaderRowFrozen(freezeRows: number): boolean {
  return freezeRows >= 1;
}

export function isBodyRowFrozen(rowIndex: number, freezeRows: number): boolean {
  return rowIndex < freezeRows - 1;
}
