import type { TFunction } from 'i18next';

type TranslateFn = TFunction | ((key: string) => string);

export function getAuthErrorMessage(error: unknown, t: TranslateFn): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : '';

  const lower = message.toLowerCase();

  if (lower.includes('rate limit')) {
    return t('auth.toast.emailRateLimit');
  }
  if (lower.includes('email not confirmed')) {
    return t('auth.toast.emailNotConfirmed');
  }
  if (lower.includes('invalid login credentials')) {
    return t('auth.toast.wrongCredentials');
  }
  if (lower.includes('user already registered')) {
    return t('auth.toast.emailAlreadyRegistered');
  }

  return message || t('auth.toast.registerFailed');
}
