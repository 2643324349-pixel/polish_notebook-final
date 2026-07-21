import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet as DrawerSheet, SheetContent } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/Layout/SidebarNav';
import { AppLogo } from '@/components/shared/AppLogo';
import { APP_NAME } from '@/lib/constants';
import { useUiStore } from '@/store/uiStore';

interface MobileHeaderProps {
  onNewNotebook?: () => void;
}

export function MobileHeader({ onNewNotebook }: MobileHeaderProps) {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <AppLogo size="sm" />
        <span className="text-sm font-bold tracking-tight">{APP_NAME}</span>
      </header>

      <DrawerSheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarNav
            onNavigate={() => setMobileSidebarOpen(false)}
            onNewNotebook={onNewNotebook}
            className="h-full"
          />
        </SheetContent>
      </DrawerSheet>
    </>
  );
}
