import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import type { AmbiguityLevel, AnalyzeCandidate } from '@/lib/inflection/types';

const LEVEL_TITLE_KEYS: Record<AmbiguityLevel, string> = {
  none: 'sheet.ambiguity.selectMeaning',
  L1: 'sheet.ambiguity.selectMeaning',
  L2: 'sheet.ambiguity.selectParadigm',
  L3: 'sheet.ambiguity.selectPos',
};

const LEVEL_DESCRIPTION_KEYS: Record<AmbiguityLevel, string> = {
  none: 'sheet.ambiguity.meaningDescription',
  L1: 'sheet.ambiguity.meaningDescription',
  L2: 'sheet.ambiguity.paradigmDescription',
  L3: 'sheet.ambiguity.posDescription',
};

interface AmbiguityPickerDialogProps {
  open: boolean;
  level: AmbiguityLevel;
  word: string;
  candidates: AnalyzeCandidate[];
  onOpenChange: (open: boolean) => void;
  onSelect: (candidateId: string) => void | Promise<void>;
}

export function AmbiguityPickerDialog({
  open,
  level,
  word,
  candidates,
  onOpenChange,
  onSelect,
}: AmbiguityPickerDialogProps) {
  const { t } = useTranslation();
  const titleKey = LEVEL_TITLE_KEYS[level] ?? LEVEL_TITLE_KEYS.L2;
  const descriptionKey = LEVEL_DESCRIPTION_KEYS[level] ?? LEVEL_DESCRIPTION_KEYS.L2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>
            {t('sheet.ambiguity.wordPrefix', { word })}{' '}
            {t(descriptionKey)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[min(60vh,420px)]">
          <div className="flex flex-col gap-2 p-4">
            {candidates.map((candidate) => (
              <Button
                key={candidate.id}
                variant="outline"
                className={cn(
                  'h-auto min-h-11 justify-start whitespace-normal px-4 py-3 text-left',
                )}
                onClick={() => onSelect(candidate.id)}
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{candidate.label}</span>
                  {candidate.translations.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {candidate.translations.join(' / ')}
                    </span>
                  )}
                </span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
