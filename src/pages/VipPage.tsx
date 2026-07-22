import { useEffect, useState } from 'react';
import { Crown, WifiOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { VipComparisonCards } from '@/components/vip/VipComparisonCards';
import { VipPayBar } from '@/components/vip/VipPayBar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useVip } from '@/hooks/useVip';
import { VIP_GOLD } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';

export function VipPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isVip, mockUpgrade } = useVip();
  const [online, setOnline] = useState(navigator.onLine);
  const [paying, setPaying] = useState(false);
  const [paymentUnavailable] = useState(false);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  const requireLoginForUpgrade = () => {
    navigate('/login?redirect=/vip');
  };

  const handleMockPay = async () => {
    if (!user) {
      requireLoginForUpgrade();
      return;
    }

    setPaying(true);
    try {
      await mockUpgrade();
      toast.success(t('vip.toast.upgradeSuccess'));
    } catch (error) {
      console.error('Mock VIP upgrade failed:', error);
      toast.error(t('vip.toast.upgradeFailed'));
    } finally {
      setPaying(false);
    }
  };

  const handlePay = async () => {
    if (!user) {
      requireLoginForUpgrade();
      return;
    }

    setPaying(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.info(t('vip.paymentRedirectHint'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-32 md:p-6 md:pb-6">
      <div className="rounded-2xl bg-gradient-to-b from-amber-50 to-white p-6 text-center dark:from-amber-950/40 dark:to-background">
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl text-white"
          style={{ background: `linear-gradient(135deg, ${VIP_GOLD}, #f59e0b)` }}
        >
          <Crown className="size-7" />
        </div>
        <h1 className="text-xl font-bold">{t('vip.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('vip.subtitle')}</p>
        {user && isVip && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium dark:bg-amber-900/40">
            <Crown className="size-4" style={{ color: VIP_GOLD }} />
            <span style={{ color: VIP_GOLD }}>{t('vip.vipMember')}</span>
            <span className="text-muted-foreground">· {t('common.permanentUse')}</span>
          </div>
        )}
      </div>

      {!online ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-12 text-center">
          <WifiOff className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('vip.offlineMessage')}</p>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : (
        <>
          <div>
            <h2 className="mb-3 text-sm font-semibold">{t('vip.comparisonTitle')}</h2>
            <VipComparisonCards />
          </div>

          {!isVip && (
            <>
              <VipPayBar
                disabled={paymentUnavailable}
                disabledHint={
                  paymentUnavailable ? t('vip.paymentUnavailable') : undefined
                }
                loading={paying}
                onPay={() => void handlePay()}
              />
              <div className="mt-3 text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={paying}
                  onClick={() => void handleMockPay()}
                >
                  {t('vip.mockPay')}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {user ? (
          <Link to="/settings" className="underline hover:text-foreground">
            {t('vip.backToSettings')}
          </Link>
        ) : (
          <Link to="/notebooks" className="underline hover:text-foreground">
            {t('auth.backToHome')}
          </Link>
        )}
      </p>
    </div>
  );
}
