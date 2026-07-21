import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, Mail } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { AppLogo } from '@/components/shared/AppLogo';
import { APP_NAME, BRAND_RED, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/lib/constants';
import {
  createLoginSchema,
  createRegisterSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from '@/lib/schemas/auth';
import { useTranslation } from '@/lib/i18n/t';
import { isValidEmail } from '@/lib/validation/email';
import { cn } from '@/lib/utils';

function getSafeRedirect(searchParams: URLSearchParams): string {
  const redirect = searchParams.get('redirect');
  if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }
  return '/notebooks';
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const IconInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<'input'>, 'ref'> & {
    icon: typeof Mail;
    error?: string;
  }
>(function IconInput(
  {
    id,
    icon: Icon,
    type = 'text',
    placeholder,
    error,
    className,
    ...props
  },
  ref,
) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={ref}
          id={id}
          type={type}
          placeholder={placeholder}
          className={cn(
            'border-input flex h-11 w-full min-w-0 rounded-xl border bg-input-background px-3 py-1 pl-10 text-base outline-none transition-[color,box-shadow] md:text-sm',
            'placeholder:text-muted-foreground',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            error && 'border-destructive',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
});

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, isSubmitting, login, register, signInWithGoogle, resetPassword } =
    useAuth();

  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);

  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const tab = searchParams.get('tab') === 'register' ? 'register' : 'login';
    setActiveTab(tab);
  }, [searchParams]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '', confirmPassword: '', acceptedTerms: false },
  });

  const acceptedTerms = registerForm.watch('acceptedTerms');

  useEffect(() => {
    if (!loading && user) {
      navigate(getSafeRedirect(searchParams), { replace: true });
    }
  }, [user, loading, navigate, searchParams]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch {
      toast.error(t('auth.toast.googleLoginFailed'));
    }
  };

  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      if (rememberMe) {
        localStorage.setItem('remember-me', 'true');
      } else {
        localStorage.removeItem('remember-me');
      }
      toast.success(t('auth.toast.loginSuccess'));
      navigate(getSafeRedirect(searchParams));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('auth.toast.wrongCredentials'),
      );
    }
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      await register(values.email, values.password);
      toast.success(t('auth.toast.verifyEmailSent'));
      registerForm.reset();
      setActiveTab('login');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('auth.toast.registerFailed'),
      );
    }
  };

  const onRegisterInvalid = () => {
    if (!registerForm.getValues('acceptedTerms')) {
      toast.error(t('auth.errors.termsRequired'));
    }
  };

  const handleForgotPassword = async () => {
    const email = loginForm.getValues('email').trim();
    if (!email) {
      toast.error(t('auth.toast.enterEmailFirst'));
      return;
    }
    if (!isValidEmail(email)) {
      toast.error(t('auth.errors.emailInvalid'));
      return;
    }
    try {
      await resetPassword(email);
      toast.success(t('auth.toast.resetEmailSent'));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('auth.toast.resetEmailFailed'),
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Toaster position="top-center" richColors />

      <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg">
        <CardContent className="space-y-6 pt-8">
          <div className="flex items-center justify-center gap-2.5">
            <AppLogo size="lg" />
            <span className="text-lg font-bold">{APP_NAME}</span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="sr-only">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0 space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">{t('auth.welcomeBack')}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('auth.loginSubtitle')}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl"
                onClick={() => void handleGoogleLogin()}
                disabled={isSubmitting}
              >
                <GoogleIcon />
                {t('auth.signInWithGoogle')}
              </Button>

              <div className="relative flex items-center">
                <div className="flex-1 border-t" />
                <span className="px-3 text-xs text-muted-foreground">{t('common.or')}</span>
                <div className="flex-1 border-t" />
              </div>

              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="sr-only">
                    {t('auth.email')}
                  </Label>
                  <IconInput
                    id="login-email"
                    icon={Mail}
                    type="email"
                    placeholder={t('auth.email')}
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register('email')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="sr-only">
                    {t('auth.password')}
                  </Label>
                  <IconInput
                    id="login-password"
                    icon={Lock}
                    type="password"
                    placeholder={t('auth.password')}
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register('password')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked === true)
                      }
                    />
                    <Label
                      htmlFor="remember-me"
                      className="cursor-pointer text-sm font-normal text-muted-foreground"
                    >
                      {t('auth.rememberMe')}
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleForgotPassword()}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl text-white hover:opacity-90"
                  style={{ backgroundColor: BRAND_RED }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    t('auth.login')
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-medium hover:underline"
                  style={{ color: BRAND_RED }}
                >
                  {t('auth.signUpFree')}
                </button>
              </p>
            </TabsContent>

            <TabsContent value="register" className="mt-0 space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">{t('auth.createAccount')}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('auth.registerSubtitle')}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl"
                onClick={() => void handleGoogleLogin()}
                disabled={isSubmitting}
              >
                <GoogleIcon />
                {t('auth.signInWithGoogle')}
              </Button>

              <div className="relative flex items-center">
                <div className="flex-1 border-t" />
                <span className="px-3 text-xs text-muted-foreground">{t('common.or')}</span>
                <div className="flex-1 border-t" />
              </div>

              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit, onRegisterInvalid)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="sr-only">
                    {t('auth.email')}
                  </Label>
                  <IconInput
                    id="register-email"
                    icon={Mail}
                    type="email"
                    placeholder={t('auth.email')}
                    error={registerForm.formState.errors.email?.message}
                    {...registerForm.register('email')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="sr-only">
                    {t('auth.password')}
                  </Label>
                  <IconInput
                    id="register-password"
                    icon={Lock}
                    type="password"
                    placeholder={t('auth.password')}
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register('password')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm" className="sr-only">
                    {t('auth.confirmPassword')}
                  </Label>
                  <IconInput
                    id="register-confirm"
                    icon={Lock}
                    type="password"
                    placeholder={t('auth.confirmPassword')}
                    error={registerForm.formState.errors.confirmPassword?.message}
                    {...registerForm.register('confirmPassword')}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="register-terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) =>
                        registerForm.setValue('acceptedTerms', checked === true, {
                          shouldValidate: true,
                        })
                      }
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="register-terms"
                      className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground"
                    >
                      {t('auth.acceptedTermsPrefix')}{' '}
                      <a
                        href={TERMS_OF_SERVICE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                        style={{ color: BRAND_RED }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('auth.termsOfService')}
                      </a>
                      {' '}
                      {t('auth.and')}{' '}
                      <a
                        href={PRIVACY_POLICY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                        style={{ color: BRAND_RED }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('auth.privacyPolicy')}
                      </a>
                    </Label>
                  </div>
                  {registerForm.formState.errors.acceptedTerms && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.acceptedTerms.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl text-white hover:opacity-90"
                  style={{ backgroundColor: BRAND_RED }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    t('auth.register')
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.hasAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-medium hover:underline"
                  style={{ color: BRAND_RED }}
                >
                  {t('auth.goToLogin')}
                </button>
              </p>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            {t('auth.termsPrefix')}{' '}
            <a
              href={TERMS_OF_SERVICE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {t('auth.termsOfService')}
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
