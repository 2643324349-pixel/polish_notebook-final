import { create } from 'zustand';

interface UiState {
  mobileSidebarOpen: boolean;
  expandedNotebookIds: string[];
  activeNotebookId: string | null;
  viewingNotebookId: string | null;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setExpandedNotebookIds: (ids: string[]) => void;
  toggleNotebookExpanded: (notebookId: string) => void;
  expandNotebook: (notebookId: string) => void;
  setActiveNotebookId: (notebookId: string | null) => void;
  setViewingNotebookId: (notebookId: string | null) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  mobileSidebarOpen: false,
  expandedNotebookIds: [],
  activeNotebookId: null,
  viewingNotebookId: null,
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleMobileSidebar: () =>
    set({ mobileSidebarOpen: !get().mobileSidebarOpen }),
  setExpandedNotebookIds: (ids) => set({ expandedNotebookIds: ids }),
  toggleNotebookExpanded: (notebookId) => {
    const { expandedNotebookIds } = get();
    const isExpanded = expandedNotebookIds.includes(notebookId);
    set({
      expandedNotebookIds: isExpanded
        ? expandedNotebookIds.filter((id) => id !== notebookId)
        : [...expandedNotebookIds, notebookId],
      activeNotebookId: notebookId,
    });
  },
  expandNotebook: (notebookId) => {
    const { expandedNotebookIds } = get();
    if (!expandedNotebookIds.includes(notebookId)) {
      set({
        expandedNotebookIds: [...expandedNotebookIds, notebookId],
        activeNotebookId: notebookId,
      });
    } else {
      set({ activeNotebookId: notebookId });
    }
  },
  setActiveNotebookId: (notebookId) => set({ activeNotebookId: notebookId }),
  setViewingNotebookId: (notebookId) => set({ viewingNotebookId: notebookId }),
}));
