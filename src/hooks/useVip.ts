import { useAuthStore } from '@/store/authStore';
import { useVipStore } from '@/store/vipStore';

export function useVip() {
  const user = useAuthStore((s) => s.user);
  const isVip = useVipStore((s) => s.isVip);
  const vipExpiresAt = useVipStore((s) => s.vipExpiresAt);
  const loading = useVipStore((s) => s.loading);
  const checkVipStatus = useVipStore((s) => s.checkVipStatus);
  const mockUpgradeToVip = useVipStore((s) => s.mockUpgradeToVip);

  return {
    isVip,
    vipExpiresAt,
    loading,
    checkVipStatus: () => {
      if (!user) return Promise.resolve();
      return checkVipStatus(user.id);
    },
    mockUpgrade: () => {
      if (!user) return Promise.reject(new Error('Not authenticated'));
      return mockUpgradeToVip(user.id);
    },
  };
}
