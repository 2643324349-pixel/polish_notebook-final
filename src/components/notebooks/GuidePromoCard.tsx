import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { NOTEBOOK_COLORS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';

export function GuidePromoCard() {
  const { t } = useTranslation();
  const color = NOTEBOOK_COLORS[3].value;

  return (
    <Link
      to="/guide"
      className="group relative flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="absolute bottom-4 left-0 top-4 w-1.5 rounded-r-full"
        style={{ backgroundColor: color }}
      />

      <div
        className="ml-4 flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}20` }}
      >
        <BookOpen className="size-5" style={{ color }} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold">{t('notebooks.guidePromoTitle')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('notebooks.guidePromoDescription')}
        </p>
      </div>

      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
