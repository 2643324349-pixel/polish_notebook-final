import type { UILang } from '@/types';

/** Resolve translation display string from API gloss results. */
export function resolveTranslationDisplay(
  translations: string[] | undefined,
  _lang: UILang = 'en',
): string | null {
  if (!translations?.length) return null;
  return translations.join(' / ');
}
