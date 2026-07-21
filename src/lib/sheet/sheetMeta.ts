import type { Sheet } from '@/types';

const SHEET_ORDER_KEY = 'polish-sheet-order';

type SheetOrderMap = Record<string, string[]>;

function readOrderMap(): SheetOrderMap {
  try {
    const raw = localStorage.getItem(SHEET_ORDER_KEY);
    return raw ? (JSON.parse(raw) as SheetOrderMap) : {};
  } catch {
    return {};
  }
}

function writeOrderMap(map: SheetOrderMap): void {
  localStorage.setItem(SHEET_ORDER_KEY, JSON.stringify(map));
}

export function getSheetOrder(notebookId: string): string[] {
  return readOrderMap()[notebookId] ?? [];
}

export function setSheetOrder(notebookId: string, order: string[]): void {
  const map = readOrderMap();
  map[notebookId] = order;
  writeOrderMap(map);
}

export function prependSheetOrder(notebookId: string, sheetId: string): void {
  const order = getSheetOrder(notebookId).filter((id) => id !== sheetId);
  setSheetOrder(notebookId, [sheetId, ...order]);
}

export function removeFromSheetOrder(notebookId: string, sheetId: string): void {
  setSheetOrder(
    notebookId,
    getSheetOrder(notebookId).filter((id) => id !== sheetId),
  );
}

export function insertSheetOrderAfter(
  notebookId: string,
  afterSheetId: string,
  sheetId: string,
): void {
  const order = getSheetOrder(notebookId).filter((id) => id !== sheetId);
  const index = order.indexOf(afterSheetId);
  if (index === -1) {
    setSheetOrder(notebookId, [...order, sheetId]);
    return;
  }
  const next = [...order];
  next.splice(index + 1, 0, sheetId);
  setSheetOrder(notebookId, next);
}

export function applySheetOrder(notebookId: string, sheets: Sheet[]): Sheet[] {
  const order = getSheetOrder(notebookId);
  if (order.length === 0) return sheets;

  const map = new Map(sheets.map((s) => [s.id, s]));
  const ordered: Sheet[] = [];

  for (const id of order) {
    const sheet = map.get(id);
    if (sheet) {
      ordered.push(sheet);
      map.delete(id);
    }
  }

  for (const sheet of map.values()) {
    ordered.push(sheet);
  }

  return ordered;
}
