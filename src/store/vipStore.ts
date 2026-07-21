import { create } from 'zustand';
import { ensureProfile, upgradeToVip } from '@/lib/api/profiles';
import type { Profile } from '@/types';

interface VipState {
  isVip: boolean;
  vipExpiresAt: string | null;
  loading: boolean;
  checked: boolean;
  checkVipStatus: (userId: string) => Promise<void>;
  mockUpgradeToVip: (userId: string) => Promise<void>;
  reset: () => void;
}

function resolveIsVip(profile: Pick<Profile, 'is_vip' | 'vip_expires_at'>): boolean {
  if (!profile.is_vip) return false;
  if (!profile.vip_expires_at) return true;
  return new Date(profile.vip_expires_at) > new Date();
}

function applyProfile(profile: Profile) {
  return {
    isVip: resolveIsVip(profile),
    vipExpiresAt: profile.vip_expires_at,
    checked: true,
  };
}

export const useVipStore = create<VipState>((set) => ({
  isVip: false,
  vipExpiresAt: null,
  loading: false,
  checked: false,

  checkVipStatus: async (userId) => {
    set({ loading: true });
    try {
      const profile = await ensureProfile(userId);
      set(applyProfile(profile));
    } catch (error) {
      console.error('Failed to check VIP status:', error);
      set({ isVip: false, vipExpiresAt: null, checked: true });
    } finally {
      set({ loading: false });
    }
  },

  mockUpgradeToVip: async (userId) => {
    const profile = await upgradeToVip(userId);
    set(applyProfile(profile));
  },

  reset: () =>
    set({
      isVip: false,
      vipExpiresAt: null,
      loading: false,
      checked: false,
    }),
}));
