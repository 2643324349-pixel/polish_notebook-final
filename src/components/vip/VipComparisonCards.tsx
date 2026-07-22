import { Check, X } from 'lucide-react';
import { FREE_TIER_BG, FREE_TIER_MAX_ROWS, VIP_GOLD } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';

const FREE_FEATURE_KEYS = [
  'vip.features.free.oneNotebook',
  'vip.features.free.maxRows',
  'vip.features.free.ads',
  'vip.features.free.noExport',
] as const;

const VIP_FEATURE_KEYS = [
  'vip.features.vip.unlimitedNotebooks',
  'vip.features.vip.unlimitedRows',
  'vip.features.vip.noAds',
  'vip.features.vip.export',
] as const;

export function VipComparisonCards() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      <div
        className="rounded-2xl border p-4"
        style={{ backgroundColor: FREE_TIER_BG }}
      >
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t('vip.plans.free')}
        </h3>
        <ul className="space-y-2">
          {FREE_FEATURE_KEYS.map((key) => (
            <li
              key={key}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <X className="mt-0.5 size-3.5 shrink-0" />
              {key === 'vip.features.free.maxRows'
                ? t(key, { limit: FREE_TIER_MAX_ROWS })
                : t(key)}
            </li>
          ))}
        </ul>
      </div>

      <div
        className={cn(
          'relative rounded-2xl border-2 bg-gradient-to-b from-amber-50 to-white p-4 dark:from-amber-950/30 dark:to-card',
        )}
        style={{ borderColor: VIP_GOLD }}
      >
        <span
          className="absolute -right-1 -top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: VIP_GOLD, color: '#7c5e00' }}
        >
          {t('vip.plans.recommended')}
        </span>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: VIP_GOLD }}>
          {t('vip.plans.vip')}
        </h3>
        <ul className="space-y-2">
          {VIP_FEATURE_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2 text-xs">
              <Check
                className="mt-0.5 size-3.5 shrink-0"
                style={{ color: VIP_GOLD }}
              />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
