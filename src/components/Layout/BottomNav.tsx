import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND_RED } from '@/lib/constants';

const NAV_ITEMS = [
  { to: '/notebooks', label: '首页', icon: Home, match: ['/notebooks'] },
  { to: '/guide', label: '指南', icon: BookOpen, match: ['/guide'] },
  { to: '/notebooks', label: '表格', icon: Table2, match: ['/sheet'] },
] as const;

export function BottomNav() {
  const location = useLocation();

  const isActive = (match: readonly string[]) => {
    if (match.includes('/sheet')) {
      return location.pathname.startsWith('/sheet');
    }
    return match.some((m) => location.pathname === m);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => {
          const active = isActive(match);
          return (
            <Link
              key={label}
              to={to}
              className={cn(
                'flex flex-col items-center gap-1 text-xs transition-colors',
                active ? 'font-medium' : 'text-muted-foreground',
              )}
              style={active ? { color: BRAND_RED } : undefined}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
