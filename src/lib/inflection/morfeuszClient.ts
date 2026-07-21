import type { Confidence, POS, UILang } from '@/types';
import type {
  AnalyzeCandidate,
  AmbiguityLevel,
  GenerateFormsResult,
  MockResult,
} from '@/lib/inflection/types';

const API_BASE = import.meta.env.VITE_INFLECTION_API_URL ?? '';
const REQUEST_TIMEOUT_MS = 15_000;

export type InflectionApiError = 'timeout' | 'unavailable' | 'not_found';

interface AnalyzeCandidateApi {
  id: string;
  morf_lemma: string;
  lemma: string;
  pos: string;
  tag: string;
  label: string;
  translations: string[];
}

interface AnalyzeApiResponse {
  lemma: string;
  morf_lemma: string;
  pos: string;
  grammemes: Record<string, unknown>;
  inflection: {
    m?: string;
    f?: string;
    n?: string;
    default?: string;
  };
  has_gender: boolean;
  translations: string[];
  confidence: Confidence;
  ambiguity_level?: AmbiguityLevel;
  needs_user_choice?: boolean;
  candidates?: AnalyzeCandidateApi[];
}

interface GenerateApiResponse {
  forms: GenerateFormsResult;
  ai_generated_cases?: string[];
}

export interface AnalyzeOutcome {
  result: MockResult | null;
  error?: InflectionApiError;
}

export interface GenerateOutcome {
  forms: GenerateFormsResult | null;
  aiGeneratedCases?: string[];
  error?: InflectionApiError;
}

function toCandidate(data: AnalyzeCandidateApi): AnalyzeCandidate {
  return {
    id: data.id,
    morfLemma: data.morf_lemma,
    lemma: data.lemma,
    pos: data.pos as POS,
    tag: data.tag,
    label: data.label,
    translations: data.translations ?? [],
  };
}

function toMockResult(data: AnalyzeApiResponse): MockResult {
  return {
    lemma: data.lemma,
    morfLemma: data.morf_lemma,
    pos: data.pos as POS,
    inflection: data.inflection,
    hasGender: data.has_gender,
    confidence: data.confidence,
    translations: data.translations ?? [],
    ambiguityLevel: data.ambiguity_level ?? 'none',
    needsUserChoice: data.needs_user_choice ?? false,
    candidates: (data.candidates ?? []).map(toCandidate),
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function mapFetchError(error: unknown): InflectionApiError {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'timeout';
  }
  return 'unavailable';
}

export async function analyzeWord(
  word: string,
  options?: { selectedCandidateId?: string; lang?: UILang },
): Promise<AnalyzeOutcome> {
  const normalized = word.trim();
  if (!normalized) {
    return { result: null, error: 'not_found' };
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE}/api/inflect/analyze`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: normalized,
          lang: options?.lang ?? 'en',
          selected_candidate_id: options?.selectedCandidateId,
        }),
      },
    );

    if (response.status === 404) {
      return { result: null, error: 'not_found' };
    }

    if (!response.ok) {
      console.warn(
        `[inflection] analyze API returned ${response.status} for "${normalized}"`,
      );
      return { result: null, error: 'unavailable' };
    }

    const data = (await response.json()) as AnalyzeApiResponse;
    return { result: toMockResult(data) };
  } catch (error) {
    const code = mapFetchError(error);
    console.warn(
      `[inflection] analyze request failed for "${normalized}"`,
      error,
    );
    return { result: null, error: code };
  }
}

export async function generateForms(params: {
  morfLemma: string;
  pos: string;
  hasGender: boolean;
  caseTypes: string[];
  lang?: UILang;
}): Promise<GenerateOutcome> {
  if (params.caseTypes.length === 0) {
    return { forms: {} };
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE}/api/inflect/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          morf_lemma: params.morfLemma,
          pos: params.pos,
          has_gender: params.hasGender,
          case_types: params.caseTypes,
          lang: params.lang ?? 'en',
        }),
      },
    );

    if (!response.ok) {
      console.warn(
        `[inflection] generate API returned ${response.status}`,
      );
      return { forms: null, error: 'unavailable' };
    }

    const data = (await response.json()) as GenerateApiResponse;
    return {
      forms: data.forms ?? {},
      aiGeneratedCases: data.ai_generated_cases ?? [],
    };
  } catch (error) {
    const code = mapFetchError(error);
    console.warn('[inflection] generate request failed', error);
    return { forms: null, error: code };
  }
}
