import { supabase } from '@/lib/supabase';

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
  });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/notebooks`,
    },
  });
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email.trim());
}

export async function signOut() {
  return supabase.auth.signOut();
}
