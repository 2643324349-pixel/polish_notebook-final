import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getNotebookColor } from '@/lib/notebookMeta';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import type { Notebook } from '@/types';

interface MoveSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebooks: Notebook[];
  currentNotebookId: string | null;
  userId: string;
  onSelect: (notebookId: string) => void;
}

export function MoveSheetDialog({
  open,
  onOpenChange,
  notebooks,
  currentNotebookId,
  userId,
  onSelect,
}: MoveSheetDialogProps) {
  const { t } = useTranslation();
  const targets = notebooks.filter((nb) => nb.id !== currentNotebookId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('sheet.moveDialog.title')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-72">
          <div className="space-y-1">
            {targets.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                {t('sheet.moveDialog.noTargets')}
              </p>
            ) : (
              targets.map((notebook) => (
                <button
                  key={notebook.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                  )}
                  onClick={() => {
                    onSelect(notebook.id);
                    onOpenChange(false);
                  }}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: getNotebookColor(notebook.id, userId),
                    }}
                  />
                  <span className="truncate">{notebook.name}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
