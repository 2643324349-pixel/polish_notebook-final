import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Trash2 } from 'lucide-react';
import { EditableTitle } from '@/components/shared/EditableTitle';
import { DragHandle } from '@/components/shared/DragHandle';
import { NativeMenu, NativeMenuItem } from '@/components/sheet/NativeMenu';
import { canRenameColumn } from '@/lib/sheet/columnUtils';
import { getColumnLabel, isColumnLocked } from '@/lib/sheet/defaultSheet';
import { SHEET_HEADER_CELL_CLASS } from '@/lib/sheet/sheetStyles';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import type { ColumnConfig } from '@/types';

interface ColumnHeaderProps {
  column: ColumnConfig;
  width?: number;
  frozen?: boolean;
  stickyLeft?: number;
  stickyTop?: number;
  zIndex?: number;
  selectionMode?: boolean;
  onRename: (label: string) => void;
  onDelete: () => void;
}

export function ColumnHeader({
  column,
  width,
  frozen = false,
  stickyLeft,
  stickyTop,
  zIndex = 20,
  selectionMode = false,
  onRename,
  onDelete,
}: ColumnHeaderProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const locked = isColumnLocked(column);
  const sortable = useSortable({
    id: column.id,
    disabled: locked || selectionMode,
  });

  const resolvedWidth = width ?? column.width;

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    width: resolvedWidth,
    minWidth: resolvedWidth,
    maxWidth: resolvedWidth,
    ...(frozen
      ? {
          position: 'sticky' as const,
          left: stickyLeft,
          top: stickyTop,
          zIndex,
        }
      : {}),
  };

  const label = getColumnLabel(column);

  return (
    <th
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        'relative px-2 py-2 text-left align-middle',
        SHEET_HEADER_CELL_CLASS,
        sortable.isDragging && 'z-10 opacity-80 shadow-md',
      )}
    >
      <div className="flex items-center gap-1">
        {!locked && !selectionMode && (
          <div
            className="shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DragHandle
              attributes={sortable.attributes}
              listeners={sortable.listeners}
              className="size-5"
            />
          </div>
        )}

        <div className="min-w-0 flex-1 text-sm font-medium">
          {canRenameColumn(column) && !selectionMode ? (
            <EditableTitle
              value={label}
              onSave={onRename}
              placeholder={t('sheet.columnMenu.notePlaceholder')}
              className="block"
              inputClassName="text-sm"
            />
          ) : (
            <span className="block truncate" title={label}>
              {label}
            </span>
          )}
        </div>

        {!selectionMode && !locked && (
          <NativeMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            trigger={
              <button
                type="button"
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
              >
                <MoreVertical className="size-3.5" />
                <span className="sr-only">{t('sheet.columnMenu.srOnly')}</span>
              </button>
            }
          >
            <NativeMenuItem
              destructive
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              <Trash2 className="size-4" />
              {t('sheet.columnMenu.deleteColumn')}
            </NativeMenuItem>
          </NativeMenu>
        )}
      </div>
    </th>
  );
}
