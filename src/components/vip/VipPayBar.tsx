import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VIP_GOLD } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';

interface VipPayBarProps {
  disabled?: boolean;
  disabledHint?: string;
  onPay: () => void;
  loading?: boolean;
}

export function VipPayBar({
  disabled = false,
  disabledHint,
  onPay,
  loading = false,
}: VipPayBarProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      {disabledHint && (
        <p className="mb-2 text-center text-xs text-muted-foreground">
          {disabledHint}
        </p>
      )}
      <Button
        type="button"
        className="h-12 w-full rounded-2xl text-base font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, ${VIP_GOLD}, #f59e0b)` }}
        disabled={disabled || loading}
        onClick={onPay}
      >
        <Crown className="mr-2 size-5" />
        {t('vip.plans.lifetime')} · {t('vip.plans.price')}
      </Button>
    </div>
  );
}
