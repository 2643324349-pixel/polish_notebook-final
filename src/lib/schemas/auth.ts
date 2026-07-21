import type { TFunction } from 'i18next';
import { z } from 'zod';
import { isValidEmail } from '@/lib/validation/email';

function emailField(t: TFunction) {
  return z
    .string()
    .min(1, t('auth.errors.emailRequired'))
    .refine((value) => isValidEmail(value), {
      message: t('auth.errors.emailInvalid'),
    });
}

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: emailField(t),
    password: z
      .string()
      .min(1, t('auth.errors.passwordRequired'))
      .min(6, t('auth.errors.passwordMinLength')),
  });
}

export function createRegisterSchema(t: TFunction) {
  return z
    .object({
      email: emailField(t),
      password: z
        .string()
        .min(1, t('auth.errors.passwordRequired'))
        .min(6, t('auth.errors.passwordMinLength')),
      confirmPassword: z.string().min(1, t('auth.errors.confirmPasswordRequired')),
      acceptedTerms: z.boolean().refine((val) => val, {
        message: t('auth.errors.termsRequired'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.errors.passwordMismatch'),
      path: ['confirmPassword'],
    });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
