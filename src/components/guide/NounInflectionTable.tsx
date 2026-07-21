import type { NounEntry } from '@/types/guide';
import { CASE_ORDER } from '@/types/guide';
import { useGuideContent } from '@/hooks/useGuideContent';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface NounInflectionTableProps {
  entries: NounEntry[];
}

export function NounInflectionTable({ entries }: NounInflectionTableProps) {
  const { translationHeader, singularCaseHeaders, pluralCaseHeaders } =
    useGuideContent();

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="sticky left-0 z-10 min-w-[88px] bg-muted/40">
              {translationHeader}
            </TableHead>
            {CASE_ORDER.map((caseKey) => (
              <TableHead key={`sg-${caseKey}`} className="min-w-[100px] text-xs">
                {singularCaseHeaders[caseKey]}
              </TableHead>
            ))}
            {CASE_ORDER.map((caseKey) => (
              <TableHead key={`pl-${caseKey}`} className="min-w-[100px] text-xs">
                {pluralCaseHeaders[caseKey]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.lemma}>
              <TableCell className="sticky left-0 z-10 bg-background">
                <div className="font-medium">{entry.translation}</div>
                <div className="text-xs text-muted-foreground">{entry.label}</div>
              </TableCell>
              {CASE_ORDER.map((caseKey) => (
                <TableCell key={`sg-${caseKey}`} className="font-mono text-xs">
                  {entry.singular[caseKey]}
                </TableCell>
              ))}
              {CASE_ORDER.map((caseKey) => (
                <TableCell key={`pl-${caseKey}`} className="font-mono text-xs">
                  {entry.plural[caseKey]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
