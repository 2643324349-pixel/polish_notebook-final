import { t } from '@/lib/i18n/t';
import type { CellsData, ColumnConfig, ColumnsConfig } from '@/types';
import type { ColumnPresetOption } from '@/lib/sheet/columnPresets';
import { arrayMove } from '@dnd-kit/sortable';
import { createEmptyCell } from '@/lib/sheet/defaultSheet';
import { isColumnLocked, isTranslationColumn } from '@/lib/sheet/defaultSheet';

let columnIdCounter = 0;

export function generateColumnId(): string {
  columnIdCounter += 1;
  return `col_${Date.now()}_${columnIdCounter}`;
}

export function createColumnFromPreset(preset: ColumnPresetOption): ColumnConfig {
  return {
    id: generateColumnId(),
    case_type: preset.case_type,
    label_i18n: { ...preset.label_i18n },
    width: 150,
    is_visible: true,
    is_system: preset.is_system,
    supports_gender: preset.supports_gender,
  };
}

export function createCustomNoteColumn(label: string): ColumnConfig {
  const trimmed = label.trim() || t('sheet.columns.noteDefault');
  return {
    id: generateColumnId(),
    case_type: 'note',
    label_i18n: {
      'zh-CN': trimmed,
      en: trimmed,
      uk: trimmed,
      de: trimmed,
    },
    width: 150,
    is_visible: true,
    is_system: false,
    supports_gender: false,
  };
}

export function canRenameColumn(column: ColumnConfig): boolean {
  return !column.is_system;
}

export function isColumnDuplicate(
  config: ColumnsConfig,
  preset: ColumnPresetOption,
): boolean {
  if (preset.case_type === 'note') return false;

  return config.columns.some(
    (col) => col.case_type === preset.case_type && col.is_visible,
  );
}

export function addColumnToConfig(
  config: ColumnsConfig,
  column: ColumnConfig,
): ColumnsConfig {
  return {
    columns: [...config.columns, column],
    column_order: [...config.column_order, column.id],
  };
}

export function removeColumnFromConfig(
  config: ColumnsConfig,
  columnId: string,
): ColumnsConfig | null {
  const column = config.columns.find((col) => col.id === columnId);
  if (!column || isTranslationColumn(column)) return null;

  return {
    columns: config.columns.filter((col) => col.id !== columnId),
    column_order: config.column_order.filter((id) => id !== columnId),
  };
}

export function toggleColumnVisibility(
  config: ColumnsConfig,
  columnId: string,
): ColumnsConfig {
  return {
    ...config,
    columns: config.columns.map((col) =>
      col.id === columnId ? { ...col, is_visible: !col.is_visible } : col,
    ),
  };
}

export function renameColumnLabel(
  config: ColumnsConfig,
  columnId: string,
  label: string,
): ColumnsConfig | null {
  const column = config.columns.find((col) => col.id === columnId);
  if (!column || !canRenameColumn(column)) return null;

  const trimmed = label.trim() || t('sheet.columns.noteDefault');
  return {
    ...config,
    columns: config.columns.map((col) =>
      col.id === columnId
        ? {
            ...col,
            label_i18n: {
              'zh-CN': trimmed,
              en: trimmed,
              uk: trimmed,
              de: trimmed,
            },
          }
        : col,
    ),
  };
}

export function getTranslationColumnId(config: ColumnsConfig): string | null {
  const translation = config.columns.find((col) => isTranslationColumn(col));
  return translation?.id ?? null;
}

export function getMovableColumnIds(config: ColumnsConfig): string[] {
  const map = new Map(config.columns.map((col) => [col.id, col]));
  return config.column_order.filter((id) => {
    const col = map.get(id);
    return col && !isColumnLocked(col);
  });
}

export function reorderColumnsInConfig(
  config: ColumnsConfig,
  activeId: string,
  overId: string,
): ColumnsConfig | null {
  const translationId = getTranslationColumnId(config);
  if (!translationId) return null;
  if (activeId === translationId || overId === translationId) return null;

  const order = [...config.column_order];
  const oldIndex = order.indexOf(activeId);
  const newIndex = order.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) return null;

  const moved = arrayMove(order, oldIndex, newIndex);
  const locked = moved.filter((id) => {
    const col = config.columns.find((c) => c.id === id);
    return col && isColumnLocked(col);
  });
  const movable = moved.filter((id) => !locked.includes(id));

  return {
    ...config,
    column_order: [...locked, ...movable],
  };
}

export function removeColumnFromCellsData(
  cellsData: CellsData,
  columnId: string,
): CellsData {
  const { [columnId]: _removed, ...rest } = cellsData;
  return rest;
}

export function addColumnToCellsData(
  cellsData: CellsData,
  column: ColumnConfig,
): CellsData {
  return {
    ...cellsData,
    [column.id]: createEmptyCell(column.supports_gender),
  };
}
