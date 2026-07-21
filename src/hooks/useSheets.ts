import { useCallback } from 'react';
import * as sheetsApi from '@/lib/api/sheets';
import { applySheetOrder } from '@/lib/sheet/sheetMeta';
import { useAuth } from '@/hooks/useAuth';
import { useNotebookStore } from '@/store/notebookStore';

export function useSheets(notebookId: string | null) {
  const { user } = useAuth();
  const {
    sheetsByNotebook,
    loadingSheets,
    setSheets,
    setLoadingSheets,
    addSheet,
  } = useNotebookStore();

  const sheets = notebookId ? (sheetsByNotebook[notebookId] ?? []) : [];
  const loading = notebookId ? (loadingSheets[notebookId] ?? false) : false;

  const loadSheets = useCallback(async () => {
    if (!user || !notebookId) return;

    setLoadingSheets(notebookId, true);
    try {
      const data = await sheetsApi.fetchSheets(notebookId);
      setSheets(notebookId, applySheetOrder(notebookId, data));
    } catch (error) {
      console.error('Failed to fetch sheets:', error);
      setSheets(notebookId, []);
    } finally {
      setLoadingSheets(notebookId, false);
    }
  }, [user, notebookId, setSheets, setLoadingSheets]);

  const createSheet = useCallback(
    async (title?: string) => {
      if (!notebookId) throw new Error('No notebook selected');
      const sheet = await sheetsApi.createSheetWithDefaultRow(notebookId, title);
      addSheet(notebookId, sheet);
      return sheet;
    },
    [notebookId, addSheet],
  );

  return {
    sheets,
    loading,
    loadSheets,
    createSheet,
  };
}
