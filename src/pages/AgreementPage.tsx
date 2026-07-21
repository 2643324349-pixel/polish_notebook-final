import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/t';

export function AgreementPage() {
  const { t } = useTranslation();
  const { type = 'user-agreement' } = useParams<{ type: string }>();

  const title =
    type === 'privacy'
      ? t('agreement.privacyPolicy')
      : type === 'user-agreement' || type === 'terms-of-service'
        ? t('agreement.termsOfService')
        : t('agreement.legalDocument');

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/settings" aria-label={t('common.back')}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-20 text-muted-foreground">
        <Loader2 className="size-8 animate-spin opacity-50" />
        <p className="text-sm">{t('agreement.loading')}</p>
      </div>
    </div>
  );
}
