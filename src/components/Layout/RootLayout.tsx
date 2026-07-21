import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { AppSidebar } from '@/components/Layout/AppSidebar';
import { BottomNav } from '@/components/Layout/BottomNav';
import { MobileHeader } from '@/components/Layout/MobileHeader';
import { NewNotebookDialog } from '@/components/notebooks/NewNotebookDialog';
import { useAuth } from '@/hooks/useAuth';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

export function RootLayout() {
  const { user, loading } = useAuth();
  const { setUser, setLoading } = useAuthStore();
  const { expandNotebook, setActiveNotebookId, setViewingNotebookId } =
    useUiStore();
  const { allNotebooks, createNotebook } = useNotebooks();
  const [sidebarDialogOpen, setSidebarDialogOpen] = useState(false);

  useEffect(() => {
    setUser(user);
    setLoading(loading);
  }, [user, loading, setUser, setLoading]);

  const handleSidebarCreateNotebook = async (name: string, color: string) => {
    const notebook = await createNotebook(name, color);
    expandNotebook(notebook.id);
    setActiveNotebookId(notebook.id);
    setViewingNotebookId(notebook.id);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <Toaster position="top-center" richColors />
      <MobileHeader onNewNotebook={() => setSidebarDialogOpen(true)} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar onNewNotebook={() => setSidebarDialogOpen(true)} />
        <main className="min-w-0 flex-1 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
      <BottomNav />

      <NewNotebookDialog
        open={sidebarDialogOpen}
        onOpenChange={setSidebarDialogOpen}
        onSubmit={handleSidebarCreateNotebook}
        existingNames={allNotebooks.map((n) => n.name)}
      />
    </div>
  );
}
