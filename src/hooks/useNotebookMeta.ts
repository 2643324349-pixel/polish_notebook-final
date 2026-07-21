import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  applyNotebookOrder,
  getNotebookColors,
  getNotebookOrder,
  prependNotebookOrder,
  removeFromNotebookOrder,
  removeNotebookColor,
  setNotebookColor,
  setNotebookOrder,
  subscribeNotebookColors,
} from '@/lib/notebookMeta';
import { DEFAULT_NOTEBOOK_COLOR } from '@/lib/constants';
import type { Notebook } from '@/types';

type ColorMap = Record<string, string>;

const EMPTY_COLORS: ColorMap = {};

export function useNotebookMeta() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [colorMap, setColorMap] = useState<ColorMap>(EMPTY_COLORS);

  useEffect(() => {
    if (!userId) {
      setColorMap(EMPTY_COLORS);
      return;
    }

    setColorMap(getNotebookColors(userId));
    return subscribeNotebookColors(userId, () => {
      setColorMap(getNotebookColors(userId));
    });
  }, [userId]);

  const getColor = useCallback(
    (notebookId: string) => {
      return colorMap[notebookId] ?? DEFAULT_NOTEBOOK_COLOR;
    },
    [colorMap],
  );

  const saveColor = useCallback(
    (notebookId: string, color: string) => {
      if (!userId) return;
      setNotebookColor(notebookId, color, userId);
    },
    [userId],
  );

  const sortNotebooks = useCallback((notebooks: Notebook[]) => {
    return applyNotebookOrder(notebooks);
  }, []);

  const saveOrder = useCallback((orderedIds: string[]) => {
    setNotebookOrder(orderedIds);
  }, []);

  const onNotebookCreated = useCallback(
    (notebookId: string, color: string) => {
      if (!userId) return;
      setNotebookColor(notebookId, color, userId);
      prependNotebookOrder(notebookId);
    },
    [userId],
  );

  const onNotebookDeleted = useCallback(
    (notebookId: string) => {
      if (!userId) return;
      removeNotebookColor(notebookId, userId);
      removeFromNotebookOrder(notebookId);
    },
    [userId],
  );

  const currentOrder = useMemo(() => getNotebookOrder(), []);

  return {
    getColor,
    saveColor,
    sortNotebooks,
    saveOrder,
    onNotebookCreated,
    onNotebookDeleted,
    currentOrder,
  };
}
