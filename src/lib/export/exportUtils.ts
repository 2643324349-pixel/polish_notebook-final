import { getCellDisplayLines } from '@/lib/sheet/cellUtils';
import { getColumnLabel } from '@/lib/sheet/defaultSheet';
import type { CellData, ColumnConfig, Row, UILang } from '@/types';

export const EXPORT_FONT_FAMILY =
  "'Inter', 'Roboto', 'Noto Sans', 'Noto Sans Cyrillic', sans-serif";

export const LARGE_SHEET_ROW_THRESHOLD = 5000;

export function extractCellExportText(cell: CellData | undefined): string {
  const lines = getCellDisplayLines(cell);
  return lines.join(' / ');
}

export function extractSheetMatrix(
  columns: ColumnConfig[],
  rows: Row[],
  uiLang: UILang,
): string[][] {
  const headers = columns.map((column) => getColumnLabel(column, uiLang));
  const body = rows.map((row) =>
    columns.map((column) => {
      const cell = row.cells_data[column.id] as CellData | undefined;
      return extractCellExportText(cell);
    }),
  );
  return [headers, ...body];
}

/** Approximate Excel column width from cell content (CJK counts wider). */
export function measureTextWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += char.charCodeAt(0) > 255 ? 2 : 1;
  }
  return width;
}

export function computeColumnWidths(matrix: string[][]): { wch: number }[] {
  if (matrix.length === 0) return [];

  const colCount = matrix[0]?.length ?? 0;
  const widths = new Array<number>(colCount).fill(8);

  for (const row of matrix) {
    for (let col = 0; col < colCount; col++) {
      const cell = row[col] ?? '';
      widths[col] = Math.max(widths[col], measureTextWidth(cell));
    }
  }

  return widths.map((width) => ({
    wch: Math.min(Math.max(width + 2, 8), 60),
  }));
}

export function isNumericCellValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^-?\d+(?:\.\d+)?$/.test(trimmed);
}

export function buildExportFilename(
  ext: 'xlsx' | 'png',
  pageIndex?: number,
): string {
  if (ext === 'png' && pageIndex != null) {
    return `vocab-export-${pageIndex}.png`;
  }

  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  return `vocab-export-${stamp}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadFile(
  blob: Blob,
  filename: string,
  mimeType: string,
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: mimeType });

  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return 'shared';
    } catch {
      // Share cancelled or failed — fall back to download.
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function tableNeedsPagedExport(container: HTMLElement): boolean {
  return container.scrollHeight > container.clientHeight + 1;
}
