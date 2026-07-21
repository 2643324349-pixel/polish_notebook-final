import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Progress } from '@/components/ui/progress';
import {
  clearAppCache,
  estimateCacheSizeMb,
} from '@/lib/settings/cacheUtils';
import { useTranslation } from '@/lib/i18n/t';

interface ClearCacheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSizeUpdate?: (mb: string) => void;
}

export function ClearCacheDialog({
  open,
  onOpenChange,
  onSizeUpdate,
}: ClearCacheDialogProps) {
  const { t } = useTranslation();
  const [clearing, setClearing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setClearing(false);
      setProgress(0);
    }
  }, [open]);

  const handleConfirm = async () => {
    setClearing(true);
    setProgress(30);
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + 12, 92));
    }, 180);

    try {
      const freed = await clearAppCache();
      setProgress(100);
      toast.success(t('settings.cache.freed', { size: freed }));
      const size = await estimateCacheSizeMb();
      onSizeUpdate?.(`${size} MB`);
    } finally {
      clearInterval(timer);
      setClearing(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      {clearing && (
        <div className="fixed inset-x-4 bottom-24 z-50 rounded-xl border bg-card p-4 shadow-lg md:inset-x-auto md:bottom-8 md:left-1/2 md:w-80 md:-translate-x-1/2">
          <p className="mb-2 text-sm">{t('settings.cache.clearing')}</p>
          <Progress value={progress} />
        </div>
      )}
      <ConfirmDialog
        open={open && !clearing}
        onOpenChange={onOpenChange}
        title={t('settings.cache.title')}
        description={t('settings.cache.description')}
        confirmLabel={t('settings.cache.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirm}
      />
    </>
  );
}
