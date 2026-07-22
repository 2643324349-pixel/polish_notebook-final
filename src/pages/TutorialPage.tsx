import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TutorialStepCarousel } from '@/components/tutorial/TutorialStepCarousel';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/t';

const TUTORIAL_STEP_IMAGES = [
  '/tutorial/step-1.png',
  '/tutorial/step-2.png',
  '/tutorial/step-3.png',
  '/tutorial/step-4.png',
  '/tutorial/step-5.png',
  '/tutorial/step-6.png',
] as const;

export function TutorialPage() {
  const { t } = useTranslation();

  const steps = useMemo(
    () =>
      ([1, 2, 3, 4, 5, 6] as const).map((n, index) => ({
        title: t(`tutorial.steps.${n}.title`),
        description: t(`tutorial.steps.${n}.description`),
        image: TUTORIAL_STEP_IMAGES[index],
      })),
    [t],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/notebooks" aria-label={t('common.back')}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{t('tutorial.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('tutorial.subtitle')}</p>
        </div>
      </div>

      <TutorialStepCarousel steps={steps} />
    </div>
  );
}
