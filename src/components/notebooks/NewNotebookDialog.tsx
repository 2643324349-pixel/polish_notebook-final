import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DEFAULT_NOTEBOOK_COLOR,
  NOTEBOOK_COLORS,
} from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';

interface NewNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, color: string) => Promise<void>;
  existingNames: string[];
}

export function NewNotebookDialog({
  open,
  onOpenChange,
  onSubmit,
  existingNames,
}: NewNotebookDialogProps) {
  const { t } = useTranslation();
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_NOTEBOOK_COLOR);
  const [duplicateError, setDuplicateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('notebooks.errors.nameRequired')),
      }),
    [t],
  );

  type FormValues = z.infer<typeof formSchema>;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const nameValue = watch('name');

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      setDuplicateError('');
      setSelectedColor(DEFAULT_NOTEBOOK_COLOR);
    }
    onOpenChange(nextOpen);
  };

  const onFormSubmit = async (values: FormValues) => {
    const trimmed = values.name.trim();
    const isDuplicate = existingNames.some(
      (n) => n.trim().toLowerCase() === trimmed.toLowerCase(),
    );

    if (isDuplicate) {
      setDuplicateError(t('notebooks.errors.duplicateName'));
      return;
    }

    setDuplicateError('');
    setSubmitting(true);
    try {
      await onSubmit(trimmed, selectedColor);
      handleClose(false);
    } catch (error) {
      if (error instanceof Error && error.message === t('notebooks.errors.duplicateName')) {
        setDuplicateError(t('notebooks.errors.duplicateName'));
      } else {
        toast.error(t('notebooks.toast.createFailedNetwork'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t('notebooks.newNotebook')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="notebook-name">{t('notebooks.notebookName')}</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  id="notebook-name"
                  placeholder={t('notebooks.namePlaceholder')}
                  className="rounded-xl"
                  {...field}
                />
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
            {duplicateError && (
              <p className="text-sm text-destructive">{duplicateError}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>{t('notebooks.color')}</Label>
            <div className="flex flex-wrap gap-3">
              {NOTEBOOK_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    'size-8 rounded-full transition-transform hover:scale-105',
                    selectedColor === color.value &&
                      'ring-2 ring-offset-2',
                  )}
                  style={{
                    backgroundColor: color.value,
                    ...(selectedColor === color.value
                      ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${color.value}` }
                      : {}),
                  }}
                  aria-label={color.label}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!nameValue?.trim() || submitting}
            className="h-11 w-full rounded-2xl bg-rose-400 text-white hover:bg-rose-500 disabled:opacity-50"
          >
            {submitting ? t('notebooks.creating') : t('notebooks.create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
