import {
  DEFAULT_NOTEBOOK_COLOR,
  NOTEBOOK_COLOR_STORAGE_KEY,
  NOTEBOOK_COLORS,
  NOTEBOOK_ORDER_STORAGE_KEY,
} from '@/lib/constants';
import type { Notebook } from '@/types';

type ColorMap = Record<string, string>;

const colorListeners = new Map<string, Set<() => void>>();

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getColorStorageKey(userId: string): string {
  return `${NOTEBOOK_COLOR_STORAGE_KEY}:${userId}`;
}

function notifyColorChange(userId: string): void {
  colorListeners.get(userId)?.forEach((listener) => listener());
}

function migrateLegacyColors(userId: string): ColorMap {
  const scopedKey = getColorStorageKey(userId);
  const scoped = readJson<ColorMap>(scopedKey, {});
  if (Object.keys(scoped).length > 0) return scoped;

  const legacy = readJson<ColorMap>(NOTEBOOK_COLOR_STORAGE_KEY, {});
  if (Object.keys(legacy).length > 0) {
    writeJson(scopedKey, legacy);
  }
  return legacy;
}

export function subscribeNotebookColors(
  userId: string,
  onStoreChange: () => void,
): () => void {
  if (!colorListeners.has(userId)) {
    colorListeners.set(userId, new Set());
  }
  colorListeners.get(userId)!.add(onStoreChange);
  return () => {
    colorListeners.get(userId)?.delete(onStoreChange);
  };
}

export function getNotebookColors(userId: string): ColorMap {
  if (!userId) return {};
  const key = getColorStorageKey(userId);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw) as ColorMap;
    } catch {
      return {};
    }
  }
  return migrateLegacyColors(userId);
}

export function getNotebookColor(notebookId: string, userId: string): string {
  if (!userId) return DEFAULT_NOTEBOOK_COLOR;
  const colors = getNotebookColors(userId);
  return colors[notebookId] ?? DEFAULT_NOTEBOOK_COLOR;
}

export function setNotebookColor(
  notebookId: string,
  color: string,
  userId: string,
): void {
  if (!userId) return;
  const colors = { ...getNotebookColors(userId), [notebookId]: color };
  writeJson(getColorStorageKey(userId), colors);
  notifyColorChange(userId);
}

export function removeNotebookColor(notebookId: string, userId: string): void {
  if (!userId) return;
  const colors = { ...getNotebookColors(userId) };
  delete colors[notebookId];
  writeJson(getColorStorageKey(userId), colors);
  notifyColorChange(userId);
}

export function ensureNotebookColors(
  notebooks: Notebook[],
  userId: string,
): void {
  if (!userId || notebooks.length === 0) return;

  const colors = { ...getNotebookColors(userId) };
  let changed = false;

  notebooks.forEach((notebook, index) => {
    if (!colors[notebook.id]) {
      colors[notebook.id] =
        NOTEBOOK_COLORS[index % NOTEBOOK_COLORS.length].value;
      changed = true;
    }
  });

  if (changed) {
    writeJson(getColorStorageKey(userId), colors);
    notifyColorChange(userId);
  }
}

export function getNotebookOrder(): string[] {
  return readJson<string[]>(NOTEBOOK_ORDER_STORAGE_KEY, []);
}

export function setNotebookOrder(order: string[]): void {
  writeJson(NOTEBOOK_ORDER_STORAGE_KEY, order);
}

export function prependNotebookOrder(notebookId: string): void {
  const order = getNotebookOrder().filter((id) => id !== notebookId);
  setNotebookOrder([notebookId, ...order]);
}

export function removeFromNotebookOrder(notebookId: string): void {
  setNotebookOrder(getNotebookOrder().filter((id) => id !== notebookId));
}

export function applyNotebookOrder(notebooks: Notebook[]): Notebook[] {
  const order = getNotebookOrder();
  if (order.length === 0) return notebooks;

  const map = new Map(notebooks.map((n) => [n.id, n]));
  const ordered: Notebook[] = [];

  for (const id of order) {
    const notebook = map.get(id);
    if (notebook) {
      ordered.push(notebook);
      map.delete(id);
    }
  }

  for (const notebook of map.values()) {
    ordered.push(notebook);
  }

  return ordered;
}
