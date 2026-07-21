import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { fillRowPipeline } from '@/lib/inflection/fillPipeline';
import { mockAnalyze } from '@/lib/inflection/mockEngine';
import { analyzeWord } from '@/lib/inflection/morfeuszClient';
import { t } from '@/lib/i18n/t';
import { useSettingsStore } from '@/store/settingsStore';
import type { FillRowOutcome, MockResult } from '@/lib/inflection/types';
import type { ColumnConfig } from '@/types';

const SLOW_HINT_MS = 1000;
const SLOW_TOAST_MS = 3000;

export function getFillMessages() {
  return {
    notFound: t('sheet.toast.wordNotFound'),
    serviceUnavailable: t('sheet.toast.serviceUnavailable'),
    timeout: t('sheet.toast.timeout'),
    slow: t('sheet.toast.slow'),
  } as const;
}

export function useInflection() {
  const uiLang = useSettingsStore((s) => s.uiLang);
  const [generating, setGenerating] = useState(false);
  const [slowPulse, setSlowPulse] = useState(false);
  const slowToastShownRef = useRef(false);

  const fillRow = useCallback(
    async (
      sourceWord: string,
      columns: ColumnConfig[],
      options?: { selectedCandidateId?: string },
    ): Promise<FillRowOutcome> => {
      setGenerating(true);
      setSlowPulse(false);
      slowToastShownRef.current = false;

      const slowHintTimer = setTimeout(() => {
        setSlowPulse(true);
      }, SLOW_HINT_MS);

      const slowToastTimer = setTimeout(() => {
        if (!slowToastShownRef.current) {
          slowToastShownRef.current = true;
          toast.info(getFillMessages().slow);
        }
      }, SLOW_TOAST_MS);

      try {
        return await fillRowPipeline(sourceWord, columns, {
          ...options,
          uiLang,
        });
      } finally {
        clearTimeout(slowHintTimer);
        clearTimeout(slowToastTimer);
        setGenerating(false);
        setSlowPulse(false);
      }
    },
    [uiLang],
  );

  const generate = useCallback(async (word: string): Promise<MockResult> => {
    const messages = getFillMessages();
    const outcome = await analyzeWord(word, { lang: uiLang });
    if (outcome.error === 'timeout') {
      throw new Error(messages.timeout);
    }
    const result = outcome.result ?? mockAnalyze(word);
    if (!result) {
      throw new Error(messages.notFound);
    }
    return result;
  }, [uiLang]);

  const messages = getFillMessages();

  return {
    fillRow,
    generate,
    generating,
    slowPulse,
    notFoundMessage: messages.notFound,
    fillMessages: messages,
  };
}
