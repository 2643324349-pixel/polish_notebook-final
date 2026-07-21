import { createEmptyCell } from '@/lib/sheet/defaultSheet';
import type { MockResult } from '@/lib/inflection/types';
import type { CellData } from '@/types';

function preserveHidden(
  existing: CellData | undefined,
  key: 'm' | 'f' | 'n' | 'default',
): boolean {
  return existing?.gender_values[key]?.is_hidden ?? false;
}

export function applyInflectionToCell(
  cell: CellData | undefined,
  result: MockResult,
  supportsGender: boolean,
): CellData {
  if (supportsGender && result.hasGender) {
    const base = cell ?? createEmptyCell(true);
    return {
      ...base,
      gender_values: {
        m: {
          value: result.inflection.m ?? '',
          is_hidden: preserveHidden(cell, 'm'),
          is_ai_generated: false,
        },
        f: {
          value: result.inflection.f ?? '',
          is_hidden: preserveHidden(cell, 'f'),
          is_ai_generated: false,
        },
        n: {
          value: result.inflection.n ?? '',
          is_hidden: preserveHidden(cell, 'n'),
          is_ai_generated: false,
        },
      },
    };
  }

  const base = cell ?? createEmptyCell(false);
  const value =
    result.inflection.default ??
    result.inflection.m ??
    result.inflection.f ??
    result.inflection.n ??
    '';

  return {
    ...base,
    gender_values: {
      default: {
        value,
        is_hidden: preserveHidden(cell, 'default'),
        is_ai_generated: false,
      },
    },
  };
}
