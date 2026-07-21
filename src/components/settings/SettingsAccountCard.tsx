import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '@/components/settings/UserAvatar';
import { Button } from '@/components/ui/button';
import { BRAND_RED_ALT, VIP_GOLD } from '@/lib/constants';
import { useVip } from '@/hooks/useVip';
import { useTranslation } from '@/lib/i18n/t';

interface SettingsAccountCardProps {
  email: string;
}

export function SettingsAccountCard({ email }: SettingsAccountCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isVip } = useVip();

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <UserAvatar email={email} size="lg" showVipBadge={isVip} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate text-lg font-semibold">{email}</p>
          {isVip ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium dark:bg-amber-950/40">
              <Crown className="size-4" style={{ color: VIP_GOLD }} />
              <span style={{ color: VIP_GOLD }}>{t('vip.vipMember')}</span>
              <span className="text-muted-foreground">
                · {t('common.permanentUse')}
              </span>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              className="rounded-full px-5 text-white hover:opacity-90"
              style={{ backgroundColor: BRAND_RED_ALT }}
              onClick={() => navigate('/vip')}
            >
              <Crown className="mr-1.5 size-4" />
              {t('settings.account.upgradeVip')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
