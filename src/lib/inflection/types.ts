import type { Confidence, POS } from '@/types';

export type AmbiguityLevel = 'none' | 'L1' | 'L2' | 'L3';

export interface MockInflection {
  m?: string;
  f?: string;
  n?: string;
  default?: string;
}

export interface AnalyzeCandidate {
  id: string;
  morfLemma: string;
  lemma: string;
  pos: POS;
  tag: string;
  label: string;
  translations: string[];
}

export interface MockResult {
  lemma: string;
  morfLemma?: string;
  pos: POS;
  inflection: MockInflection;
  hasGender: boolean;
  confidence: Confidence;
  translations?: string[];
  ambiguityLevel?: AmbiguityLevel;
  needsUserChoice?: boolean;
  candidates?: AnalyzeCandidate[];
}

export type FormSlice = MockInflection & {
  isAiGenerated?: boolean;
};

export type GenerateFormsResult = Record<string, FormSlice>;

export type FillRowErrorCode =
  | 'not_found'
  | 'timeout'
  | 'service_unavailable';

export interface FillRowResult {
  analysis: MockResult;
  formsByColumnId: Record<string, FormSlice | undefined>;
  filledCount: number;
  usedMock: boolean;
  errorCode?: FillRowErrorCode;
}

export interface FillRowNeedsChoice {
  needsUserChoice: true;
  ambiguityLevel: AmbiguityLevel;
  candidates: AnalyzeCandidate[];
  sourceWord: string;
}

export type FillRowOutcome = FillRowResult | FillRowNeedsChoice | null;

export function isFillRowNeedsChoice(
  outcome: FillRowOutcome,
): outcome is FillRowNeedsChoice {
  return !!outcome && 'needsUserChoice' in outcome && outcome.needsUserChoice;
}
