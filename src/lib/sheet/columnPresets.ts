import { t } from '@/lib/i18n/t';
import type { CaseType, POS, UILang } from '@/types';

export interface ColumnPresetOption {
  id: string;
  case_type: CaseType;
  label_i18n: Record<UILang, string>;
  supports_gender: boolean;
  is_system: boolean;
}

export const POS_OPTION_KEYS: (POS | 'custom')[] = [
  'noun',
  'verb',
  'adjective',
  'pronoun',
  'numeral',
  'adverb',
  'preposition',
  'conjunction',
  'custom',
];

export function getPosLabel(key: POS | 'custom'): string {
  return t(`sheet.pos.${key}`);
}

const NOUN_CASE_TYPES: CaseType[] = [
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

function isNounCaseType(caseType: CaseType): boolean {
  return NOUN_CASE_TYPES.includes(caseType);
}

function caseLabel(caseType: CaseType, withGender: boolean): Record<UILang, string> {
  const base = t(`sheet.cases.${caseType}`);
  const label = withGender ? t('sheet.cases.withGender', { label: base }) : base;
  return {
    'zh-CN': label,
    en: label,
    uk: label,
    de: label,
  };
}

export function getPresetLabel(preset: ColumnPresetOption): string {
  if (preset.case_type.startsWith('verb_')) {
    return t(`sheet.verbColumns.${preset.case_type}`);
  }
  if (isNounCaseType(preset.case_type)) {
    const base = t(`sheet.cases.${preset.case_type}`);
    return preset.supports_gender
      ? t('sheet.cases.withGender', { label: base })
      : base;
  }
  return preset.label_i18n.en ?? preset.id;
}

export function getNounColumnPresets(): ColumnPresetOption[] {
  return NOUN_CASE_TYPES.map((caseType) => ({
    id: `preset_${caseType}`,
    case_type: caseType,
    label_i18n: caseLabel(caseType, false),
    supports_gender: false,
    is_system: true,
  }));
}

export function getAdjectiveColumnPresets(): ColumnPresetOption[] {
  return NOUN_CASE_TYPES.map((caseType) => ({
    id: `preset_adj_${caseType}`,
    case_type: caseType,
    label_i18n: caseLabel(caseType, true),
    supports_gender: true,
    is_system: true,
  }));
}

/** Verb columns use case_type: 'note' + custom labels (decision A). */
export function getVerbColumnPresets(): ColumnPresetOption[] {
  const items: { id: string; supports_gender: boolean }[] = [
    { id: 'verb_infinitive', supports_gender: false },
    { id: 'verb_present_1sg', supports_gender: false },
    { id: 'verb_present_2sg', supports_gender: false },
    { id: 'verb_present_3sg', supports_gender: false },
    { id: 'verb_present_1pl', supports_gender: false },
    { id: 'verb_present_2pl', supports_gender: false },
    { id: 'verb_present_3pl', supports_gender: false },
    { id: 'verb_past_1sg', supports_gender: true },
    { id: 'verb_past_2sg', supports_gender: true },
    { id: 'verb_past_3sg', supports_gender: true },
    { id: 'verb_past_1pl', supports_gender: true },
    { id: 'verb_past_2pl', supports_gender: true },
    { id: 'verb_past_3pl', supports_gender: true },
  ];

  return items.map(({ id, supports_gender }) => {
    const label = t(`sheet.verbColumns.${id}`);
    return {
      id: `preset_${id}`,
      case_type: id as CaseType,
      label_i18n: {
        'zh-CN': label,
        en: label,
        uk: label,
        de: label,
      },
      supports_gender,
      is_system: false,
    };
  });
}

export function getPresetsForPos(
  pos: POS | 'custom',
): ColumnPresetOption[] {
  switch (pos) {
    case 'noun':
      return getNounColumnPresets();
    case 'adjective':
    case 'pronoun':
    case 'numeral':
      return getAdjectiveColumnPresets();
    case 'verb':
      return getVerbColumnPresets();
    case 'adverb':
    case 'preposition':
    case 'conjunction':
      return [];
    default:
      return [];
  }
}
