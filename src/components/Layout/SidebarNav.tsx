import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Home,
  Loader2,
  LogIn,
  Plus,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useSheets } from '@/hooks/useSheets';
import { APP_NAME, BRAND_RED } from '@/lib/constants';
import { getNotebookColor } from '@/lib/notebookMeta';
import { AppLogo } from '@/components/shared/AppLogo';
import { createSheetWithDefaultRow } from '@/lib/api/sheets';
import { getSheetDisplayTitle } from '@/lib/sheet/sheetTitle';
import { supabase } from '@/lib/supabase/client';
import { useNotebookStore } from '@/store/notebookStore';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/uiStore';
import { UserAvatar } from '@/components/settings/UserAvatar';
import { SidebarLanguageSwitcher } from '@/components/Layout/SidebarLanguageSwitcher';
import { useVip } from '@/hooks/useVip';
import { useTranslation } from '@/lib/i18n/t';

interface SidebarNavProps {
  onNavigate?: () => void;
  className?: string;
  onNewNotebook?: () => void;
}

function NotebookTreeItem({
  notebookId,
  notebookName,
  userId,
  onNavigate,
  onNewPage,
}: {
  notebookId: string;
  notebookName: string;
  userId: string;
  onNavigate?: () => void;
  onNewPage: (notebookId: string) => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const color = getNotebookColor(notebookId, userId);
  const { expandedNotebookIds, toggleNotebookExpanded, setActiveNotebookId } =
    useUiStore();
  const { sheets, loading, loadSheets } = useSheets(notebookId);
  const isExpanded = expandedNotebookIds.includes(notebookId);

  useEffect(() => {
    if (isExpanded) {
      void loadSheets();
    }
  }, [isExpanded, loadSheets]);

  const activeSheetId = location.pathname.startsWith('/sheet/')
    ? location.pathname.split('/sheet/')[1]
    : null;

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => toggleNotebookExpanded(notebookId)}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-sidebar-accent"
          onClick={() => setActiveNotebookId(notebookId)}
        >
          {isExpanded ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="truncate text-left">{notebookName}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-5 space-y-0.5 border-l border-sidebar-border pl-3">
        {loading ? (
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            {t('common.loading')}
          </div>
        ) : (
          sheets.map((sheet) => (
            <Link
              key={sheet.id}
              to={`/sheet/${sheet.id}`}
              onClick={onNavigate}
              className={cn(
                'block truncate rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent',
                activeSheetId === sheet.id &&
                  'bg-sidebar-accent font-medium',
              )}
            >
              {getSheetDisplayTitle(sheet.title, t('sheet.untitledPage'))}
            </Link>
          ))
        )}
        <button
          type="button"
          onClick={() => onNewPage(notebookId)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        >
          <Plus className="size-3.5" />
          {t('notebooks.newPage')}
        </button>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SidebarNav({
  onNavigate,
  className,
  onNewNotebook,
}: SidebarNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { allNotebooks, loading, error, isAuthenticated, refresh } = useNotebooks();
  const { setActiveNotebookId, setMobileSidebarOpen, expandNotebook } =
    useUiStore();
  const { addSheet } = useNotebookStore();
  const [creatingPageFor, setCreatingPageFor] = useState<string | null>(null);

  const activeSheetId = location.pathname.startsWith('/sheet/')
    ? location.pathname.split('/sheet/')[1]
    : null;

  useEffect(() => {
    if (!activeSheetId || !user) return;

    void supabase
      .from('sheets')
      .select('notebook_id')
      .eq('id', activeSheetId)
      .single()
      .then(({ data }) => {
        if (data?.notebook_id) {
          expandNotebook(data.notebook_id);
        }
      });
  }, [activeSheetId, user, expandNotebook]);

  const handleNewPage = async (notebookId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      onNavigate?.();
      return;
    }

    setCreatingPageFor(notebookId);
    try {
      const sheet = await createSheetWithDefaultRow(notebookId);
      addSheet(notebookId, sheet);
      setActiveNotebookId(notebookId);
      expandNotebook(notebookId);
      navigate(`/sheet/${sheet.id}`);
      onNavigate?.();
      setMobileSidebarOpen(false);
    } catch (error) {
      console.error('Failed to create page:', error);
    } finally {
      setCreatingPageFor(null);
    }
  };

  const isNotebooksActive = location.pathname === '/notebooks';
  const isGuideActive = location.pathname === '/guide';
  const isTutorialActive = location.pathname === '/tutorial';
  const isSettingsActive = location.pathname.startsWith('/settings');
  const { isVip } = useVip();

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-4 py-5">
        <AppLogo size="md" />
        <Link
          to="/notebooks"
          onClick={onNavigate}
          className="text-base font-bold tracking-tight hover:opacity-80"
        >
          {APP_NAME}
        </Link>
      </div>

      <div className="space-y-1 px-3">
        <Link
          to="/notebooks"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isNotebooksActive
              ? 'bg-rose-50 text-rose-700'
              : 'hover:bg-sidebar-accent',
          )}
        >
          <Home
            className="size-4"
            style={isNotebooksActive ? { color: BRAND_RED } : undefined}
          />
          {t('layout.sidebar.notebookList')}
        </Link>
        <Link
          to="/guide"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isGuideActive
              ? 'bg-rose-50 text-rose-700'
              : 'hover:bg-sidebar-accent',
          )}
        >
          <BookOpen
            className="size-4"
            style={isGuideActive ? { color: BRAND_RED } : undefined}
          />
          {t('layout.sidebar.inflectionGuide')}
        </Link>
        <Link
          to="/tutorial"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isTutorialActive
              ? 'bg-rose-50 text-rose-700'
              : 'hover:bg-sidebar-accent',
          )}
        >
          <CircleHelp
            className="size-4"
            style={isTutorialActive ? { color: BRAND_RED } : undefined}
          />
          {t('layout.sidebar.tutorial')}
        </Link>
      </div>

      <Separator className="my-3 bg-sidebar-border" />

      <div className="flex items-center justify-between px-4 pb-2">
        <p className="text-sm font-semibold">{t('layout.sidebar.myNotebooks')}</p>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => {
            onNewNotebook?.();
            navigate('/notebooks');
            onNavigate?.();
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3">
        {!isAuthenticated ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            {t('layout.sidebar.loginToViewNotebooks')}
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : error ? (
          <div className="space-y-2 px-2 py-2">
            <p className="text-xs text-destructive">{t('layout.sidebar.loadFailed')}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : allNotebooks.length === 0 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            {t('layout.sidebar.noNotebooks')}
          </p>
        ) : (
          <div className="space-y-0.5">
            {allNotebooks.map((notebook) => (
              <NotebookTreeItem
                key={notebook.id}
                notebookId={notebook.id}
                notebookName={notebook.name}
                userId={user?.id ?? ''}
                onNavigate={onNavigate}
                onNewPage={(id) => void handleNewPage(id)}
              />
            ))}
            {creatingPageFor && (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                {t('layout.sidebar.creatingPage')}
              </p>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="shrink-0">
        <SidebarLanguageSwitcher />
      </div>

      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        {user ? (
          <button
            type="button"
            onClick={() => {
              navigate('/settings');
              onNavigate?.();
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-sidebar-accent',
              isSettingsActive && 'bg-sidebar-accent',
            )}
          >
            <UserAvatar email={user.email} size="sm" showVipBadge={isVip} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {isVip ? t('layout.sidebar.vipMember') : t('layout.sidebar.freeTier')}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ) : (
          <div className="space-y-2">
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link to="/login" onClick={onNavigate}>
                <LogIn className="size-4" />
                {t('auth.login')}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link to="/login?tab=register" onClick={onNavigate}>
                <UserPlus className="size-4" />
                {t('auth.register')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
