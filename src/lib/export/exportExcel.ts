import * as XLSX from 'xlsx';
import {
  buildExportFilename,
  computeColumnWidths,
  extractSheetMatrix,
  isNumericCellValue,
  shareOrDownloadFile,
} from '@/lib/export/exportUtils';
import type { ColumnConfig, Row, UILang } from '@/types';

const NUMBER_FORMAT = '#,##0.00';
const TEXT_FORMAT = '@';

function applyCellFormats(ws: XLSX.WorkSheet, matrix: string[][]): void {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < (matrix[row]?.length ?? 0); col++) {
      const value = matrix[row]?.[col] ?? '';
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[address];
      if (!cell) continue;

      if (row === 0) {
        cell.t = 's';
        continue;
      }

      if (isNumericCellValue(value)) {
        cell.t = 'n';
        cell.v = Number(value);
        cell.z = NUMBER_FORMAT;
      } else {
        cell.t = 's';
        cell.v = value;
        cell.z = TEXT_FORMAT;
      }
    }
  }
}

export async function exportSheetToExcel(params: {
  columns: ColumnConfig[];
  rows: Row[];
  uiLang: UILang;
}): Promise<{ filename: string; method: 'shared' | 'downloaded' }> {
  const matrix = extractSheetMatrix(params.columns, params.rows, params.uiLang);
  const ws = XLSX.utils.aoa_to_sheet(matrix);
  ws['!cols'] = computeColumnWidths(matrix);
  applyCellFormats(ws, matrix);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vocabulary');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const filename = buildExportFilename('xlsx');
  const method = await shareOrDownloadFile(
    blob,
    filename,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );

  return { filename, method };
}
