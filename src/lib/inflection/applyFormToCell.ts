import { createEmptyCell } from '@/lib/sheet/defaultSheet';
import type { FormSlice } from '@/lib/inflection/types';
import type { CellData } from '@/types';

function preserveHidden(
  existing: CellData | undefined,
  key: 'm' | 'f' | 'n' | 'default',
): boolean {
  return existing?.gender_values[key]?.is_hidden ?? false;
}

function toGenderValue(
  value: string,
  cell: CellData | undefined,
  key: 'm' | 'f' | 'n' | 'default',
  isAiGenerated: boolean,
) {
  return {
    value,
    is_hidden: preserveHidden(cell, key),
    is_ai_generated: isAiGenerated,
  };
}

export function applyFormToCell(
  cell: CellData | undefined,
  form: FormSlice | undefined,
  supportsGender: boolean,
): CellData | null {
  if (!form) return null;

  const isAiGenerated = form.isAiGenerated ?? false;
  const hasGenderValues = !!(form.m || form.f || form.n);
  const defaultValue = form.default ?? '';

  if (supportsGender && hasGenderValues) {
    const base = cell ?? createEmptyCell(true);
    return {
      ...base,
      gender_values: {
        m: toGenderValue(form.m ?? '', cell, 'm', isAiGenerated),
        f: toGenderValue(form.f ?? '', cell, 'f', isAiGenerated),
        n: toGenderValue(form.n ?? '', cell, 'n', isAiGenerated),
      },
    };
  }

  const value =
    defaultValue || form.m || form.f || form.n || '';
  if (!value) return null;

  const base = cell ?? createEmptyCell(supportsGender);
  return {
    ...base,
    gender_values: {
      ...base.gender_values,
      default: toGenderValue(value, cell, 'default', isAiGenerated),
    },
  };
}
