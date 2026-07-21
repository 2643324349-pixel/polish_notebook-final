import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/t';

interface NotebookSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function NotebookSearch({ value, onChange }: NotebookSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('notebooks.searchPlaceholder')}
        className="h-11 rounded-full border-muted-foreground/20 pl-10"
      />
    </div>
  );
}
