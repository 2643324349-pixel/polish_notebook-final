import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <section className={cn('space-y-2', className)}>
      <h2 className="px-1 text-xs font-medium text-muted-foreground">{title}</h2>
      <div className="overflow-hidden rounded-2xl border bg-card">{children}</div>
    </section>
  );
}
