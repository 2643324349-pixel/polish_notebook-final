import type { MarkerColor } from '@/types';

export const MARKER_COLOR_OPTIONS = [
  { id: 'fog_blue' as const, value: '#9BB0C2' as MarkerColor },
  { id: 'gray_green' as const, value: '#B5C0A8' as MarkerColor },
  { id: 'lotus_pink' as const, value: '#D4C4C0' as MarkerColor },
] as const;

export function isMarkerColor(value: unknown): value is MarkerColor {
  return MARKER_COLOR_OPTIONS.some((option) => option.value === value);
}

/** Cell marker takes priority over row marker. */
export function resolveCellMarkerColor(
  cellMarker?: MarkerColor | null,
  rowMarker?: MarkerColor | null,
): MarkerColor | null {
  return cellMarker ?? rowMarker ?? null;
}

export function getMarkerContrastTextColor(hex: MarkerColor): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#1a1a1a' : '#ffffff';
}
