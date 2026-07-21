import { SidebarNav } from '@/components/Layout/SidebarNav';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  className?: string;
  onNewNotebook?: () => void;
}

export function AppSidebar({ className, onNewNotebook }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'hidden h-full min-h-0 w-72 shrink-0 border-r border-sidebar-border md:flex md:flex-col',
        className,
      )}
    >
      <SidebarNav className="w-full" onNewNotebook={onNewNotebook} />
    </aside>
  );
}
