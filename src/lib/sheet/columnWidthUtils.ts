import type { ColumnConfig } from '@/types';

/** Match Tailwind `sm` breakpoint — toolbar icon-only below this width. */
export const MOBILE_BREAKPOINT = 640;

export const MOBILE_MIN_COLUMN_WIDTH = 100;

/** Translation column width as a fraction of the table container width on mobile. */
export const MOBILE_TRANSLATION_WIDTH_RATIO = 0.28;

export function isMobileViewport(width: number): boolean {
  return width > 0 && width < MOBILE_BREAKPOINT;
}

/** Display-only widths; does not mutate columns_config stored in Supabase. */
export function getEffectiveColumnWidths(
  columns: ColumnConfig[],
  containerWidth: number,
): number[] {
  if (!isMobileViewport(containerWidth)) {
    return columns.map((column) => column.width);
  }

  const translationWidth = Math.max(
    MOBILE_MIN_COLUMN_WIDTH,
    Math.round(containerWidth * MOBILE_TRANSLATION_WIDTH_RATIO),
  );

  return columns.map((column) => {
    if (column.case_type === 'translation') {
      return translationWidth;
    }
    return Math.max(MOBILE_MIN_COLUMN_WIDTH, column.width);
  });
}
