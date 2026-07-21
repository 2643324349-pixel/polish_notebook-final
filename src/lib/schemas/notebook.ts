import type { TFunction } from 'i18next';
import { z } from 'zod';

export const NOTEBOOK_DUPLICATE_NAME = 'NOTEBOOK_DUPLICATE_NAME';

export function createNotebookNameSchema(t: TFunction) {
  return z.string().trim().min(1, t('notebooks.errors.nameRequired'));
}

export function checkDuplicateName(
  name: string,
  notebooks: { id: string; name: string }[],
  excludeId?: string,
): boolean {
  const normalized = name.trim().toLowerCase();
  return notebooks.some(
    (n) =>
      n.id !== excludeId && n.name.trim().toLowerCase() === normalized,
  );
}

export function isDuplicateNameError(error: unknown): boolean {
  return error instanceof Error && error.message === NOTEBOOK_DUPLICATE_NAME;
}
