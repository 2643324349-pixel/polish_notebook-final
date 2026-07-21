import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/t';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteAccountDialogProps) {
  const { t } = useTranslation();
  const confirmWord = t('settings.deleteAccountConfirmWord');
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canConfirm = typed.trim() === confirmWord && !deleting;

  const handleOpenChange = (nextOpen: boolean) => {
    if (deleting) return;
    if (!nextOpen) setTyped('');
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setDeleting(true);
    try {
      await onConfirm();
      setTyped('');
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('settings.deleteAccountTitle')}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">{t('settings.deleteAccountDescription')}</span>
            <span className="block text-foreground">
              {t('settings.deleteAccountTypePrompt', { word: confirmWord })}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={confirmWord}
          disabled={deleting}
          autoComplete="off"
          spellCheck={false}
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirm}
            onClick={() => void handleConfirm()}
          >
            {deleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('settings.deleteAccountDeleting')}
              </>
            ) : (
              t('settings.deleteAccountConfirm')
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
