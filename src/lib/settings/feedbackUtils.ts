export type FeedbackType = 'bug' | 'rule' | 'ux' | 'other';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 3;

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function validateFeedbackFiles(
  files: File[],
  t: TranslateFn,
): string | null {
  if (files.length > MAX_FILES) {
    return t('settings.feedbackForm.errors.maxFiles', { max: MAX_FILES });
  }
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return t('settings.feedbackForm.errors.imagesOnly');
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('settings.feedbackForm.errors.fileTooLarge');
    }
  }
  return null;
}

export async function submitFeedback(_payload: {
  type: FeedbackType;
  description: string;
  files: File[];
}): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));
}
