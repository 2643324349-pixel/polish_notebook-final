import type { CellData, Gender, GenderOrDefault } from '@/types';
import { createEmptyCell } from '@/lib/sheet/defaultSheet';

const GENDER_LABELS: Record<Gender, string> = {
  m: 'm',
  f: 'f',
  n: 'n',
};

export function getGenderKeys(cell: CellData | undefined): GenderOrDefault[] {
  if (!cell) return ['default'];
  return Object.keys(cell.gender_values) as GenderOrDefault[];
}

const DISPLAY_KEY_ORDER: GenderOrDefault[] = ['default', 'm', 'f', 'n'];

export function getCellDisplayKeys(cell: CellData | undefined): GenderOrDefault[] {
  if (!cell) return [];
  return DISPLAY_KEY_ORDER.filter((key) => cell.gender_values[key]);
}

export function getCellEditValue(cell: CellData | undefined): string {
  return cell?.gender_values.default?.value ?? '';
}

export function setCellDefaultValue(
  cell: CellData | undefined,
  value: string,
  supportsGender: boolean,
): CellData {
  const base = cell ?? createEmptyCell(supportsGender);

  return {
    ...base,
    gender_values: {
      ...base.gender_values,
      default: {
        value,
        is_hidden: base.gender_values.default?.is_hidden ?? false,
        is_ai_generated: false,
      },
    },
  };
}

export function formatGenderLine(
  key: GenderOrDefault,
  value: string,
  isHidden: boolean,
): string {
  if (isHidden) return '•••';
  if (!value) return '';
  if (key === 'default') return value;
  return `${value} (${GENDER_LABELS[key]})`;
}

export function getCellDisplayLines(cell: CellData | undefined): string[] {
  if (!cell) return [];

  return getCellDisplayKeys(cell)
    .map((key) => {
      const entry = cell.gender_values[key];
      if (!entry) return '';
      return formatGenderLine(key, entry.value, entry.is_hidden);
    })
    .filter(Boolean);
}

export function isCellEmpty(cell: CellData | undefined): boolean {
  if (!cell) return true;
  return getGenderKeys(cell).every((key) => {
    const entry = cell.gender_values[key];
    return !entry?.value;
  });
}

export function isCellHidden(cell: CellData | undefined): boolean {
  if (!cell || isCellEmpty(cell)) return false;

  const keysWithValue = getGenderKeys(cell).filter(
    (key) => !!cell.gender_values[key]?.value,
  );
  if (keysWithValue.length === 0) return false;

  return keysWithValue.every((key) => !!cell.gender_values[key]?.is_hidden);
}

export function cellHasAiGenerated(cell: CellData | undefined): boolean {
  if (!cell) return false;
  return Object.values(cell.gender_values).some(
    (entry) => entry?.is_ai_generated && !!entry.value,
  );
}

export function getCellSourceWord(cell: CellData | undefined): string | null {
  if (!cell) return null;

  const defaultValue = cell.gender_values.default?.value?.trim();
  if (defaultValue) return defaultValue;

  for (const key of getGenderKeys(cell)) {
    if (key === 'default') continue;
    const value = cell.gender_values[key]?.value?.trim();
    if (value) return value;
  }

  return null;
}

export function toggleCellHiddenState(cell: CellData): CellData {
  const keys = getGenderKeys(cell);
  const shouldHide = keys.some((key) => {
    const entry = cell.gender_values[key];
    return !!entry?.value && !entry.is_hidden;
  });

  const gender_values = { ...cell.gender_values };
  for (const key of keys) {
    const entry = gender_values[key];
    if (entry?.value) {
      gender_values[key] = { ...entry, is_hidden: shouldHide };
    }
  }

  return { ...cell, gender_values };
}

export function setCellBulkHiddenState(
  cell: CellData,
  hidden: boolean,
): CellData {
  const gender_values = { ...cell.gender_values };
  for (const key of getGenderKeys(cell)) {
    const entry = gender_values[key];
    if (entry) {
      gender_values[key] = { ...entry, is_hidden: hidden };
    }
  }
  return { ...cell, gender_values };
}

/** Bulk hide: skip empty cells. Returns null if no-op. */
export function applyBulkHide(cell: CellData | undefined): CellData | null {
  if (!cell || isCellEmpty(cell)) return null;
  return setCellBulkHiddenState(cell, true);
}

/** Bulk show: skip empty and non-hidden cells. Returns null if no-op. */
export function applyBulkShow(cell: CellData | undefined): CellData | null {
  if (!cell || isCellEmpty(cell) || !isCellHidden(cell)) return null;
  return setCellBulkHiddenState(cell, false);
}
