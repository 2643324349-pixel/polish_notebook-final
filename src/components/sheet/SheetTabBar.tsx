import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, FolderInput, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DragHandle } from '@/components/shared/DragHandle';
import { EditableTitle } from '@/components/shared/EditableTitle';
import { NativeMenuItem } from '@/components/sheet/NativeMenu';
import { getSheetDisplayTitle } from '@/lib/sheet/sheetTitle';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import type { Sheet } from '@/types';

interface SheetTabProps {
  sheet: Sheet;
  active: boolean;
  onContextMenu: (event: React.MouseEvent, sheet: Sheet) => void;
  onRename: (title: string) => void;
}

function SheetTab({ sheet, active, onContextMenu, onRename }: SheetTabProps) {
  const { t } = useTranslation();
  const untitledLabel = t('sheet.untitledPage');
  const displayTitle = getSheetDisplayTitle(sheet.title, untitledLabel);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sheet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex shrink-0 items-center gap-1 rounded-t-lg border border-b-0 px-2 py-1.5',
        active ? 'border-border bg-background' : 'border-transparent bg-muted/50',
        isDragging && 'z-10 opacity-80 shadow-md',
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, sheet);
      }}
    >
      <div
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DragHandle attributes={attributes} listeners={listeners} />
      </div>
      <Link
        to={`/sheet/${sheet.id}`}
        className={cn(
          'max-w-[160px] text-sm',
          active && 'font-medium',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <EditableTitle
          value={displayTitle}
          onSave={onRename}
          placeholder={untitledLabel}
        />
      </Link>
    </div>
  );
}

interface SheetTabBarProps {
  tabs: Sheet[];
  activeSheetId: string | undefined;
  busy?: boolean;
  onCreate: () => void;
  onRename: (sheetId: string, title: string) => void;
  onDelete: (sheetId: string) => void;
  onDuplicate: (sheetId: string) => void;
  onMove: (sheetId: string) => void;
  onReorder: (tabs: Sheet[]) => void;
}

export function SheetTabBar({
  tabs,
  activeSheetId,
  busy = false,
  onCreate,
  onRename,
  onDelete,
  onDuplicate,
  onMove,
  onReorder,
}: SheetTabBarProps) {
  const { t } = useTranslation();
  const [contextMenu, setContextMenu] = useState<{
    sheet: Sheet;
    x: number;
    y: number;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sheet | null>(null);
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

  const tabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
    const newIndex = tabs.findIndex((tab) => tab.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(tabs, oldIndex, newIndex));
  };

  return (
    <>
      <div className="flex items-end gap-1 overflow-x-auto border-b bg-muted/30 px-2 pt-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabIds}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map((tab) => (
              <SheetTab
                key={tab.id}
                sheet={tab}
                active={tab.id === activeSheetId}
                onContextMenu={(e, sheet) => {
                  setContextMenu({
                    sheet,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onRename={(title) => onRename(tab.id, title)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          type="button"
          disabled={busy}
          className="mb-1 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          onClick={onCreate}
        >
          <Plus className="size-4" />
          {t('sheet.toolbar.newPage')}
        </button>
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[250]"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-[300] min-w-[10rem] rounded-md border bg-popover p-1 shadow-md"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <NativeMenuItem
              onClick={() => {
                setContextMenu(null);
                onDuplicate(contextMenu.sheet.id);
              }}
            >
              <Copy className="size-4" />
              {t('sheet.tabMenu.duplicate')}
            </NativeMenuItem>
            <NativeMenuItem
              onClick={() => {
                setContextMenu(null);
                onMove(contextMenu.sheet.id);
              }}
            >
              <FolderInput className="size-4" />
              {t('sheet.tabMenu.moveTo')}
            </NativeMenuItem>
            <NativeMenuItem
              destructive
              onClick={() => {
                pendingDeleteIdRef.current = contextMenu.sheet.id;
                setDeleteTarget(contextMenu.sheet);
                setContextMenu(null);
              }}
            >
              <Trash2 className="size-4" />
              {t('sheet.tabMenu.delete')}
            </NativeMenuItem>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('sheet.deletePageTitle')}
        description={t('sheet.deletePageDescription', {
          title: deleteTarget?.title ?? '',
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={async () => {
          const id = pendingDeleteIdRef.current ?? deleteTarget?.id;
          if (!id) return;
          onDelete(id);
          pendingDeleteIdRef.current = null;
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
