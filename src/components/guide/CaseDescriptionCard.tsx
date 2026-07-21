import type { CaseKey } from '@/types/guide';
import { useGuideContent } from '@/hooks/useGuideContent';
import { cn } from '@/lib/utils';

interface CaseDescriptionCardProps {
  caseKey: CaseKey;
  className?: string;
}

export function CaseDescriptionCard({
  caseKey,
  className,
}: CaseDescriptionCardProps) {
  const { caseInfo } = useGuideContent();
  const info = caseInfo[caseKey];

  return (
    <div
      className={cn(
        'rounded-2xl border border-rose-100 bg-rose-50/60 p-5',
        className,
      )}
    >
      <h2 className="text-lg font-semibold">
        {info.abbr} {info.name} ({info.namePl})
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{info.description}</p>
      <p className="mt-3 rounded-lg bg-background/80 px-3 py-2 font-mono text-sm">
        {info.example}{' '}
        <span className="text-muted-foreground">
          ({info.exampleTranslation})
        </span>
      </p>
    </div>
  );
}
