import { isMarkerColor } from '@/lib/sheet/markerColors';
import type { CellsData, MarkerColor, Row } from '@/types';

/** Reserved cells_data key for row-level metadata (no DB migration required). */
export const ROW_META_KEY = '__row_meta__';

interface RowMetaPayload {
  marker_color?: MarkerColor | null;
}

export function getRowMarkerColor(row: Row): MarkerColor | null {
  if (isMarkerColor(row.marker_color)) {
    return row.marker_color;
  }

  const meta = row.cells_data[ROW_META_KEY] as RowMetaPayload | undefined;
  if (isMarkerColor(meta?.marker_color)) {
    return meta.marker_color;
  }

  return null;
}

export function buildRowMarkerCellsData(
  cellsData: CellsData,
  color: MarkerColor | null,
): CellsData {
  const next = { ...cellsData };
  const meta: RowMetaPayload = {
    ...((next[ROW_META_KEY] as RowMetaPayload | undefined) ?? {}),
  };

  if (color) {
    meta.marker_color = color;
    next[ROW_META_KEY] = meta as CellsData[string];
  } else {
    delete meta.marker_color;
    if (Object.keys(meta).length === 0) {
      delete next[ROW_META_KEY];
    } else {
      next[ROW_META_KEY] = meta as CellsData[string];
    }
  }

  return next;
}

export function applyRowMarker(row: Row, color: MarkerColor | null): Row {
  return {
    ...row,
    marker_color: color,
    cells_data: buildRowMarkerCellsData(row.cells_data, color),
  };
}
