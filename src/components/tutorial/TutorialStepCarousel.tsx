import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';

export interface TutorialStep {
  title: string;
  description: string;
  image: string;
}

interface TutorialStepCarouselProps {
  steps: TutorialStep[];
}

export function TutorialStepCarousel({ steps }: TutorialStepCarouselProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="aspect-[16/10] bg-muted/40">
          <img
            key={step.image}
            src={step.image}
            alt={step.title}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="space-y-2 p-6">
          <p className="text-xs font-medium text-primary">
            {t('common.stepIndicator', {
              current: index + 1,
              total: steps.length,
            })}
          </p>
          <h2 className="text-lg font-semibold">{step.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={t('common.stepAriaLabel', { step: i + 1 })}
            onClick={() => setIndex(i)}
            className={cn(
              'size-2 rounded-full transition-colors',
              i === index ? 'bg-primary w-6' : 'bg-muted-foreground/30',
            )}
          />
        ))}
      </div>

      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isFirst}
          onClick={() => setIndex((i) => i - 1)}
        >
          <ChevronLeft className="mr-1 size-4" />
          {t('tutorial.prev')}
        </Button>
        <Button
          type="button"
          disabled={isLast}
          onClick={() => setIndex((i) => i + 1)}
        >
          {t('tutorial.next')}
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
