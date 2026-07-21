import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  findSheetMatches,
  makeSearchMatchKey,
} from '@/lib/sheet/searchUtils';
import type { ColumnConfig, Row } from '@/types';

export function useSheetSearch(rows: Row[], columns: ColumnConfig[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(
    () => findSheetMatches(rows, columns, query),
    [rows, columns, query],
  );

  const matchKeys = useMemo(
    () =>
      new Set(
        matches.map((match) =>
          makeSearchMatchKey(match.rowId, match.columnId),
        ),
      ),
    [matches],
  );

  const activeMatch =
    activeIndex >= 0 && activeIndex < matches.length
      ? matches[activeIndex]
      : null;

  const activeKey = activeMatch
    ? makeSearchMatchKey(activeMatch.rowId, activeMatch.columnId)
    : null;

  useEffect(() => {
    setActiveIndex(matches.length > 0 ? 0 : -1);
  }, [matches]);

  const open = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(-1);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    setActiveIndex((index) => (index + 1) % matches.length);
  }, [matches.length]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    setActiveIndex(
      (index) => (index - 1 + matches.length) % matches.length,
    );
  }, [matches.length]);

  useEffect(() => {
    if (!isOpen || !activeKey) return;

    requestAnimationFrame(() => {
      document
        .querySelector('[data-search-active="true"]')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }, [isOpen, activeKey, activeIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault();
        open();
        return;
      }

      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, open, close]);

  return {
    isOpen,
    query,
    setQuery,
    matches,
    matchKeys,
    activeKey,
    activeIndex,
    inputRef,
    open,
    close,
    toggle,
    goNext,
    goPrev,
  };
}
