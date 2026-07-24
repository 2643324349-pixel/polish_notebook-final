import type { CSSProperties } from 'react';
import type { ColumnConfig } from '@/types';

/** Column layout breakpoint — matches Tailwind `md` (768px). */
export const MOBILE_BREAKPOINT = 768;

export const MOBILE_MIN_COLUMN_WIDTH = 70;
export const MOBILE_MAX_COLUMN_WIDTH = 100;

export const DESKTOP_MIN_COLUMN_WIDTH = 100;
export const DESKTOP_MAX_COLUMN_WIDTH = 160;

export const DESKTOP_TRANSLATION_MIN_WIDTH = 120;
export const DESKTOP_TRANSLATION_MAX_WIDTH = 200;

/** Translation column width as a fraction of the table container width on mobile. */
export const MOBILE_TRANSLATION_WIDTH_RATIO = 0.25;

export interface ColumnWidthStyle {
  minWidth: number | string;
  maxWidth: number | string;
  width?: number | string;
}

export function isMobileViewport(width: number): boolean {
  return width > 0 && width < MOBILE_BREAKPOINT;
}

/** Display-only widths; does not mutate columns_config stored in Supabase. */
export function getEffectiveColumnWidthStyles(
  columns: ColumnConfig[],
  containerWidth: number,
): ColumnWidthStyle[] {
  const mobile = isMobileViewport(containerWidth);

  return columns.map((column) => {
    if (column.case_type === 'translation') {
      if (mobile) {
        const percent = `${MOBILE_TRANSLATION_WIDTH_RATIO * 100}%`;
        return { width: percent, minWidth: percent, maxWidth: percent };
      }
      return {
        minWidth: DESKTOP_TRANSLATION_MIN_WIDTH,
        maxWidth: DESKTOP_TRANSLATION_MAX_WIDTH,
        width: 'auto',
      };
    }

    if (mobile) {
      return {
        minWidth: MOBILE_MIN_COLUMN_WIDTH,
        maxWidth: MOBILE_MAX_COLUMN_WIDTH,
        width: 'auto',
      };
    }

    return {
      minWidth: DESKTOP_MIN_COLUMN_WIDTH,
      maxWidth: DESKTOP_MAX_COLUMN_WIDTH,
      width: 'auto',
    };
  });
}

export function columnWidthStyleToCss(style: ColumnWidthStyle): CSSProperties {
  return {
    minWidth: style.minWidth,
    maxWidth: style.maxWidth,
    width: style.width ?? 'auto',
  };
}

/** Pixel estimate for sticky column offsets (uses max width). */
export function estimateColumnPixelWidth(
  column: ColumnConfig,
  style: ColumnWidthStyle,
  containerWidth: number,
): number {
  if (column.case_type === 'translation' && isMobileViewport(containerWidth)) {
    return Math.round(containerWidth * MOBILE_TRANSLATION_WIDTH_RATIO);
  }

  if (typeof style.maxWidth === 'number') {
    return style.maxWidth;
  }

  if (typeof style.minWidth === 'number') {
    return style.minWidth;
  }

  return MOBILE_MAX_COLUMN_WIDTH;
}
