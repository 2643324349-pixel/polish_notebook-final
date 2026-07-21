import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/t';

interface SheetSearchProps {
  open: boolean;
  query: string;
  matchCount: number;
  inputRef: React.RefObject<HTMLInputElement>;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function SheetSearch({
  open,
  query,
  matchCount,
  inputRef,
  onQueryChange,
  onClose,
  onNext,
  onPrevious,
}: SheetSearchProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const countLabel =
    matchCount > 0
      ? t('sheet.search.matchCount', { count: matchCount })
      : query.trim()
        ? t('sheet.search.noMatches')
        : t('sheet.search.matchCount', { count: 0 });

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('sheet.search.placeholder')}
          className="h-9 pl-9"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && event.shiftKey) {
              event.preventDefault();
              onPrevious();
              return;
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              onNext();
            }
          }}
        />
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={t('sheet.search.previous')}
          onClick={onPrevious}
          disabled={matchCount === 0}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={t('sheet.search.next')}
          onClick={onNext}
          disabled={matchCount === 0}
        >
          <ChevronDown className="size-4" />
        </Button>
      </div>

      <span className="min-w-[8rem] text-sm text-muted-foreground">
        {countLabel}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        aria-label={t('sheet.search.close')}
        onClick={onClose}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
