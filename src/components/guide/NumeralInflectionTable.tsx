import type { NumeralEntry } from '@/types/guide';
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

interface NumeralInflectionTableProps {
  entries: NumeralEntry[];
}

export function NumeralInflectionTable({
  entries,
}: NumeralInflectionTableProps) {
  const {
    translationHeader,
    singularCaseHeaders,
    pluralCaseHeaders,
    genderMfnLabel,
  } = useGuideContent();

  const hasGender = entries.some((entry) => entry.hasGender);

  if (!hasGender) {
    return (
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="sticky left-0 z-10 min-w-[72px] bg-muted/40">
                {translationHeader}
              </TableHead>
              {CASE_ORDER.map((caseKey) => (
                <TableHead key={caseKey} className="min-w-[100px] text-xs">
                  {singularCaseHeaders[caseKey]}
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
                  <TableCell key={caseKey} className="font-mono text-xs">
                    {entry.forms?.[caseKey] ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

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
                  {entry.singular ? (
                    <GenderFormsCell forms={entry.singular[caseKey]} />
                  ) : (
                    '—'
                  )}
                </TableCell>
              ))}
              {CASE_ORDER.map((caseKey) => (
                <TableCell key={`pl-${caseKey}`}>
                  {entry.plural ? (
                    <GenderFormsCell forms={entry.plural[caseKey]} />
                  ) : (
                    '—'
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
