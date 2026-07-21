import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GuidePromoCard } from '@/components/notebooks/GuidePromoCard';
import { NewNotebookDialog } from '@/components/notebooks/NewNotebookDialog';
import { NotebookEmptyState } from '@/components/notebooks/NotebookEmptyState';
import { NotebookListHeader } from '@/components/notebooks/NotebookListHeader';
import { NotebookSearch } from '@/components/notebooks/NotebookSearch';
import { SortableNotebookList } from '@/components/notebooks/SortableNotebookList';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useAuth } from '@/hooks/useAuth';
import { useSheets } from '@/hooks/useSheets';
import * as sheetsApi from '@/lib/api/sheets';
import { useTranslation } from '@/lib/i18n/t';
import { BRAND_RED } from '@/lib/constants';
import { useUiStore } from '@/store/uiStore';
import type { Notebook } from '@/types';

export function NotebooksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const {
    notebooks,
    allNotebooks,
    sheetCounts,
    loading: notebooksLoading,
    error,
    isAuthenticated,
    searchQuery,
    setSearchQuery,
    refresh,
    createNotebook,
    renameNotebook,
    deleteNotebook,
    reorderNotebooks,
    getNotebookById,
  } = useNotebooks();

  const {
    viewingNotebookId,
    setViewingNotebookId,
    expandNotebook,
    setActiveNotebookId,
  } = useUiStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);

  const viewingNotebook = viewingNotebookId
    ? getNotebookById(viewingNotebookId)
    : null;
  const viewingPageCount = viewingNotebookId
    ? (sheetCounts[viewingNotebookId] ?? 0)
    : 0;

  const { createSheet } = useSheets(viewingNotebookId);

  const handleCreateNotebook = async (name: string, color: string) => {
    try {
      const notebook = await createNotebook(name, color);
      expandNotebook(notebook.id);
      setActiveNotebookId(notebook.id);
      setViewingNotebookId(notebook.id);
    } catch (error) {
      if (error instanceof Error && error.message === '已存在') {
        throw error;
      }
      toast.error('创建失败，请重试');
      throw error;
    }
  };

  const handleOpenNotebook = async (notebook: Notebook) => {
    const count = sheetCounts[notebook.id] ?? 0;
    expandNotebook(notebook.id);
    setActiveNotebookId(notebook.id);

    if (count > 0) {
      setViewingNotebookId(null);
      try {
        const sheets = await sheetsApi.fetchSheets(notebook.id);
        if (sheets.length > 0) {
          navigate(`/sheet/${sheets[0].id}`);
        }
      } catch {
        toast.error('加载页面失败');
      }
    } else {
      setViewingNotebookId(notebook.id);
    }
  };

  const handleRename = async (id: string, name: string) => {
    try {
      await renameNotebook(id, name);
    } catch (error) {
      if (error instanceof Error && error.message === '已存在') {
        toast.error('已存在');
      } else {
        toast.error('重命名失败');
      }
    }
  };

  const handleDelete = async (id: string) => {
    console.log('[NotebooksPage] handleDelete', id);
    try {
      await deleteNotebook(id);
      if (viewingNotebookId === id) {
        setViewingNotebookId(null);
      }
    } catch {
      // toast handled in hook
    }
  };

  const handleCreatePage = async () => {
    if (!viewingNotebookId) return;
    setCreatingPage(true);
    try {
      const sheet = await createSheet();
      setViewingNotebookId(null);
      navigate(`/sheet/${sheet.id}`);
    } catch {
      toast.error('创建页面失败');
    } finally {
      setCreatingPage(false);
    }
  };

  const handleReorder = (reordered: Notebook[]) => {
    if (searchQuery.trim()) return;
    const idOrder = reordered.map((n) => n.id);
    const remaining = allNotebooks.filter((n) => !idOrder.includes(n.id));
    reorderNotebooks([...reordered, ...remaining]);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">{t('notebooks.loginTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('notebooks.loginSubtitle')}
        </p>
        <Button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-6 rounded-full px-6 py-2 text-sm text-white hover:opacity-90"
          style={{ backgroundColor: BRAND_RED }}
        >
          {t('notebooks.goToLogin')}
        </Button>
      </div>
    );
  }

  if (notebooksLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center">
        <AlertCircle className="size-10 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">加载笔记本失败</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => void refresh()}
        >
          重试
        </Button>
      </div>
    );
  }

  if (viewingNotebook && viewingPageCount === 0) {
    return (
      <NotebookEmptyState
        notebookName={viewingNotebook.name}
        onBack={() => setViewingNotebookId(null)}
        onCreatePage={() => void handleCreatePage()}
        creating={creatingPage}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6">
      <NotebookListHeader
        count={allNotebooks.length}
        onNewNotebook={() => setDialogOpen(true)}
      />

      <NotebookSearch value={searchQuery} onChange={setSearchQuery} />

      {notebooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {searchQuery ? t('notebooks.emptySearch') : t('notebooks.emptyList')}
        </div>
      ) : (
        <SortableNotebookList
          notebooks={notebooks}
          sheetCounts={sheetCounts}
          onReorder={handleReorder}
          onOpen={handleOpenNotebook}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}

      <GuidePromoCard />

      <NewNotebookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateNotebook}
        existingNames={allNotebooks.map((n) => n.name)}
      />
    </div>
  );
}
