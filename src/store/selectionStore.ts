import { create } from 'zustand';

export type SelectionMode = 'idle' | 'selecting';

export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

export function makeCellKey(rowId: string, columnId: string): string {
  return `${rowId}_${columnId}`;
}

interface SelectionStore {
  mode: SelectionMode;
  selectedCells: string[];
  allSelected: boolean;
  lastSelectedCell: CellPosition | null;

  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  clearSelection: () => void;
  isSelected: (key: string) => boolean;
  selectCell: (key: string, position: CellPosition) => void;
  toggleCell: (
    key: string,
    position: CellPosition,
    options?: { shift?: boolean; meta?: boolean },
    grid?: string[][],
  ) => void;
  selectRect: (
    from: CellPosition,
    to: CellPosition,
    grid: string[][],
  ) => void;
  toggleAll: (allKeys: string[]) => void;
  setAllSelected: (allKeys: string[]) => void;
}

function getRectKeys(
  from: CellPosition,
  to: CellPosition,
  grid: string[][],
): string[] {
  const minRow = Math.min(from.rowIndex, to.rowIndex);
  const maxRow = Math.max(from.rowIndex, to.rowIndex);
  const minCol = Math.min(from.colIndex, to.colIndex);
  const maxCol = Math.max(from.colIndex, to.colIndex);
  const keys: string[] = [];

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      const key = grid[row]?.[col];
      if (key) keys.push(key);
    }
  }

  return keys;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  mode: 'idle',
  selectedCells: [],
  allSelected: false,
  lastSelectedCell: null,

  enterSelectionMode: () =>
    set({
      mode: 'selecting',
      selectedCells: [],
      allSelected: false,
      lastSelectedCell: null,
    }),

  exitSelectionMode: () =>
    set({
      mode: 'idle',
      selectedCells: [],
      allSelected: false,
      lastSelectedCell: null,
    }),

  clearSelection: () =>
    set({
      selectedCells: [],
      allSelected: false,
      lastSelectedCell: null,
    }),

  isSelected: (key) => get().selectedCells.includes(key),

  selectCell: (key, position) => {
    const selected = get().selectedCells;
    const next = selected.includes(key) ? selected : [...selected, key];
    set({
      selectedCells: next,
      lastSelectedCell: position,
      allSelected: false,
    });
  },

  selectRect: (from, to, grid) => {
    const rectKeys = getRectKeys(from, to, grid);
    const total = grid.flat().length;
    set({
      selectedCells: rectKeys,
      allSelected: total > 0 && rectKeys.length === total,
    });
  },

  toggleCell: (key, position, options, grid) => {
    if (options?.shift && grid && get().lastSelectedCell) {
      get().selectRect(get().lastSelectedCell!, position, grid);
      set({ lastSelectedCell: position });
      return;
    }

    const selected = get().selectedCells;
    const isOn = selected.includes(key);
    let next: string[];

    if (options?.meta) {
      next = isOn
        ? selected.filter((item) => item !== key)
        : [...selected, key];
    } else {
      next = isOn
        ? selected.filter((item) => item !== key)
        : [...selected, key];
    }

    set({
      selectedCells: next,
      lastSelectedCell: position,
      allSelected: false,
    });
  },

  toggleAll: (allKeys) => {
    const { allSelected } = get();
    if (allSelected) {
      set({ selectedCells: [], allSelected: false, lastSelectedCell: null });
      return;
    }
    set({ selectedCells: [...allKeys], allSelected: true });
  },

  setAllSelected: (allKeys) => {
    set({
      selectedCells: [...allKeys],
      allSelected: true,
      lastSelectedCell: null,
    });
  },
}));
