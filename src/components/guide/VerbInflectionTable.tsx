import type { VerbEntry } from '@/types/guide';
import { useGuideContent } from '@/hooks/useGuideContent';
import { PastTenseCell } from '@/components/guide/GenderFormsCell';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VerbInflectionTableProps {
  entry: VerbEntry;
}

export function VerbInflectionTable({ entry }: VerbInflectionTableProps) {
  const { personHeader, presentHeader, pastHeader } = useGuideContent();
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
        {t('guide.verbExampleBadge', {
          lemma: entry.lemma,
          translation: entry.translation,
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[120px]">{personHeader}</TableHead>
              <TableHead className="min-w-[100px]">{presentHeader}</TableHead>
              <TableHead className="min-w-[180px]">{pastHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entry.rows.map((row) => (
              <TableRow key={row.person}>
                <TableCell className="font-medium">{row.person}</TableCell>
                <TableCell className="font-mono text-sm">{row.present}</TableCell>
                <TableCell>
                  <PastTenseCell forms={row.past} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
