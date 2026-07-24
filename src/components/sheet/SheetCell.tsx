import { useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { MarkerColorMenuItems } from '@/components/sheet/MarkerColorMenuItems';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { GenderCellContent } from '@/components/sheet/GenderCellContent';
import {
  getCellEditValue,
  isCellEmpty,
  isCellHidden,
} from '@/lib/sheet/cellUtils';
import {
  getMarkerContrastTextColor,
  resolveCellMarkerColor,
} from '@/lib/sheet/markerColors';
import { useTranslation } from '@/lib/i18n/t';
import { columnWidthStyleToCss } from '@/lib/sheet/columnWidthUtils';
import type { ColumnWidthStyle } from '@/lib/sheet/columnWidthUtils';
import { SHEET_CELL_TEXT_CLASS } from '@/lib/sheet/sheetStyles';
import { cn } from '@/lib/utils';
import type { CellData, MarkerColor } from '@/types';

const CLICK_EDIT_DELAY_MS = 200;
const LONG_PRESS_MS = 500;

interface SheetCellProps {
  cell: CellData | undefined;
  rowMarkerColor?: MarkerColor | null;
  widthStyle: ColumnWidthStyle;
  supportsGender: boolean;
  plainEditable?: boolean;
  frozen?: boolean;
  stickyLeft?: number;
  stickyTop?: number;
  zIndex?: number;
  selectionMode?: boolean;
  isSelected?: boolean;
  isSearchMatch?: boolean;
  isActiveSearchMatch?: boolean;
  onToggleHidden: () => void;
  onGenerate?: () => void | Promise<void>;
  onSave?: (value: string) => void | Promise<void>;
  onSetMarkerColor?: (color: MarkerColor | null) => void | Promise<void>;
  onSelectCell?: (options: { shift?: boolean; meta?: boolean }) => void;
  onEnterSelectionMode?: () => void;
}

export function SheetCell({
  cell,
  rowMarkerColor,
  widthStyle,
  supportsGender,
  plainEditable = false,
  frozen = false,
  stickyLeft,
  stickyTop,
  zIndex = 1,
  selectionMode = false,
  isSelected = false,
  isSearchMatch = false,
  isActiveSearchMatch = false,
  onToggleHidden,
  onGenerate,
  onSave,
  onSetMarkerColor,
  onSelectCell,
  onEnterSelectionMode,
}: SheetCellProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [slowPulse, setSlowPulse] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const empty = isCellEmpty(cell);
  const hidden = isCellHidden(cell);
  const editable =
    (supportsGender || plainEditable) && !!onSave && !selectionMode;
  const showGenerate =
    supportsGender && !!onGenerate && !isEditing && !hidden && !selectionMode;

  const resolvedMarkerColor = resolveCellMarkerColor(
    cell?.marker_color,
    rowMarkerColor,
  );
  const showMarkerBackground = !!resolvedMarkerColor && !selectionMode;

  const style: React.CSSProperties = {
    ...columnWidthStyleToCss(widthStyle),
    height: 'auto',
    ...(showMarkerBackground
      ? {
          backgroundColor: resolvedMarkerColor,
          color: getMarkerContrastTextColor(resolvedMarkerColor),
        }
      : {}),
    ...(frozen
      ? {
          position: 'sticky',
          left: stickyLeft,
          top: stickyTop,
          zIndex,
        }
      : {}),
  };

  useEffect(() => {
    if (!isEditing) {
      setDraft(getCellEditValue(cell));
    }
  }, [cell, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const handleGenerate = async () => {
    if (!onGenerate || generating || isEditing || selectionMode) return;

    setGenerating(true);
    setSlowPulse(false);

    const slowTimer = setTimeout(() => setSlowPulse(true), 1000);

    try {
      await onGenerate();
    } finally {
      clearTimeout(slowTimer);
      setGenerating(false);
      setSlowPulse(false);
    }
  };

  const commitEdit = async () => {
    if (!onSave || saving) return;

    const current = getCellEditValue(cell);
    if (draft === current) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(draft);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setDraft(getCellEditValue(cell));
    setIsEditing(false);
  };

  const startEdit = () => {
    setDraft(getCellEditValue(cell));
    setIsEditing(true);
  };

  const handleClick = () => {
    if (selectionMode) return;
    if (!editable || isEditing) return;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      startEdit();
      clickTimerRef.current = undefined;
    }, CLICK_EDIT_DELAY_MS);
  };

  const handleDoubleClick = () => {
    if (selectionMode) return;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = undefined;
    }

    if (empty) return;

    if (isEditing) {
      cancelEdit();
    }

    onToggleHidden();
  };

  const handlePointerDown = () => {
    if (selectionMode || isEditing) return;

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      onEnterSelectionMode?.();
      longPressTimerRef.current = undefined;
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  };

  const handleCheckboxPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCell?.({
      shift: e.shiftKey,
      meta: e.metaKey || e.ctrlKey,
    });
  };

  const cellBody = (
    <td
      style={style}
      data-search-active={isActiveSearchMatch ? 'true' : undefined}
      className={cn(
        'group/cell relative border-r px-2 py-2 align-top break-words [overflow-wrap:anywhere]',
        SHEET_CELL_TEXT_CLASS,
        !showMarkerBackground && frozen && !isSearchMatch && 'bg-background',
        !showMarkerBackground &&
          hidden &&
          !isEditing &&
          !selectionMode &&
          !isSearchMatch &&
          'bg-muted/50',
        isSelected && selectionMode && 'bg-muted/40',
        isSearchMatch &&
          !isActiveSearchMatch &&
          !showMarkerBackground &&
          'bg-amber-100 dark:bg-amber-900/40',
        isActiveSearchMatch &&
          !showMarkerBackground &&
          'bg-amber-200 dark:bg-amber-800/50',
        isSearchMatch &&
          showMarkerBackground &&
          !isActiveSearchMatch &&
          'ring-2 ring-inset ring-amber-400/70 dark:ring-amber-500/60',
        isActiveSearchMatch &&
          'ring-2 ring-inset ring-amber-500 dark:ring-amber-400',
        (editable || !empty) && !selectionMode && 'cursor-text',
        selectionMode && 'cursor-default',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {selectionMode && (
        <div
          className="absolute left-1 top-1 z-10"
          onPointerDown={handleCheckboxPointerDown}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => {}}
            onClick={handleCheckboxClick}
            className="size-3.5"
          />
        </div>
      )}

      {isEditing ? (
        <div className="relative flex items-center gap-1">
          <Input
            ref={inputRef}
            value={draft}
            disabled={saving}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commitEdit()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void commitEdit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className={cn('h-7 px-2', SHEET_CELL_TEXT_CLASS)}
          />
          {saving && (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
      ) : (
        <>
          {showGenerate && (hovered || generating) && (
            <button
              type="button"
              disabled={generating}
              className={cn(
                'absolute right-1 top-1 z-10 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium',
                'bg-rose-50 text-rose-600 shadow-sm hover:bg-rose-100 disabled:opacity-70',
                slowPulse && generating && 'animate-pulse',
              )}
              onClick={(e) => {
                e.stopPropagation();
                void handleGenerate();
              }}
            >
              {generating ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              Generate
            </button>
          )}

          <GenderCellContent
            cell={cell}
            hidden={hidden}
            empty={empty}
            marked={showMarkerBackground}
            hasGenerateButton={showGenerate && (hovered || generating)}
            hasSelectionCheckbox={selectionMode}
          />
        </>
      )}
    </td>
  );

  if (selectionMode || !onSetMarkerColor) {
    return cellBody;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{cellBody}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger>{t('sheet.markerColor.title')}</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <MarkerColorMenuItems
              variant="context"
              currentColor={cell?.marker_color}
              onSelect={(color) => void onSetMarkerColor(color)}
            />
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
