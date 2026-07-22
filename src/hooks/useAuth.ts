import { useCallback, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import * as authApi from '@/lib/api/auth';
import { deleteAccountApi } from '@/lib/api/account';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { t } from '@/lib/i18n/t';
import { supabase } from '@/lib/supabase';
import { isValidEmail } from '@/lib/validation/email';
import { useAuthStore } from '@/store/authStore';
import { useVipStore } from '@/store/vipStore';

export function useAuth() {
  const {
    user,
    loading,
    isSubmitting,
    error,
    setUser,
    setLoading,
    setIsSubmitting,
    setError,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        void useVipStore.getState().checkVipStatus(session.user.id);
      } else {
        useVipStore.getState().reset();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        void useVipStore.getState().checkVipStatus(session.user.id);
      } else {
        useVipStore.getState().reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!isValidEmail(email)) {
        throw new Error(t('auth.errors.emailInvalid'));
      }

      setIsSubmitting(true);
      clearError();
      try {
        const { data, error: authError } = await authApi.signInWithEmail(
          email,
          password,
        );
        if (authError) throw authError;
        setUser(data.user);
        void useVipStore.getState().checkVipStatus(data.user.id);
        return data.user;
      } catch (err) {
        const message = getAuthErrorMessage(err, t);
        setError(message);
        throw new Error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [setUser, setIsSubmitting, setError, clearError],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      if (!isValidEmail(email)) {
        throw new Error(t('auth.errors.emailInvalid'));
      }

      setIsSubmitting(true);
      clearError();
      try {
        const { error: authError } = await authApi.signUpWithEmail(
          email,
          password,
        );
        if (authError) throw authError;

        // Email confirmation is handled by Supabase; clear any auto session.
        await authApi.signOut();
        setUser(null);
      } catch (err) {
        const message = getAuthErrorMessage(err, t);
        setError(message);
        throw new Error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [setUser, setIsSubmitting, setError, clearError],
  );

  const signInWithGoogle = useCallback(async (redirectPath?: string) => {
    setIsSubmitting(true);
    clearError();
    try {
      const { error: authError } = await authApi.signInWithGoogle(redirectPath);
      if (authError) throw authError;
    } catch (err) {
      const message = getAuthErrorMessage(err, t);
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [setIsSubmitting, setError, clearError]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (!isValidEmail(email)) {
        throw new Error(t('auth.errors.emailInvalid'));
      }

      clearError();
      const { error: authError } = await authApi.resetPassword(email);
      if (authError) {
        const message = getAuthErrorMessage(authError, t);
        throw new Error(message);
      }
    },
    [clearError],
  );

  const logout = useCallback(async () => {
    await authApi.signOut();
    setUser(null);
    useVipStore.getState().reset();
  }, [setUser]);

  const deleteAccount = useCallback(async () => {
    if (!user) {
      throw new Error(t('auth.errors.notAuthenticated'));
    }

    setIsSubmitting(true);
    clearError();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(t('auth.errors.sessionExpired'));
      }

      await deleteAccountApi(user.id, session.access_token);
      await authApi.signOut();
      setUser(null);
      useVipStore.getState().reset();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('settings.toast.deleteAccountFailed');
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, setUser, setIsSubmitting, setError, clearError]);

  return {
    user,
    loading,
    isSubmitting,
    error,
    login,
    register,
    signInWithGoogle,
    resetPassword,
    logout,
    deleteAccount,
    clearError,
  };
}

export type { User };
