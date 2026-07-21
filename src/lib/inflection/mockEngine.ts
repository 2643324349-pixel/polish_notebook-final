import type { GenerateFormsResult, MockResult } from '@/lib/inflection/types';

/**
 * Mock 词典（降级方案）：inflection.default 使用主格（nominative）形式。
 * 正常路径由 Morfeusz API 提供；API 不可用时静默降级到此词典。
 */
const MOCK_DATA: Record<string, MockResult> = {
  dobry: {
    lemma: 'dobry',
    pos: 'adjective',
    inflection: { m: 'dobry', f: 'dobra', n: 'dobre' },
    hasGender: true,
    confidence: 'high',
    translations: ['好的'],
  },
  dobra: {
    lemma: 'dobry',
    pos: 'adjective',
    inflection: { m: 'dobry', f: 'dobra', n: 'dobre' },
    hasGender: true,
    confidence: 'high',
    translations: ['好的'],
  },
  dobre: {
    lemma: 'dobry',
    pos: 'adjective',
    inflection: { m: 'dobry', f: 'dobra', n: 'dobre' },
    hasGender: true,
    confidence: 'high',
    translations: ['好的'],
  },
  kot: {
    lemma: 'kot',
    pos: 'noun',
    inflection: { default: 'kot' },
    hasGender: false,
    confidence: 'high',
    translations: ['猫'],
  },
  kota: {
    lemma: 'kot',
    pos: 'noun',
    inflection: { default: 'kot' },
    hasGender: false,
    confidence: 'high',
    translations: ['猫'],
  },
  dom: {
    lemma: 'dom',
    pos: 'noun',
    inflection: { default: 'dom' },
    hasGender: false,
    confidence: 'high',
    translations: ['房子'],
  },
  duży: {
    lemma: 'duży',
    pos: 'adjective',
    inflection: { m: 'duży', f: 'duża', n: 'duże' },
    hasGender: true,
    confidence: 'high',
    translations: ['大的'],
  },
  mały: {
    lemma: 'mały',
    pos: 'adjective',
    inflection: { m: 'mały', f: 'mała', n: 'małe' },
    hasGender: true,
    confidence: 'high',
    translations: ['小的'],
  },
  on: {
    lemma: 'on',
    pos: 'pronoun',
    inflection: { m: 'on', f: 'ona', n: 'ono' },
    hasGender: true,
    confidence: 'high',
    translations: ['他'],
  },
  jeden: {
    lemma: 'jeden',
    pos: 'numeral',
    inflection: { m: 'jeden', f: 'jedna', n: 'jedno' },
    hasGender: true,
    confidence: 'high',
    translations: ['一'],
  },
  pies: {
    lemma: 'pies',
    pos: 'noun',
    inflection: { default: 'pies' },
    hasGender: false,
    confidence: 'high',
    translations: ['狗'],
  },
  zamek: {
    lemma: 'zamek',
    pos: 'noun',
    inflection: { default: 'zamek' },
    hasGender: false,
    confidence: 'medium',
    translations: ['城堡', '拉链'],
  },
  jem: {
    lemma: 'jeść',
    morfLemma: 'jeść',
    pos: 'verb',
    inflection: { default: 'jeść' },
    hasGender: false,
    confidence: 'high',
    translations: ['吃'],
  },
  jest: {
    lemma: 'być',
    morfLemma: 'być',
    pos: 'verb',
    inflection: { default: 'być' },
    hasGender: false,
    confidence: 'high',
    translations: ['是'],
  },
  jeść: {
    lemma: 'jeść',
    pos: 'verb',
    inflection: { default: 'jeść' },
    hasGender: false,
    confidence: 'high',
    translations: ['吃'],
  },
};

const MOCK_FORMS: Record<string, GenerateFormsResult> = {
  kot: {
    nominative_singular: { default: 'kot' },
    genitive_singular: { default: 'kota' },
    dative_singular: { default: 'kotowi' },
    accusative_singular: { default: 'kota' },
    instrumental_singular: { default: 'kotem' },
    locative_singular: { default: 'kocie' },
    vocative_singular: { default: 'kocie' },
  },
  pies: {
    nominative_singular: { default: 'pies' },
    genitive_singular: { default: 'psa' },
    dative_singular: { default: 'psu' },
    accusative_singular: { default: 'psa' },
    instrumental_singular: { default: 'psem' },
    locative_singular: { default: 'psie' },
    vocative_singular: { default: 'psie' },
  },
  zamek: {
    nominative_singular: { default: 'zamek' },
    genitive_singular: { default: 'zamka' },
    dative_singular: { default: 'zamkowi' },
  },
  dobry: {
    nominative_singular: { m: 'dobry', f: 'dobra', n: 'dobre' },
    genitive_singular: { m: 'dobrego', f: 'dobrej', n: 'dobrego' },
    dative_singular: { m: 'dobremu', f: 'dobrej', n: 'dobremu' },
  },
};

export function mockAnalyze(word: string): MockResult | null {
  const normalized = word.trim().toLowerCase();
  if (!normalized) return null;
  return MOCK_DATA[normalized] ?? null;
}

export function mockTranslations(lemma: string): string | null {
  const entry = MOCK_DATA[lemma.trim().toLowerCase()];
  if (!entry?.translations?.length) return null;
  return entry.translations.join(' / ');
}

export function mockGenerateForms(
  analysis: MockResult,
  caseTypes: string[],
): GenerateFormsResult {
  const paradigm = MOCK_FORMS[analysis.lemma.toLowerCase()];
  if (!paradigm) {
    const fallback: GenerateFormsResult = {};
    for (const caseType of caseTypes) {
      if (caseType === 'nominative_singular') {
        fallback[caseType] = analysis.inflection;
      }
    }
    return fallback;
  }

  const result: GenerateFormsResult = {};
  for (const caseType of caseTypes) {
    if (paradigm[caseType]) {
      result[caseType] = paradigm[caseType];
    }
  }
  return result;
}

export function hasMockWord(word: string): boolean {
  return mockAnalyze(word) !== null;
}
