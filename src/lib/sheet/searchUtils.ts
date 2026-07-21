import { makeCellKey } from '@/store/selectionStore';
import type { CellData, ColumnConfig, Row } from '@/types';

export interface SheetSearchMatch {
  rowId: string;
  columnId: string;
  rowIndex: number;
  colIndex: number;
}

export { makeCellKey as makeSearchMatchKey };

/** Collect raw cell values (including hidden) for search. */
export function getCellSearchValues(cell: CellData | undefined): string[] {
  if (!cell) return [];

  return Object.values(cell.gender_values)
    .map((entry) => entry?.value ?? '')
    .filter(Boolean);
}

export function cellMatchesQuery(
  cell: CellData | undefined,
  query: string,
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;

  const needle = trimmed.toLowerCase();
  return getCellSearchValues(cell).some((value) =>
    value.toLowerCase().includes(needle),
  );
}

export function findSheetMatches(
  rows: Row[],
  columns: ColumnConfig[],
  query: string,
): SheetSearchMatch[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const matches: SheetSearchMatch[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const column = columns[colIndex];
      const cell = row.cells_data[column.id] as CellData | undefined;
      if (cellMatchesQuery(cell, trimmed)) {
        matches.push({
          rowId: row.id,
          columnId: column.id,
          rowIndex,
          colIndex,
        });
      }
    }
  }

  return matches;
}
