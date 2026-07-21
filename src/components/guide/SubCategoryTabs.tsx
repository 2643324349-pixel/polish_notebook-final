import { cn } from '@/lib/utils';
import { BRAND_RED } from '@/lib/constants';

interface SubCategoryTabsProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function SubCategoryTabs({
  options,
  value,
  onChange,
}: SubCategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-transparent text-white'
                : 'border-border bg-background hover:bg-muted',
            )}
            style={isActive ? { backgroundColor: BRAND_RED } : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
