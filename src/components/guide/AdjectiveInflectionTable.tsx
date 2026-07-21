import type { AdjectiveEntry } from '@/types/guide';
import { CASE_ORDER } from '@/types/guide';
import { useGuideContent } from '@/hooks/useGuideContent';
import { GenderFormsCell } from '@/components/guide/GenderFormsCell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdjectiveInflectionTableProps {
  entries: AdjectiveEntry[];
}

export function AdjectiveInflectionTable({
  entries,
}: AdjectiveInflectionTableProps) {
  const {
    translationHeader,
    singularCaseHeaders,
    pluralCaseHeaders,
    genderMfnLabel,
  } = useGuideContent();

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="sticky left-0 z-10 min-w-[72px] bg-muted/40">
              {translationHeader}
            </TableHead>
            {CASE_ORDER.map((caseKey) => (
              <TableHead key={`sg-${caseKey}`} className="min-w-[108px] text-xs">
                {singularCaseHeaders[caseKey]}
                <div className="font-normal text-muted-foreground">
                  {genderMfnLabel}
                </div>
              </TableHead>
            ))}
            {CASE_ORDER.map((caseKey) => (
              <TableHead key={`pl-${caseKey}`} className="min-w-[108px] text-xs">
                {pluralCaseHeaders[caseKey]}
                <div className="font-normal text-muted-foreground">
                  {genderMfnLabel}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.lemma}>
              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                {entry.translation}
              </TableCell>
              {CASE_ORDER.map((caseKey) => (
                <TableCell key={`sg-${caseKey}`}>
                  <GenderFormsCell forms={entry.singular[caseKey]} />
                </TableCell>
              ))}
              {CASE_ORDER.map((caseKey) => (
                <TableCell key={`pl-${caseKey}`}>
                  <GenderFormsCell forms={entry.plural[caseKey]} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
