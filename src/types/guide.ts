export type CaseKey = 'nom' | 'gen' | 'dat' | 'acc' | 'ins' | 'loc' | 'voc';

export type PosKey =
  | 'noun'
  | 'adverb'
  | 'adjective'
  | 'pronoun'
  | 'numeral'
  | 'verb'
  | 'preposition'
  | 'conjunction';

export type PronounSubCategory = 'personal' | 'demonstrative';
export type NumeralSubCategory = 'two_three_four' | 'five_plus' | 'ordinal';

export interface GenderForms {
  m?: string;
  f?: string;
  n?: string;
}

export interface CaseInfoStructure {
  key: CaseKey;
  abbr: string;
  namePl: string;
  example: string;
}

export interface CaseInfo {
  key: CaseKey;
  abbr: string;
  name: string;
  namePl: string;
  description: string;
  example: string;
  exampleTranslation: string;
}

export interface NounEntryStructure {
  id: string;
  lemma: string;
  singular: Record<CaseKey, string>;
  plural: Record<CaseKey, string>;
}

export interface NounEntry {
  translation: string;
  label: string;
  lemma: string;
  singular: Record<CaseKey, string>;
  plural: Record<CaseKey, string>;
}

export interface AdjectiveEntryStructure {
  id: string;
  lemma: string;
  singular: Record<CaseKey, GenderForms>;
  plural: Record<CaseKey, GenderForms>;
}

export interface AdjectiveEntry {
  translation: string;
  lemma: string;
  singular: Record<CaseKey, GenderForms>;
  plural: Record<CaseKey, GenderForms>;
}

export interface PronounEntryStructure {
  id: string;
  lemma: string;
  singular: Record<CaseKey, GenderForms>;
  plural: Record<CaseKey, GenderForms>;
}

export interface PronounEntry {
  translation: string;
  lemma: string;
  singular: Record<CaseKey, GenderForms>;
  plural: Record<CaseKey, GenderForms>;
}

export interface NumeralEntryStructure {
  id: string;
  lemma: string;
  hasGender: boolean;
  singular?: Record<CaseKey, GenderForms>;
  plural?: Record<CaseKey, GenderForms>;
  forms?: Record<CaseKey, string>;
}

export interface NumeralEntry {
  translation: string;
  lemma: string;
  hasGender: boolean;
  singular?: Record<CaseKey, GenderForms>;
  plural?: Record<CaseKey, GenderForms>;
  forms?: Record<CaseKey, string>;
}

export interface VerbPersonRowStructure {
  personId: string;
  present: string;
  past: GenderForms;
}

export interface VerbPersonRow {
  person: string;
  present: string;
  past: GenderForms;
}

export interface VerbEntryStructure {
  id: string;
  lemma: string;
  rows: VerbPersonRowStructure[];
}

export interface VerbEntry {
  lemma: string;
  translation: string;
  rows: VerbPersonRow[];
}

export interface InvariableItemStructure {
  id: string;
  polish: string;
}

export interface InvariableCategoryStructure {
  group: 'adverb' | 'preposition' | 'conjunction';
  categoryId: string;
  items: InvariableItemStructure[];
}

export interface InvariableItem {
  polish: string;
  translation: string;
}

export interface InvariableCategory {
  title: string;
  description?: string;
  items: InvariableItem[];
}

export const CASE_ORDER: CaseKey[] = [
  'nom',
  'gen',
  'dat',
  'acc',
  'ins',
  'loc',
  'voc',
];

export const POS_ORDER: PosKey[] = [
  'noun',
  'adverb',
  'adjective',
  'pronoun',
  'numeral',
  'verb',
  'preposition',
  'conjunction',
];
