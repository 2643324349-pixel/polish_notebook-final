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
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { NotebookCard } from '@/components/notebooks/NotebookCard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useNotebookMeta } from '@/hooks/useNotebookMeta';
import { useTranslation } from '@/lib/i18n/t';
import type { Notebook } from '@/types';

interface SortableNotebookListProps {
  notebooks: Notebook[];
  sheetCounts: Record<string, number>;
  onReorder: (notebooks: Notebook[]) => void;
  onOpen: (notebook: Notebook) => void;
  onRename: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function SortableNotebookList({
  notebooks,
  sheetCounts,
  onReorder,
  onOpen,
  onRename,
  onDelete,
}: SortableNotebookListProps) {
  const { t } = useTranslation();
  const { getColor } = useNotebookMeta();
  const [deleteTarget, setDeleteTarget] = useState<Notebook | null>(null);
  const pendingDeleteIdRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => notebooks.map((n) => n.id), [notebooks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = notebooks.findIndex((n) => n.id === active.id);
    const newIndex = notebooks.findIndex((n) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(notebooks, oldIndex, newIndex));
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {notebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                color={getColor(notebook.id)}
                pageCount={sheetCounts[notebook.id] ?? 0}
                onOpen={() => onOpen(notebook)}
                onRename={(name) => onRename(notebook.id, name)}
                onDelete={() => {
                  console.log('[SortableNotebookList] open delete confirm', notebook.id);
                  pendingDeleteIdRef.current = notebook.id;
                  setDeleteTarget(notebook);
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('notebooks.deleteTitle')}
        description={t('notebooks.deleteDescription', {
          name: deleteTarget?.name ?? '',
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={async () => {
          const id = pendingDeleteIdRef.current ?? deleteTarget?.id;
          console.log('[SortableNotebookList] confirm delete', id);
          if (!id) return;
          await onDelete(id);
          pendingDeleteIdRef.current = null;
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
