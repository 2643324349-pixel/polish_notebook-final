import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import * as notebooksApi from '@/lib/api/notebooks';
import { fetchSheetCounts } from '@/lib/api/rows';
import { t } from '@/lib/i18n/t';
import {
  ensureNotebookColors,
  getNotebookColor,
  getNotebookOrder,
  setNotebookColor,
  setNotebookOrder,
} from '@/lib/notebookMeta';
import { checkDuplicateName, NOTEBOOK_DUPLICATE_NAME } from '@/lib/schemas/notebook';
import { DEFAULT_NOTEBOOK_NAME } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useNotebookMeta } from '@/hooks/useNotebookMeta';
import { useNotebookStore } from '@/store/notebookStore';
import type { Notebook } from '@/types';

let loadRequestId = 0;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return t('notebooks.errors.loadFailed');
}

export function useNotebooks() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const {
    notebooks,
    loadingNotebooks,
    notebooksError,
    sheetCounts,
    setNotebooks,
    setLoadingNotebooks,
    setNotebooksError,
    addNotebook,
    updateNotebook,
    removeNotebook,
    setSheetCounts,
  } = useNotebookStore();
  const { sortNotebooks, saveOrder, onNotebookCreated, onNotebookDeleted } =
    useNotebookMeta();
  const [searchQuery, setSearchQuery] = useState('');

  const sortedNotebooks = useMemo(
    () => sortNotebooks(notebooks),
    [notebooks, sortNotebooks],
  );

  const filteredNotebooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedNotebooks;
    return sortedNotebooks.filter((n) =>
      n.name.toLowerCase().includes(q),
    );
  }, [sortedNotebooks, searchQuery]);

  const loadNotebooks = useCallback(async () => {
    if (authLoading) return;

    if (!userId) {
      loadRequestId += 1;
      setNotebooks([]);
      setSheetCounts({});
      setNotebooksError(null);
      setLoadingNotebooks(false);
      return;
    }

    const requestId = ++loadRequestId;
    setLoadingNotebooks(true);
    setNotebooksError(null);

    try {
      const data = await notebooksApi.fetchNotebooks(userId);
      if (requestId !== loadRequestId) return;

      setNotebooks(data);
      ensureNotebookColors(data, userId);
      setLoadingNotebooks(false);

      void fetchSheetCounts(data.map((n) => n.id))
        .then((counts) => {
          if (requestId !== loadRequestId) return;
          setSheetCounts(counts);
        })
        .catch((countError) => {
          console.error('Failed to fetch sheet counts:', countError);
          if (requestId !== loadRequestId) return;
          setSheetCounts({});
        });
    } catch (error) {
      console.error('Failed to fetch notebooks:', error);
      if (requestId !== loadRequestId) return;
      setNotebooks([]);
      setSheetCounts({});
      setNotebooksError(toErrorMessage(error));
      setLoadingNotebooks(false);
    }
  }, [
    authLoading,
    userId,
    setNotebooks,
    setLoadingNotebooks,
    setNotebooksError,
    setSheetCounts,
  ]);

  useEffect(() => {
    void loadNotebooks();
  }, [loadNotebooks]);

  const createNotebook = useCallback(
    async (name: string, color: string) => {
      if (!userId) throw new Error('Not authenticated');

      const trimmed = name.trim();
      if (checkDuplicateName(trimmed, notebooks)) {
        throw new Error(NOTEBOOK_DUPLICATE_NAME);
      }

      const notebook = await notebooksApi.createNotebook(userId, trimmed);
      onNotebookCreated(notebook.id, color);
      addNotebook(notebook);
      setSheetCounts({ ...sheetCounts, [notebook.id]: 0 });
      return notebook;
    },
    [userId, notebooks, onNotebookCreated, addNotebook, sheetCounts, setSheetCounts],
  );

  const renameNotebook = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim() || DEFAULT_NOTEBOOK_NAME;

      if (checkDuplicateName(trimmed, notebooks, id)) {
        throw new Error(NOTEBOOK_DUPLICATE_NAME);
      }

      const updated = await notebooksApi.updateNotebook(id, { name: trimmed });
      updateNotebook(updated);
      return updated;
    },
    [notebooks, updateNotebook],
  );

  const deleteNotebook = useCallback(
    async (id: string) => {
      console.log('[useNotebooks] deleteNotebook', id);
      if (!userId) return;

      const snapshot = notebooks.find((n) => n.id === id);
      if (!snapshot) return;

      const savedColor = getNotebookColor(id, userId);
      const savedOrder = getNotebookOrder();

      removeNotebook(id);
      onNotebookDeleted(id);

      try {
        await notebooksApi.deleteNotebook(id);
        console.log('[useNotebooks] deleteNotebook success', id);
      } catch (error) {
        addNotebook(snapshot);
        setNotebookColor(snapshot.id, savedColor, userId);
        setNotebookOrder(savedOrder);
        void loadNotebooks();
        toast.error(t('notebooks.toast.deleteFailedRestored'));
        throw error;
      }
    },
    [notebooks, removeNotebook, onNotebookDeleted, addNotebook, loadNotebooks, userId],
  );

  const reorderNotebooks = useCallback(
    (reordered: Notebook[]) => {
      setNotebooks(reordered);
      saveOrder(reordered.map((n) => n.id));
    },
    [setNotebooks, saveOrder],
  );

  const getNotebookById = useCallback(
    (id: string) => notebooks.find((n) => n.id === id),
    [notebooks],
  );

  return {
    notebooks: filteredNotebooks,
    allNotebooks: sortedNotebooks,
    sheetCounts,
    loading: loadingNotebooks,
    error: notebooksError,
    isAuthenticated: !!userId,
    searchQuery,
    setSearchQuery,
    refresh: loadNotebooks,
    createNotebook,
    renameNotebook,
    deleteNotebook,
    reorderNotebooks,
    getNotebookById,
  };
}
