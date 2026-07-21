import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  onClick?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  className?: string;
}

export function SettingsRow({
  icon: Icon,
  label,
  value,
  onClick,
  destructive = false,
  showChevron = true,
  className,
}: SettingsRowProps) {
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 border-b px-4 py-3.5 text-left last:border-b-0',
        onClick && 'transition-colors hover:bg-muted/50',
        className,
      )}
    >
      <Icon
        className={cn(
          'size-5 shrink-0',
          destructive ? 'text-destructive' : 'text-muted-foreground',
        )}
      />
      <span
        className={cn(
          'flex-1 text-sm font-medium',
          destructive && 'text-destructive',
        )}
      >
        {label}
      </span>
      {value && (
        <span className="text-sm text-muted-foreground">{value}</span>
      )}
      {showChevron && onClick && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      )}
    </Comp>
  );
}
