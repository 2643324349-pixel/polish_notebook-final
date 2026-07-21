import type { GenderForms } from '@/types/guide';
import { cn } from '@/lib/utils';

interface GenderFormsCellProps {
  forms: GenderForms;
  className?: string;
}

export function GenderFormsCell({ forms, className }: GenderFormsCellProps) {
  const lines: { key: string; value: string }[] = [];

  if (forms.m) lines.push({ key: 'm', value: forms.m });
  if (forms.f) lines.push({ key: 'f', value: forms.f });
  if (forms.n) lines.push({ key: 'n', value: forms.n });

  if (lines.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className={cn('space-y-0.5 text-xs leading-relaxed', className)}>
      {lines.map(({ key, value }) => (
        <div key={key}>
          <span>{value}</span>
          <span className="ml-1 text-muted-foreground">({key})</span>
        </div>
      ))}
    </div>
  );
}

export function PastTenseCell({ forms }: { forms: GenderForms }) {
  return <GenderFormsCell forms={forms} />;
}
