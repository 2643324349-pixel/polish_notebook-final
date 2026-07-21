import i18n from '@/i18n';
export { useTranslation } from 'react-i18next';

/** Translate outside React components (hooks, utils). */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
