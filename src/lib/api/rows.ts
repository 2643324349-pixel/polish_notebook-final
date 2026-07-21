import { supabase } from '@/lib/supabase/client';
import type { CellsData, Row, Sheet } from '@/types';

export async function createRow(
  sheetId: string,
  cellsData: CellsData = {},
): Promise<Row> {
  const { data, error } = await supabase
    .from('rows')
    .insert({ sheet_id: sheetId, cells_data: cellsData })
    .select()
    .single();

  if (error) throw error;
  return data as Row;
}

export async function fetchRowsBySheetId(sheetId: string): Promise<Row[]> {
  const { data, error } = await supabase
    .from('rows')
    .select('*')
    .eq('sheet_id', sheetId);

  if (error) throw error;
  return (data ?? []) as Row[];
}

export async function fetchRowsForSheet(
  sheet: Pick<Sheet, 'id' | 'rows_order'>,
): Promise<Row[]> {
  const rows = await fetchRowsBySheetId(sheet.id);
  const map = new Map(rows.map((row) => [row.id, row]));
  const order = sheet.rows_order ?? [];

  if (order.length === 0) return rows;

  const ordered = order
    .map((id) => map.get(id))
    .filter((row): row is Row => !!row);

  for (const row of rows) {
    if (!order.includes(row.id)) ordered.push(row);
  }

  return ordered;
}

export async function updateRow(
  rowId: string,
  updates: Partial<Pick<Row, 'cells_data' | 'marker_color'>>,
): Promise<Row> {
  const { data, error } = await supabase
    .from('rows')
    .update(updates)
    .eq('id', rowId)
    .select()
    .single();

  if (error) throw error;
  return data as Row;
}

export async function deleteRow(rowId: string): Promise<void> {
  const { error } = await supabase.from('rows').delete().eq('id', rowId);
  if (error) throw error;
}

export async function countUserTotalRows(userId: string): Promise<number> {
  const { data: notebooks, error: notebookError } = await supabase
    .from('notebooks')
    .select('id')
    .eq('user_id', userId);

  if (notebookError) throw notebookError;
  if (!notebooks?.length) return 0;

  const notebookIds = notebooks.map((notebook) => notebook.id);

  const { data: sheets, error: sheetError } = await supabase
    .from('sheets')
    .select('id')
    .in('notebook_id', notebookIds);

  if (sheetError) throw sheetError;
  if (!sheets?.length) return 0;

  const sheetIds = sheets.map((sheet) => sheet.id);

  const { count, error: rowError } = await supabase
    .from('rows')
    .select('*', { count: 'exact', head: true })
    .in('sheet_id', sheetIds);

  if (rowError) throw rowError;
  return count ?? 0;
}

export async function fetchSheetCounts(
  notebookIds: string[],
): Promise<Record<string, number>> {
  if (notebookIds.length === 0) return {};

  const { data, error } = await supabase
    .from('sheets')
    .select('notebook_id')
    .in('notebook_id', notebookIds);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const id of notebookIds) {
    counts[id] = 0;
  }
  for (const sheet of data ?? []) {
    counts[sheet.notebook_id] = (counts[sheet.notebook_id] ?? 0) + 1;
  }
  return counts;
}
