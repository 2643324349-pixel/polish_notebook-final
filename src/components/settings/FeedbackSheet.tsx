import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  submitFeedback,
  validateFeedbackFiles,
  type FeedbackType,
} from '@/lib/settings/feedbackUtils';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';

const FEEDBACK_TYPES: FeedbackType[] = ['bug', 'rule', 'ux', 'other'];

interface FeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackSheet({ open, onOpenChange }: FeedbackSheetProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<FeedbackType>('bug');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (trimmed.length < 10) {
      toast.error(t('settings.feedbackForm.errors.descriptionMin'));
      return;
    }
    if (trimmed.length > 500) {
      toast.error(t('settings.feedbackForm.errors.descriptionMax'));
      return;
    }
    const fileError = validateFeedbackFiles(files, t);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({ type, description: trimmed, files });
      toast.success(t('settings.feedbackForm.success'));
      setDescription('');
      setFiles([]);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t('settings.feedbackForm.title')}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.feedbackForm.issueType')}</Label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_TYPES.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    type === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-muted',
                  )}
                >
                  {t(`settings.feedbackForm.types.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-desc">
              {t('settings.feedbackForm.descriptionLabel')}
            </Label>
            <Textarea
              id="feedback-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('settings.feedbackForm.descriptionPlaceholder')}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-files">
              {t('settings.feedbackForm.screenshotsLabel')}
            </Label>
            <input
              id="feedback-files"
              type="file"
              accept="image/*"
              multiple
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))}
            />
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('settings.feedbackForm.screenshotsSelected', {
                  count: files.length,
                })}
              </p>
            )}
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting
              ? t('common.submitting')
              : t('settings.feedbackForm.submit')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
