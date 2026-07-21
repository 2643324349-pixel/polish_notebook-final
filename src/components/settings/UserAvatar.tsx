import { Crown } from 'lucide-react';
import { BRAND_RED_ALT, VIP_GOLD } from '@/lib/constants';
import { cn } from '@/lib/utils';

function getAvatarLetters(email: string | null | undefined): string {
  if (!email) return '??';
  const local = email.split('@')[0] ?? '';
  const letters = local.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2);
  if (letters.length >= 2) return letters.toUpperCase();
  if (letters.length === 1) return `${letters}${letters}`.toUpperCase();
  return '??';
}

interface UserAvatarProps {
  email?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showVipBadge?: boolean;
}

const SIZE_MAP = {
  sm: 'size-9 text-xs',
  md: 'size-12 text-sm',
  lg: 'size-16 text-xl',
} as const;

export function UserAvatar({
  email,
  size = 'md',
  className,
  showVipBadge = false,
}: UserAvatarProps) {
  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-semibold text-white',
          SIZE_MAP[size],
        )}
        style={{ backgroundColor: BRAND_RED_ALT }}
        aria-hidden
      >
        {getAvatarLetters(email)}
      </div>
      {showVipBadge && (
        <div
          className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-amber-100 ring-2 ring-background dark:bg-amber-950"
          title="VIP"
        >
          <Crown className="size-2.5" style={{ color: VIP_GOLD }} />
        </div>
      )}
    </div>
  );
}

export { getAvatarLetters };
