import { create } from 'zustand';
import type { Notebook, Sheet } from '@/types';

interface NotebookState {
  notebooks: Notebook[];
  sheetsByNotebook: Record<string, Sheet[]>;
  sheetCounts: Record<string, number>;
  loadingNotebooks: boolean;
  notebooksError: string | null;
  loadingSheets: Record<string, boolean>;
  setNotebooks: (notebooks: Notebook[]) => void;
  setSheets: (notebookId: string, sheets: Sheet[]) => void;
  setSheetCounts: (counts: Record<string, number>) => void;
  setSheetCount: (notebookId: string, count: number) => void;
  addNotebook: (notebook: Notebook) => void;
  updateNotebook: (notebook: Notebook) => void;
  removeNotebook: (notebookId: string) => void;
  addSheet: (notebookId: string, sheet: Sheet, atStart?: boolean) => void;
  updateSheet: (notebookId: string, sheet: Sheet) => void;
  removeSheet: (notebookId: string, sheetId: string) => void;
  moveSheetBetweenNotebooks: (
    fromNotebookId: string,
    toNotebookId: string,
    sheet: Sheet,
  ) => void;
  insertSheetAfter: (
    notebookId: string,
    afterSheetId: string,
    sheet: Sheet,
  ) => void;
  setLoadingNotebooks: (loading: boolean) => void;
  setNotebooksError: (error: string | null) => void;
  setLoadingSheets: (notebookId: string, loading: boolean) => void;
}

export const useNotebookStore = create<NotebookState>((set) => ({
  notebooks: [],
  sheetsByNotebook: {},
  sheetCounts: {},
  loadingNotebooks: false,
  notebooksError: null,
  loadingSheets: {},
  setNotebooks: (notebooks) => set({ notebooks }),
  setSheets: (notebookId, sheets) =>
    set((state) => ({
      sheetsByNotebook: { ...state.sheetsByNotebook, [notebookId]: sheets },
      sheetCounts: { ...state.sheetCounts, [notebookId]: sheets.length },
    })),
  setSheetCounts: (counts) => set({ sheetCounts: counts }),
  setSheetCount: (notebookId, count) =>
    set((state) => ({
      sheetCounts: { ...state.sheetCounts, [notebookId]: count },
    })),
  addNotebook: (notebook) =>
    set((state) => ({ notebooks: [notebook, ...state.notebooks] })),
  updateNotebook: (notebook) =>
    set((state) => ({
      notebooks: state.notebooks.map((n) =>
        n.id === notebook.id ? notebook : n,
      ),
    })),
  removeNotebook: (notebookId) =>
    set((state) => {
      const { [notebookId]: _sheets, ...restSheets } = state.sheetsByNotebook;
      const { [notebookId]: _count, ...restCounts } = state.sheetCounts;
      return {
        notebooks: state.notebooks.filter((n) => n.id !== notebookId),
        sheetsByNotebook: restSheets,
        sheetCounts: restCounts,
      };
    }),
  addSheet: (notebookId, sheet, atStart = false) =>
    set((state) => {
      const existing = state.sheetsByNotebook[notebookId] ?? [];
      const sheets = atStart ? [sheet, ...existing] : [...existing, sheet];
      return {
        sheetsByNotebook: {
          ...state.sheetsByNotebook,
          [notebookId]: sheets,
        },
        sheetCounts: {
          ...state.sheetCounts,
          [notebookId]: sheets.length,
        },
      };
    }),
  updateSheet: (notebookId, sheet) =>
    set((state) => ({
      sheetsByNotebook: {
        ...state.sheetsByNotebook,
        [notebookId]: (state.sheetsByNotebook[notebookId] ?? []).map((s) =>
          s.id === sheet.id ? sheet : s,
        ),
      },
    })),
  removeSheet: (notebookId, sheetId) =>
    set((state) => {
      const sheets = (state.sheetsByNotebook[notebookId] ?? []).filter(
        (s) => s.id !== sheetId,
      );
      return {
        sheetsByNotebook: {
          ...state.sheetsByNotebook,
          [notebookId]: sheets,
        },
        sheetCounts: {
          ...state.sheetCounts,
          [notebookId]: sheets.length,
        },
      };
    }),
  moveSheetBetweenNotebooks: (fromNotebookId, toNotebookId, sheet) =>
    set((state) => {
      const fromSheets = (state.sheetsByNotebook[fromNotebookId] ?? []).filter(
        (s) => s.id !== sheet.id,
      );
      const toSheets = [...(state.sheetsByNotebook[toNotebookId] ?? []), sheet];
      return {
        sheetsByNotebook: {
          ...state.sheetsByNotebook,
          [fromNotebookId]: fromSheets,
          [toNotebookId]: toSheets,
        },
        sheetCounts: {
          ...state.sheetCounts,
          [fromNotebookId]: fromSheets.length,
          [toNotebookId]: toSheets.length,
        },
      };
    }),
  insertSheetAfter: (notebookId, afterSheetId, sheet) =>
    set((state) => {
      const existing = state.sheetsByNotebook[notebookId] ?? [];
      const index = existing.findIndex((s) => s.id === afterSheetId);
      const sheets =
        index === -1
          ? [...existing, sheet]
          : [
              ...existing.slice(0, index + 1),
              sheet,
              ...existing.slice(index + 1),
            ];
      return {
        sheetsByNotebook: {
          ...state.sheetsByNotebook,
          [notebookId]: sheets,
        },
        sheetCounts: {
          ...state.sheetCounts,
          [notebookId]: sheets.length,
        },
      };
    }),
  setLoadingNotebooks: (loading) => set({ loadingNotebooks: loading }),
  setNotebooksError: (error) => set({ notebooksError: error }),
  setLoadingSheets: (notebookId, loading) =>
    set((state) => ({
      loadingSheets: { ...state.loadingSheets, [notebookId]: loading },
    })),
}));
