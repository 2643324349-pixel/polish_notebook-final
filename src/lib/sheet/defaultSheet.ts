import type {
  CellData,
  CellsData,
  ColumnConfig,
  ColumnsConfig,
  FrozenConfig,
  Sheet,
  UILang,
} from '@/types';
import { isCustomNoteColumn } from '@/lib/inflection/caseMapping';
import { useSettingsStore } from '@/store/settingsStore';

export const DEFAULT_FROZEN_CONFIG: FrozenConfig = {
  freeze_rows: 1,
  freeze_cols: 1,
};

export const TRANSLATION_COLUMN_ID = 'col_translation';
export const LEMMA_COLUMN_ID = 'col_lemma';

export {
  MOBILE_BREAKPOINT,
  MOBILE_MIN_COLUMN_WIDTH,
  MOBILE_TRANSLATION_WIDTH_RATIO,
  getEffectiveColumnWidths,
  isMobileViewport,
} from '@/lib/sheet/columnWidthUtils';

export function getDefaultColumnsConfig(): ColumnsConfig {
  return {
    columns: [
      {
        id: TRANSLATION_COLUMN_ID,
        case_type: 'translation',
        label_i18n: {
          en: 'Translation',
          'zh-CN': '翻译',
          uk: 'Переклад',
          de: 'Übersetzung',
        },
        width: 150,
        is_visible: true,
        is_system: true,
        supports_gender: false,
      },
      {
        id: LEMMA_COLUMN_ID,
        case_type: 'nominative_singular',
        label_i18n: {
          en: 'Lemma (Nom. sg.)',
          'zh-CN': '单词(主格)/原形',
          uk: 'Лема (наз. одн.)',
          de: 'Lemma (Nom. Sg.)',
        },
        width: 150,
        is_visible: true,
        is_system: true,
        supports_gender: true,
      },
    ],
    column_order: [TRANSLATION_COLUMN_ID, LEMMA_COLUMN_ID],
  };
}

export function getOrderedVisibleColumns(
  columnsConfig: ColumnsConfig,
): ColumnConfig[] {
  const map = new Map(columnsConfig.columns.map((col) => [col.id, col]));
  return columnsConfig.column_order
    .map((id) => map.get(id))
    .filter((col): col is ColumnConfig => !!col && col.is_visible);
}

export function getColumnLabel(
  column: ColumnConfig,
  lang?: UILang,
): string {
  const resolved = lang ?? useSettingsStore.getState().uiLang;
  return column.label_i18n[resolved] ?? column.label_i18n.en ?? column.id;
}

export function isTranslationColumn(column: ColumnConfig): boolean {
  return column.case_type === 'translation';
}

/** Translation + user-defined note columns (plain text input). */
export function isPlainEditableColumn(column: ColumnConfig): boolean {
  return isTranslationColumn(column) || isCustomNoteColumn(column);
}

export function isColumnLocked(column: ColumnConfig): boolean {
  return isTranslationColumn(column);
}

export function createEmptyCellsData(columns: ColumnConfig[]): CellsData {
  const cells: CellsData = {};
  for (const column of columns) {
    cells[column.id] = createEmptyCell(column.supports_gender);
  }
  return cells;
}

export function createEmptyCell(supportsGender: boolean): CellData {
  if (supportsGender) {
    return {
      gender_values: {
        m: { value: '', is_hidden: false },
        f: { value: '', is_hidden: false },
        n: { value: '', is_hidden: false },
      },
    };
  }

  return {
    gender_values: {
      default: { value: '', is_hidden: false },
    },
  };
}

export function normalizeSheet(sheet: Sheet): Sheet {
  return {
    ...sheet,
    frozen_config: sheet.frozen_config ?? DEFAULT_FROZEN_CONFIG,
    rows_order: sheet.rows_order ?? [],
  };
}
