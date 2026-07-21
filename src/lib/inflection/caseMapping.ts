import { getVerbColumnPresets } from '@/lib/sheet/columnPresets';
import type { CaseType, ColumnConfig } from '@/types';

export const INFLECTION_CASE_TYPES: CaseType[] = [
  'nominative_singular',
  'genitive_singular',
  'dative_singular',
  'accusative_singular',
  'instrumental_singular',
  'locative_singular',
  'vocative_singular',
  'nominative_plural',
  'genitive_plural',
  'dative_plural',
  'accusative_plural',
  'instrumental_plural',
  'locative_plural',
  'vocative_plural',
];

const VERB_LABEL_TO_CASE = new Map(
  getVerbColumnPresets().map((preset) => [
    preset.label_i18n['zh-CN'],
    preset.case_type,
  ]),
);

export function isVerbCaseType(caseType: CaseType): boolean {
  return caseType.startsWith('verb_');
}

export function resolveColumnCaseType(column: ColumnConfig): CaseType {
  if (isVerbCaseType(column.case_type)) {
    return column.case_type;
  }

  if (column.case_type === 'note') {
    const mapped = VERB_LABEL_TO_CASE.get(column.label_i18n['zh-CN'] ?? '');
    if (mapped) return mapped;
  }

  return column.case_type;
}

export function isCustomNoteColumn(column: ColumnConfig): boolean {
  return column.case_type === 'note' && !VERB_LABEL_TO_CASE.has(column.label_i18n['zh-CN'] ?? '');
}

export function shouldFillColumn(column: ColumnConfig): boolean {
  if (!column.is_visible) return false;
  if (isCustomNoteColumn(column)) return false;
  if (column.case_type === 'translation') return true;
  if (isVerbCaseType(column.case_type)) return true;
  if (column.case_type === 'note' && VERB_LABEL_TO_CASE.has(column.label_i18n['zh-CN'] ?? '')) {
    return true;
  }
  return INFLECTION_CASE_TYPES.includes(column.case_type);
}
