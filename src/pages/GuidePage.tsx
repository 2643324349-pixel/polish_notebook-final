import { useState } from 'react';
import type {
  CaseKey,
  NumeralSubCategory,
  PosKey,
  PronounSubCategory,
} from '@/types/guide';
import { CaseDescriptionCard } from '@/components/guide/CaseDescriptionCard';
import { CasePillSelector } from '@/components/guide/CasePillSelector';
import { GuideContent } from '@/components/guide/GuideContent';
import { PosTabs } from '@/components/guide/PosTabs';
import { useGuideContent } from '@/hooks/useGuideContent';

export function GuidePage() {
  const { title, subtitle } = useGuideContent();
  const [selectedCase, setSelectedCase] = useState<CaseKey>('nom');
  const [pos, setPos] = useState<PosKey>('noun');
  const [pronounSub, setPronounSub] = useState<PronounSubCategory>('personal');
  const [numeralSub, setNumeralSub] = useState<NumeralSubCategory>(
    'two_three_four',
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <CasePillSelector
        selected={selectedCase}
        onSelect={setSelectedCase}
      />

      <CaseDescriptionCard caseKey={selectedCase} />

      <PosTabs value={pos} onChange={setPos} />

      <GuideContent
        pos={pos}
        pronounSub={pronounSub}
        onPronounSubChange={setPronounSub}
        numeralSub={numeralSub}
        onNumeralSubChange={setNumeralSub}
      />
    </div>
  );
}
