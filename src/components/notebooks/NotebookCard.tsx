import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditableTitle } from '@/components/shared/EditableTitle';
import { DragHandle } from '@/components/shared/DragHandle';
import { NotebookCardMenu } from '@/components/notebooks/NotebookCardMenu';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import type { Notebook } from '@/types';

interface NotebookCardProps {
  notebook: Notebook;
  color: string;
  pageCount: number;
  onOpen: () => void;
  onRename: (name: string) => void | Promise<void>;
  onDelete: () => void;
}

export function NotebookCard({
  notebook,
  color,
  pageCount,
  onOpen,
  onRename,
  onDelete,
}: NotebookCardProps) {
  const { t, i18n } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: notebook.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formattedDate = new Date(notebook.updated_at).toLocaleDateString(
    i18n.language,
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'z-10 opacity-80 shadow-lg',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute bottom-4 left-0 top-4 w-1.5 rounded-r-full"
        style={{ backgroundColor: color }}
      />

      <div
        className={cn(
          'ml-2 shrink-0 transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0',
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DragHandle attributes={attributes} listeners={listeners} />
      </div>

      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={onOpen}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className="text-lg font-semibold"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <EditableTitle
            value={notebook.name}
            onSave={onRename}
            className="block"
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('notebooks.cardMeta', { count: pageCount, date: formattedDate })}
        </p>
      </div>

      <div
        className="flex shrink-0 items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <NotebookCardMenu onDelete={onDelete} />
        <ChevronRight className="size-5 text-muted-foreground" />
      </div>
    </div>
  );
}
