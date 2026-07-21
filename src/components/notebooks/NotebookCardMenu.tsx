import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buttonVariants } from '@/components/ui/button';
import { MoreVertical, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';

interface NotebookCardMenuProps {
  onDelete: () => void;
}

export function NotebookCardMenu({ onDelete }: NotebookCardMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    console.log('[NotebookCardMenu] onOpenChange', nextOpen);
    setOpen(nextOpen);
  };

  const handleDelete = () => {
    console.log('[NotebookCardMenu] Delete clicked');
    setOpen(false);
    onDelete();
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'size-8 shrink-0',
          )}
          onClick={(e) => {
            console.log('[NotebookCardMenu] trigger click');
            e.stopPropagation();
          }}
        >
          <MoreVertical className="size-4" />
          <span className="sr-only">{t('common.openMenu')}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[200]">
        <DropdownMenuItem
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          onSelect={handleDelete}
        >
          <Trash2 className="size-4" />
          {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
