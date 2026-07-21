import { useEffect, useState } from 'react';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { ChevronRight, MoreVertical, Palette, Trash2 } from 'lucide-react';
import { DragHandle } from '@/components/shared/DragHandle';
import { MarkerColorMenuItems } from '@/components/sheet/MarkerColorMenuItems';
import { NativeMenu, NativeMenuItem } from '@/components/sheet/NativeMenu';
import { ROW_HANDLE_WIDTH } from '@/lib/sheet/freezeUtils';
import {
  getMarkerContrastTextColor,
  isMarkerColor,
} from '@/lib/sheet/markerColors';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import type { MarkerColor } from '@/types';

interface RowHeaderCellProps {
  rowStickyTop?: number;
  rowFrozen: boolean;
  rowMarkerColor?: MarkerColor | null;
  selectionMode?: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  onRequestDelete: () => void;
  onSetRowMarkerColor?: (color: MarkerColor | null) => void | Promise<void>;
}

export function RowHeaderCell({
  rowStickyTop,
  rowFrozen,
  rowMarkerColor,
  selectionMode = false,
  dragAttributes,
  dragListeners,
  onRequestDelete,
  onSetRowMarkerColor,
}: RowHeaderCellProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      setColorPickerOpen(false);
    }
  }, [menuOpen]);

  const hasRowMarker = isMarkerColor(rowMarkerColor);

  return (
    <td
      style={{
        width: ROW_HANDLE_WIDTH,
        minWidth: ROW_HANDLE_WIDTH,
        position: 'sticky',
        left: 0,
        top: rowStickyTop,
        zIndex: rowFrozen ? 25 : 15,
        ...(hasRowMarker
          ? {
              backgroundColor: rowMarkerColor,
              color: getMarkerContrastTextColor(rowMarkerColor),
            }
          : {}),
      }}
      className={cn(
        'relative overflow-visible border-r px-1 py-2 align-middle',
        !hasRowMarker && 'bg-background',
        rowFrozen && !hasRowMarker && 'bg-background',
      )}
    >
      <div className="relative flex items-center justify-center gap-0.5 overflow-visible">
        {!selectionMode && (
          <>
            <div onPointerDown={(e) => e.stopPropagation()}>
              <DragHandle
                attributes={dragAttributes}
                listeners={dragListeners}
                className="size-5"
              />
            </div>
            <NativeMenu
              open={menuOpen}
              onOpenChange={setMenuOpen}
              trigger={
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center rounded-sm opacity-80 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((prev) => !prev);
                  }}
                >
                  <MoreVertical className="size-3.5" />
                  <span className="sr-only">{t('sheet.rowMenu.srOnly')}</span>
                </button>
              }
            >
              {onSetRowMarkerColor && !colorPickerOpen && (
                <NativeMenuItem
                  onClick={() => {
                    setColorPickerOpen(true);
                  }}
                >
                  <Palette className="size-4" />
                  {t('sheet.rowMenu.markRowColor')}
                  <ChevronRight className="ml-auto size-4" />
                </NativeMenuItem>
              )}
              {onSetRowMarkerColor && colorPickerOpen && (
                <MarkerColorMenuItems
                  currentColor={rowMarkerColor}
                  showBack
                  onBack={() => setColorPickerOpen(false)}
                  onSelect={(color) => void onSetRowMarkerColor(color)}
                  onClose={() => setMenuOpen(false)}
                />
              )}
              {!colorPickerOpen && (
                <NativeMenuItem
                  destructive
                  onClick={() => {
                    setMenuOpen(false);
                    onRequestDelete();
                  }}
                >
                  <Trash2 className="size-4" />
                  {t('sheet.rowMenu.deleteRow')}
                </NativeMenuItem>
              )}
            </NativeMenu>
          </>
        )}
      </div>
    </td>
  );
}
