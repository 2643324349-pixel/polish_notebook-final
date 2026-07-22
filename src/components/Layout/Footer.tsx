import {
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="shrink-0 border-t bg-background px-4 py-3 text-center md:py-4">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <a
          href={PRIVACY_POLICY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground hover:underline"
        >
          {t('layout.footer.privacyPolicy')}
        </a>
        <span aria-hidden className="text-muted-foreground/50">
          ·
        </span>
        <a
          href={TERMS_OF_SERVICE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground hover:underline"
        >
          {t('layout.footer.termsOfService')}
        </a>
      </div>
    </footer>
  );
}
