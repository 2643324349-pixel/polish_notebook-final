// ============================================
// 语言配置
// ============================================

export type UILang = 'zh-CN' | 'en' | 'uk' | 'de';

export interface UserPreferences {
  ui_lang: UILang;
  theme: 'light' | 'dark' | 'system';
}

export const SUPPORTED_UI_LANGS: UILang[] = ['zh-CN', 'en', 'uk', 'de'];
export const FALLBACK_LANG: UILang = 'en';

// ============================================
// 区域
// ============================================

export type Region = 'global' | 'cn';

// ============================================
// User profile (VIP)
// ============================================

export interface Profile {
  user_id: string;
  is_vip: boolean;
  vip_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 变格类型
// ============================================

export type CaseType =
  | 'nominative_singular'
  | 'genitive_singular'
  | 'dative_singular'
  | 'accusative_singular'
  | 'instrumental_singular'
  | 'locative_singular'
  | 'vocative_singular'
  | 'nominative_plural'
  | 'genitive_plural'
  | 'dative_plural'
  | 'accusative_plural'
  | 'instrumental_plural'
  | 'locative_plural'
  | 'vocative_plural'
  | 'translation'
  | 'note'
  | 'verb_infinitive'
  | 'verb_present_1sg'
  | 'verb_present_2sg'
  | 'verb_present_3sg'
  | 'verb_present_1pl'
  | 'verb_present_2pl'
  | 'verb_present_3pl'
  | 'verb_past_1sg'
  | 'verb_past_2sg'
  | 'verb_past_3sg'
  | 'verb_past_1pl'
  | 'verb_past_2pl'
  | 'verb_past_3pl';

// ============================================
// 性别类型
// ============================================

export type Gender = 'm' | 'f' | 'n';
export type GenderOrDefault = Gender | 'default';

export type MarkerColor = '#9BB0C2' | '#B5C0A8' | '#D4C4C0';

// ============================================
// 单元格与列配置
// ============================================

export interface GenderValue {
  value: string;
  is_hidden: boolean;
  is_ai_generated?: boolean;
}

export interface CellData {
  gender_values: Partial<Record<GenderOrDefault, GenderValue>>;
  notes?: Record<UILang, string>;
  marker_color?: MarkerColor | null;
}

export interface ColumnConfig {
  id: string;
  case_type: CaseType;
  label_i18n: Record<UILang, string>;
  width: number;
  is_visible: boolean;
  is_system: boolean;
  supports_gender: boolean;
}

export interface ColumnsConfig {
  columns: ColumnConfig[];
  column_order: string[];
}

export interface FrozenConfig {
  freeze_rows: number;
  freeze_cols: number;
}

export type CellsData = Record<string, CellData>;

// ============================================
// 数据库表类型
// ============================================

export interface Notebook {
  id: string;
  user_id: string;
  name: string;
  region: Region;
  created_at: string;
  updated_at: string;
}

export interface Sheet {
  id: string;
  notebook_id: string;
  title: string;
  columns_config: ColumnsConfig;
  rows_order: string[];
  frozen_config: FrozenConfig;
  created_at: string;
  updated_at: string;
}

export interface Row {
  id: string;
  sheet_id: string;
  cells_data: CellsData;
  marker_color?: MarkerColor | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 规则引擎类型
// ============================================

export type POS =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'numeral'
  | 'preposition'
  | 'conjunction';

export type Confidence = 'high' | 'medium' | 'low';

export interface InflectionResult {
  m?: string;
  f?: string;
  n?: string;
  default?: string;
  hasGender: boolean;
  confidence: Confidence;
}

export interface AnalyzeResult {
  lemma: string;
  pos: POS;
  grammemes: {
    gender?: Gender[];
    number?: 'sg' | 'pl';
    case?: string;
    person?: 1 | 2 | 3;
    tense?: 'present' | 'past' | 'future';
    aspect?: 'imperfective' | 'perfective';
  };
  confidence: Confidence;
}

export interface InflectionEngine {
  analyze(word: string): AnalyzeResult;
  inflect(lemma: string, pos: POS, grammemes: Record<string, unknown>): InflectionResult;
  hasWord(word: string): boolean;
  getSupportedGenders(word: string): Gender[];
}

export type EngineLanguage = 'pl' | 'de';

export interface EngineFactory {
  getEngine(language: EngineLanguage): InflectionEngine;
}

// ============================================
// 变格规则索引
// ============================================

export const INFLECTION_RULES = {
  noun: {
    cases: [
      'nominative',
      'genitive',
      'dative',
      'accusative',
      'instrumental',
      'locative',
      'vocative',
    ] as const,
    numbers: ['sg', 'pl'] as const,
    hasGender: false,
  },
  adjective: {
    cases: [
      'nominative',
      'genitive',
      'dative',
      'accusative',
      'instrumental',
      'locative',
      'vocative',
    ] as const,
    numbers: ['sg', 'pl'] as const,
    hasGender: true,
    genders: ['m', 'f', 'n'] as const,
  },
  verb: {
    tenses: ['present', 'past'] as const,
    numbers: ['sg', 'pl'] as const,
    persons: ['1st', '2nd', '3rd'] as const,
    hasGender: true,
    genders: ['m', 'f', 'n'] as const,
  },
  pronoun: {
    cases: [
      'nominative',
      'genitive',
      'dative',
      'accusative',
      'instrumental',
      'locative',
      'vocative',
    ] as const,
    numbers: ['sg', 'pl'] as const,
    hasGender: true,
    genders: ['m', 'f', 'n'] as const,
  },
  numeral: {
    hasGender: true,
    genders: ['m', 'f', 'n'] as const,
  },
  adverb: { isInvariable: true },
  preposition: { isInvariable: true },
  conjunction: { isInvariable: true },
} as const;

// ============================================
// 不规则变格（可选参考数据）
// ============================================

export interface IrregularFormEntry {
  word: string;
  irregular_forms: Record<string, string>;
}
