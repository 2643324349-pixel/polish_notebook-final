import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as sheetsApi from '@/lib/api/sheets';
import { DEFAULT_SHEET_TITLE } from '@/lib/constants';
import { t } from '@/lib/i18n/t';
import {
  applySheetOrder,
  insertSheetOrderAfter,
  prependSheetOrder,
  removeFromSheetOrder,
  setSheetOrder,
} from '@/lib/sheet/sheetMeta';
import { normalizeSheetTitle } from '@/lib/sheet/sheetTitle';
import { useSheets } from '@/hooks/useSheets';
import { useNotebookStore } from '@/store/notebookStore';
import type { Sheet } from '@/types';

export function useSheetTabs(activeSheetId: string | undefined) {
  const navigate = useNavigate();
  const [currentSheet, setCurrentSheet] = useState<Sheet | null>(null);
  const [loadingSheet, setLoadingSheet] = useState(true);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const notebookId = currentSheet?.notebook_id ?? null;
  const { sheets: rawSheets, loading: loadingTabs, loadSheets } =
    useSheets(notebookId);

  const {
    setSheets,
    addSheet,
    updateSheet: updateSheetInStore,
    removeSheet: removeSheetFromStore,
    moveSheetBetweenNotebooks,
    insertSheetAfter,
  } = useNotebookStore();

  const tabs = useMemo(() => {
    if (!notebookId) return [];
    return applySheetOrder(notebookId, rawSheets);
  }, [notebookId, rawSheets]);

  const loadCurrentSheet = useCallback(async () => {
    if (!activeSheetId) {
      setCurrentSheet(null);
      setSheetError(t('sheet.pageNotSpecified'));
      setLoadingSheet(false);
      return;
    }

    setLoadingSheet(true);
    setSheetError(null);
    try {
      const sheet = await sheetsApi.fetchSheetById(activeSheetId);
      setCurrentSheet(sheet);
    } catch (error) {
      console.error('Failed to load sheet:', error);
      setCurrentSheet(null);
      setSheetError(t('sheet.pageLoadFailed'));
    } finally {
      setLoadingSheet(false);
    }
  }, [activeSheetId]);

  useEffect(() => {
    void loadCurrentSheet();
  }, [loadCurrentSheet]);

  useEffect(() => {
    if (notebookId) {
      void loadSheets();
    }
  }, [notebookId, loadSheets]);

  const navigateAfterDelete = useCallback(
    (deletedId: string, remaining: Sheet[]) => {
      if (deletedId !== activeSheetId) return;
      const next = remaining[0];
      if (next) {
        navigate(`/sheet/${next.id}`);
      } else {
        navigate('/notebooks');
      }
    },
    [activeSheetId, navigate],
  );

  const createTab = useCallback(async () => {
    if (!notebookId) return null;

    setBusy(true);
    try {
      const sheet = await sheetsApi.createSheetWithDefaultRow(
        notebookId,
        DEFAULT_SHEET_TITLE,
      );
      prependSheetOrder(notebookId, sheet.id);
      addSheet(notebookId, sheet, true);
      navigate(`/sheet/${sheet.id}`);
      return sheet;
    } catch (error) {
      console.error('Failed to create tab:', error);
      toast.error(t('sheet.toast.createTabFailed'));
      return null;
    } finally {
      setBusy(false);
    }
  }, [notebookId, addSheet, navigate]);

  const renameTab = useCallback(
    async (sheetId: string, title: string) => {
      if (!notebookId) return;

      const normalized = normalizeSheetTitle(title);
      try {
        const updated = await sheetsApi.updateSheet(sheetId, {
          title: normalized,
        });
        updateSheetInStore(notebookId, updated);
        if (sheetId === activeSheetId) {
          setCurrentSheet(updated);
        }
      } catch (error) {
        console.error('Failed to rename tab:', error);
        toast.error(t('sheet.toast.renameFailed'));
      }
    },
    [notebookId, activeSheetId, updateSheetInStore],
  );

  const deleteTab = useCallback(
    async (sheetId: string) => {
      if (!notebookId) return;

      const remaining = tabs.filter((tab) => tab.id !== sheetId);
      try {
        await sheetsApi.deleteSheet(sheetId);
        removeFromSheetOrder(notebookId, sheetId);
        removeSheetFromStore(notebookId, sheetId);
        if (sheetId === activeSheetId) {
          setCurrentSheet(null);
        }
        navigateAfterDelete(sheetId, remaining);
      } catch (error) {
        console.error('Failed to delete tab:', error);
        toast.error(t('sheet.toast.deleteTabFailed'));
      }
    },
    [
      notebookId,
      tabs,
      activeSheetId,
      removeSheetFromStore,
      navigateAfterDelete,
    ],
  );

  const duplicateTab = useCallback(
    async (sheetId: string) => {
      if (!notebookId) return null;

      setBusy(true);
      try {
        const duplicated = await sheetsApi.duplicateSheet(
          sheetId,
          tabs.map((tab) => tab.title),
        );
        insertSheetOrderAfter(notebookId, sheetId, duplicated.id);
        insertSheetAfter(notebookId, sheetId, duplicated);
        navigate(`/sheet/${duplicated.id}`);
        return duplicated;
      } catch (error) {
        console.error('Failed to duplicate tab:', error);
        toast.error(t('sheet.toast.duplicateTabFailed'));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [notebookId, tabs, insertSheetAfter, navigate],
  );

  const moveTab = useCallback(
    async (sheetId: string, targetNotebookId: string) => {
      if (!notebookId || targetNotebookId === notebookId) return;

      const sheet = tabs.find((tab) => tab.id === sheetId);
      if (!sheet) return;

      setBusy(true);
      try {
        const moved = await sheetsApi.moveSheet(sheetId, targetNotebookId);
        removeFromSheetOrder(notebookId, sheetId);
        removeSheetFromStore(notebookId, sheetId);
        prependSheetOrder(targetNotebookId, moved.id);
        moveSheetBetweenNotebooks(notebookId, targetNotebookId, moved);
        if (sheetId === activeSheetId) {
          setCurrentSheet(moved);
        }
      } catch (error) {
        console.error('Failed to move tab:', error);
        toast.error(t('sheet.toast.moveTabFailed'));
      } finally {
        setBusy(false);
      }
    },
    [
      notebookId,
      tabs,
      activeSheetId,
      removeSheetFromStore,
      moveSheetBetweenNotebooks,
    ],
  );

  const reorderTabs = useCallback(
    (ordered: Sheet[]) => {
      if (!notebookId) return;
      setSheets(notebookId, ordered);
      setSheetOrder(notebookId, ordered.map((sheet) => sheet.id));
    },
    [notebookId, setSheets],
  );

  return {
    currentSheet,
    tabs,
    notebookId,
    loading: loadingSheet || loadingTabs,
    error: sheetError,
    busy,
    createTab,
    renameTab,
    deleteTab,
    duplicateTab,
    moveTab,
    reorderTabs,
    reload: loadCurrentSheet,
    updateCurrentSheet: setCurrentSheet,
  };
}
