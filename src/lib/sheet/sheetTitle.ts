import { DEFAULT_SHEET_TITLE } from '@/lib/constants';

/** Stored titles treated as “untitled” (legacy defaults + empty). */
const UNTITLED_TITLES = new Set([
  '',
  DEFAULT_SHEET_TITLE,
  '无标题页',
  'Untitled page',
  '未命名页面',
  'Unbenannte Seite',
  'Без назви',
]);

export function isUntitledSheetTitle(title: string): boolean {
  return UNTITLED_TITLES.has(title.trim());
}

export function getSheetDisplayTitle(
  title: string,
  untitledLabel: string,
): string {
  if (isUntitledSheetTitle(title)) return untitledLabel;
  return title.trim();
}

export function normalizeSheetTitle(title: string): string {
  const trimmed = title.trim();
  if (isUntitledSheetTitle(trimmed)) return DEFAULT_SHEET_TITLE;
  return trimmed;
}

export function buildDuplicateTitle(
  baseTitle: string,
  existingTitles: string[],
): string {
  const normalized = normalizeSheetTitle(baseTitle);
  const displayBase = normalized || 'Untitled page';
  const existing = new Set(existingTitles.map((t) => t.trim()));

  const match = displayBase.match(/^(.+?)\s*\((\d+)\)$/);
  const stem = match ? match[1].trim() : displayBase;

  let n = 2;
  while (existing.has(`${stem} (${n})`)) {
    n += 1;
  }
  return `${stem} (${n})`;
}
