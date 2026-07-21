import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FREE_ROW_LIMIT, VIP_GOLD } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';

interface VipUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowCount?: number;
}

export function VipUpgradeDialog({
  open,
  onOpenChange,
  rowCount,
}: VipUpgradeDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/vip');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div
            className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl text-white"
            style={{ background: `linear-gradient(135deg, ${VIP_GOLD}, #f59e0b)` }}
          >
            <Crown className="size-6" />
          </div>
          <DialogTitle className="text-center">
            {t('vip.rowLimit.title')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('vip.rowLimit.description')}
          </DialogDescription>
        </DialogHeader>

        {rowCount != null && (
          <p className="text-center text-sm text-muted-foreground">
            {t('vip.rowLimit.currentCount', {
              count: rowCount,
              limit: FREE_ROW_LIMIT,
            })}
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full rounded-xl text-white hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${VIP_GOLD}, #f59e0b)` }}
            onClick={handleUpgrade}
          >
            <Crown className="mr-2 size-4" />
            {t('vip.rowLimit.upgrade')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
