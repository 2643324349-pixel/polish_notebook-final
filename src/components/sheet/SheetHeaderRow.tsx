import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Pin, Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ColumnHeader } from '@/components/sheet/ColumnHeader';
import { ColumnPickerDialog } from '@/components/sheet/ColumnPickerDialog';
import { getColumnLabel } from '@/lib/sheet/defaultSheet';
import {
  ADD_COLUMN_WIDTH,
  getColumnLeftOffsets,
  isHeaderRowFrozen,
  ROW_HANDLE_WIDTH,
} from '@/lib/sheet/freezeUtils';
import { SHEET_HEADER_CELL_CLASS } from '@/lib/sheet/sheetStyles';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import type { ColumnConfig, FrozenConfig } from '@/types';
import type { ColumnPresetOption } from '@/lib/sheet/columnPresets';

interface SheetHeaderRowProps {
  columns: ColumnConfig[];
  columnWidths: number[];
  frozenConfig: FrozenConfig;
  onAddPreset: (preset: ColumnPresetOption) => void | Promise<void>;
  onAddCustom: (label: string) => void | Promise<void>;
  onRename: (columnId: string, label: string) => void;
  onDelete: (columnId: string) => void | Promise<void>;
  onReorder: (activeId: string, overId: string) => void;
  onOpenFreeze: () => void;
  selectionMode?: boolean;
}

export function SheetHeaderRow({
  columns,
  columnWidths,
  frozenConfig,
  onAddPreset,
  onAddCustom,
  onRename,
  onDelete,
  onReorder,
  onOpenFreeze,
  selectionMode = false,
}: SheetHeaderRowProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ColumnConfig | null>(null);
  const pendingDeleteIdRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnIds = useMemo(() => columns.map((col) => col.id), [columns]);
  const columnLeftOffsets = useMemo(
    () => getColumnLeftOffsets(columns, columnWidths),
    [columns, columnWidths],
  );
  const headerFrozen = isHeaderRowFrozen(frozenConfig.freeze_rows);

  const handleDragEnd = (event: DragEndEvent) => {
    if (selectionMode) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <thead>
          <tr>
            <th
              style={{
                width: ROW_HANDLE_WIDTH,
                minWidth: ROW_HANDLE_WIDTH,
                ...(headerFrozen
                  ? { position: 'sticky', top: 0, left: 0, zIndex: 40 }
                  : {}),
              }}
              className={cn(
                'px-1 py-2 text-center align-middle',
                SHEET_HEADER_CELL_CLASS,
              )}
            >
              {!selectionMode && (
                <button
                  type="button"
                  className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={onOpenFreeze}
                  title={t('sheet.freeze.configTitle')}
                >
                  <Pin className="size-3.5" />
                  <span className="sr-only">{t('sheet.freeze.srOnly')}</span>
                </button>
              )}
            </th>
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((column, colIndex) => (
                <ColumnHeader
                  key={column.id}
                  column={column}
                  width={columnWidths[colIndex]}
                  selectionMode={selectionMode}
                  frozen={headerFrozen || colIndex < frozenConfig.freeze_cols}
                  stickyLeft={
                    colIndex < frozenConfig.freeze_cols
                      ? columnLeftOffsets[colIndex]
                      : undefined
                  }
                  stickyTop={headerFrozen ? 0 : undefined}
                  zIndex={
                    headerFrozen && colIndex < frozenConfig.freeze_cols
                      ? 35
                      : headerFrozen
                        ? 30
                        : colIndex < frozenConfig.freeze_cols
                          ? 25
                          : 20
                  }
                  onRename={(label) => onRename(column.id, label)}
                  onDelete={() => {
                    pendingDeleteIdRef.current = column.id;
                    setDeleteTarget(column);
                  }}
                />
              ))}
            </SortableContext>
            <th
              style={{
                width: ADD_COLUMN_WIDTH,
                minWidth: ADD_COLUMN_WIDTH,
                ...(headerFrozen
                  ? { position: 'sticky', top: 0, zIndex: 20 }
                  : {}),
              }}
              className={cn('px-2 py-2', SHEET_HEADER_CELL_CLASS)}
            >
              {!selectionMode && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setPickerOpen(true)}
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">{t('sheet.toolbar.addColumn')}</span>
                </button>
              )}
            </th>
          </tr>
        </thead>
      </DndContext>

      <ColumnPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelectPreset={onAddPreset}
        onAddCustom={onAddCustom}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('sheet.deleteColumnTitle')}
        description={t('sheet.deleteColumnDescription', {
          column: deleteTarget ? getColumnLabel(deleteTarget) : '',
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={async () => {
          const id = pendingDeleteIdRef.current ?? deleteTarget?.id;
          if (!id) return;
          await onDelete(id);
          pendingDeleteIdRef.current = null;
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
