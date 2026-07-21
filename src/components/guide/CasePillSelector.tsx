import type { CaseKey } from '@/types/guide';
import { CASE_ORDER } from '@/types/guide';
import { useGuideContent } from '@/hooks/useGuideContent';
import { BRAND_RED } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CasePillSelectorProps {
  selected: CaseKey;
  onSelect: (caseKey: CaseKey) => void;
}

export function CasePillSelector({ selected, onSelect }: CasePillSelectorProps) {
  const { caseInfo } = useGuideContent();

  return (
    <div className="flex flex-wrap gap-2">
      {CASE_ORDER.map((key) => {
        const info = caseInfo[key];
        const isActive = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-transparent text-white'
                : 'border-border bg-background text-foreground hover:bg-muted',
            )}
            style={isActive ? { backgroundColor: BRAND_RED } : undefined}
          >
            {info.abbr}
          </button>
        );
      })}
    </div>
  );
}
