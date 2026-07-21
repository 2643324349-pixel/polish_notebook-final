import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

/** Returns existing profile or creates one for legacy users. */
export async function ensureProfile(userId: string): Promise<Profile> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function upgradeToVip(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_vip: true,
      vip_expires_at: null,
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
