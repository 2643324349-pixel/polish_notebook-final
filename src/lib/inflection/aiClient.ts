import type { GenerateFormsResult } from '@/lib/inflection/types';

const API_BASE = import.meta.env.VITE_INFLECTION_API_URL ?? '';
const REQUEST_TIMEOUT_MS = 20_000;

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE.trim().replace(/\/$/, '');
  return base ? `${base}${normalizedPath}` : normalizedPath;
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

export interface AiTranslateResult {
  translation: string;
  isAiGenerated: boolean;
}

export async function aiTranslate(params: {
  word: string;
  pos: string;
  lang?: string;
}): Promise<AiTranslateResult | null> {
  const lang = params.lang ?? 'en';

  try {
    const response = await fetchWithTimeout(
      buildApiUrl('/api/inflect/ai-translate'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: params.word,
          pos: params.pos,
          lang,
          target_lang: lang,
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.warn(
        `[ai] translate API returned ${response.status}`,
        detail.slice(0, 200),
      );
      return null;
    }

    const data = (await response.json()) as {
      translation?: string;
      is_ai_generated?: boolean;
    };
    const translation = data.translation?.trim();
    if (!translation) return null;

    return {
      translation,
      isAiGenerated: data.is_ai_generated ?? true,
    };
  } catch (error) {
    console.warn('[ai] translate request failed', error);
    return null;
  }
}

export async function aiInflect(params: {
  word: string;
  pos: string;
  caseTypes: string[];
  hasGender: boolean;
}): Promise<GenerateFormsResult | null> {
  try {
    const response = await fetchWithTimeout(
      buildApiUrl('/api/inflect/ai-inflect'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: params.word,
          pos: params.pos,
          case_types: params.caseTypes,
          has_gender: params.hasGender,
        }),
      },
    );

    if (!response.ok) return null;
    const data = (await response.json()) as { forms?: GenerateFormsResult };
    return data.forms ?? null;
  } catch {
    return null;
  }
}
