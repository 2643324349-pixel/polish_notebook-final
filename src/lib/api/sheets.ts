import { DEFAULT_SHEET_TITLE } from '@/lib/constants';
import {
  createEmptyCellsData,
  getDefaultColumnsConfig,
  normalizeSheet,
} from '@/lib/sheet/defaultSheet';
import { buildDuplicateTitle } from '@/lib/sheet/sheetTitle';
import { createRow, fetchRowsForSheet } from '@/lib/api/rows';
import { supabase } from '@/lib/supabase/client';
import type { Sheet } from '@/types';

export async function fetchSheetById(id: string): Promise<Sheet> {
  const { data, error } = await supabase
    .from('sheets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return normalizeSheet(data as Sheet);
}

export async function fetchSheets(notebookId: string): Promise<Sheet[]> {
  const { data, error } = await supabase
    .from('sheets')
    .select('*')
    .eq('notebook_id', notebookId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((sheet) => normalizeSheet(sheet as Sheet));
}

export async function createSheet(
  notebookId: string,
  title: string = DEFAULT_SHEET_TITLE,
): Promise<Sheet> {
  const { data, error } = await supabase
    .from('sheets')
    .insert({
      notebook_id: notebookId,
      title,
      columns_config: getDefaultColumnsConfig(),
    })
    .select()
    .single();

  if (error) throw error;
  return normalizeSheet(data as Sheet);
}

export async function createSheetWithDefaultRow(
  notebookId: string,
  title: string = DEFAULT_SHEET_TITLE,
): Promise<Sheet> {
  const columnsConfig = getDefaultColumnsConfig();
  const sheet = await createSheet(notebookId, title);
  const row = await createRow(
    sheet.id,
    createEmptyCellsData(columnsConfig.columns),
  );

  const { data, error } = await supabase
    .from('sheets')
    .update({ rows_order: [row.id] })
    .eq('id', sheet.id)
    .select()
    .single();

  if (error) throw error;
  return normalizeSheet(data as Sheet);
}

export async function updateSheet(
  id: string,
  updates: Partial<
    Pick<Sheet, 'title' | 'columns_config' | 'frozen_config' | 'rows_order' | 'notebook_id'>
  >,
): Promise<Sheet> {
  const { data, error } = await supabase
    .from('sheets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalizeSheet(data as Sheet);
}

export async function deleteSheet(id: string): Promise<void> {
  const { error } = await supabase.from('sheets').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateSheet(
  sheetId: string,
  existingTitles: string[],
): Promise<Sheet> {
  const source = await fetchSheetById(sheetId);
  const sourceRows = await fetchRowsForSheet(source);
  const title = buildDuplicateTitle(source.title, existingTitles);

  const { data: created, error: createError } = await supabase
    .from('sheets')
    .insert({
      notebook_id: source.notebook_id,
      title,
      columns_config: source.columns_config,
      frozen_config: source.frozen_config,
      rows_order: [],
    })
    .select()
    .single();

  if (createError) throw createError;

  const newSheet = normalizeSheet(created as Sheet);
  const newRowIds: string[] = [];

  for (const row of sourceRows) {
    const newRow = await createRow(newSheet.id, row.cells_data);
    newRowIds.push(newRow.id);
  }

  return updateSheet(newSheet.id, { rows_order: newRowIds });
}

export async function moveSheet(
  sheetId: string,
  targetNotebookId: string,
): Promise<Sheet> {
  return updateSheet(sheetId, { notebook_id: targetNotebookId });
}
