import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  FileText,
  Globe,
  Info,
  Languages,
  LogOut,
  MessageSquare,
  Shield,
  Sun,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';
import { ClearCacheDialog } from '@/components/settings/ClearCacheDialog';
import { FeedbackSheet } from '@/components/settings/FeedbackSheet';
import { LanguagePickerSheet } from '@/components/settings/LanguagePickerSheet';
import { SettingsAccountCard } from '@/components/settings/SettingsAccountCard';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { ThemePickerSheet } from '@/components/settings/ThemePickerSheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  APP_VERSION,
  CONTACT_EMAIL,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '@/lib/constants';
import { estimateCacheSizeMb } from '@/lib/settings/cacheUtils';
import { signOut } from '@/lib/api/auth';
import { useTranslation } from '@/lib/i18n/t';
import { useSettingsStore } from '@/store/settingsStore';

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, deleteAccount } = useAuth();
  const getLangLabel = useSettingsStore((s) => s.getLangLabel);
  const getThemeLabel = useSettingsStore((s) => s.getThemeLabel);

  const [cacheSize, setCacheSize] = useState('—');
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [cacheOpen, setCacheOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    void estimateCacheSizeMb().then((mb) =>
      setCacheSize(t('common.cacheSizeMb', { size: mb })),
    );
  }, [t]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?redirect=/settings" replace />;
  }

  const handleLogout = async () => {
    await signOut();
    toast.success(t('settings.toast.loggedOut'));
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast.success(t('settings.toast.deleteAccountSuccess'));
      navigate('/login');
    } catch (err) {
      toast.error(t('settings.toast.deleteAccountFailed'), {
        description: err instanceof Error ? err.message : undefined,
      });
      throw err;
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/notebooks" aria-label={t('common.back')}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">{t('settings.title')}</h1>
      </div>

      <SettingsAccountCard email={user.email ?? ''} />

      <SettingsSection title={t('settings.sections.dataManagement')}>
        <SettingsRow
          icon={Database}
          label={t('settings.clearCache')}
          value={cacheSize}
          onClick={() => setCacheOpen(true)}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.sections.legal')}>
        <SettingsRow
          icon={FileText}
          label={t('settings.termsOfService')}
          onClick={() =>
            window.open(TERMS_OF_SERVICE_URL, '_blank', 'noopener,noreferrer')
          }
        />
        <SettingsRow
          icon={Shield}
          label={t('settings.privacyPolicy')}
          onClick={() =>
            window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')
          }
        />
      </SettingsSection>

      <SettingsSection title={t('settings.sections.preferences')}>
        <SettingsRow
          icon={Languages}
          label={t('settings.changeLanguage')}
          value={getLangLabel()}
          onClick={() => setLangOpen(true)}
        />
        <SettingsRow
          icon={Sun}
          label={t('settings.themeMode')}
          value={getThemeLabel()}
          onClick={() => setThemeOpen(true)}
          showChevron
        />
      </SettingsSection>

      <SettingsSection title={t('settings.sections.helpFeedback')}>
        <SettingsRow
          icon={MessageSquare}
          label={t('settings.feedback')}
          onClick={() => setFeedbackOpen(true)}
        />
        <SettingsRow
          icon={Info}
          label={t('settings.aboutUs')}
          value={t('common.versionShort', { version: APP_VERSION })}
          onClick={() => {
            toast.info(t('settings.toast.aboutDescription'), {
              description: t('common.versionFull', { version: APP_VERSION }),
            });
          }}
        />
        <SettingsRow
          icon={Globe}
          label={t('settings.contactEmail')}
          value={CONTACT_EMAIL}
          onClick={() => {
            window.location.href = `mailto:${CONTACT_EMAIL}`;
          }}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.sections.dangerZone')}>
        <div className="p-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-start gap-3 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-5" />
            {t('settings.deleteAccount')}
          </Button>
        </div>
      </SettingsSection>

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full justify-start gap-3 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut className="size-5" />
          {t('auth.logout')}
        </Button>
      </div>

      <LanguagePickerSheet open={langOpen} onOpenChange={setLangOpen} />
      <ThemePickerSheet open={themeOpen} onOpenChange={setThemeOpen} />
      <FeedbackSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <ClearCacheDialog
        open={cacheOpen}
        onOpenChange={setCacheOpen}
        onSizeUpdate={setCacheSize}
      />

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title={t('settings.logoutTitle')}
        description={t('settings.logoutDescription')}
        confirmLabel={t('settings.logoutConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleLogout}
      />

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
