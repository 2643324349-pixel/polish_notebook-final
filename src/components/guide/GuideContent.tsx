import type {
  NumeralSubCategory,
  PosKey,
  PronounSubCategory,
} from '@/types/guide';
import { useGuideContent } from '@/hooks/useGuideContent';
import { AdjectiveInflectionTable } from '@/components/guide/AdjectiveInflectionTable';
import { InvariableWordList } from '@/components/guide/InvariableWordList';
import { NounInflectionTable } from '@/components/guide/NounInflectionTable';
import { NumeralInflectionTable } from '@/components/guide/NumeralInflectionTable';
import { PronounInflectionTable } from '@/components/guide/PronounInflectionTable';
import { SubCategoryTabs } from '@/components/guide/SubCategoryTabs';
import { VerbInflectionTable } from '@/components/guide/VerbInflectionTable';

interface GuideContentProps {
  pos: PosKey;
  pronounSub: PronounSubCategory;
  onPronounSubChange: (value: PronounSubCategory) => void;
  numeralSub: NumeralSubCategory;
  onNumeralSubChange: (value: NumeralSubCategory) => void;
}

export function GuideContent({
  pos,
  pronounSub,
  onPronounSubChange,
  numeralSub,
  onNumeralSubChange,
}: GuideContentProps) {
  const {
    posDescriptions,
    pronounSubOptions,
    numeralSubOptions,
    nounEntries,
    adjectiveEntries,
    personalPronounEntries,
    demonstrativePronounEntries,
    numeral234Entries,
    numeral5PlusEntries,
    ordinalNumeralEntries,
    verbEntry,
    adverbCategories,
    prepositionCategories,
    conjunctionCategories,
  } = useGuideContent();

  const description = posDescriptions[pos];

  return (
    <div className="space-y-4">
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}

      {pos === 'pronoun' ? (
        <SubCategoryTabs
          options={[...pronounSubOptions]}
          value={pronounSub}
          onChange={(value) =>
            onPronounSubChange(value as PronounSubCategory)
          }
        />
      ) : null}

      {pos === 'numeral' ? (
        <SubCategoryTabs
          options={[...numeralSubOptions]}
          value={numeralSub}
          onChange={(value) =>
            onNumeralSubChange(value as NumeralSubCategory)
          }
        />
      ) : null}

      {pos === 'noun' ? <NounInflectionTable entries={nounEntries} /> : null}
      {pos === 'adjective' ? (
        <AdjectiveInflectionTable entries={adjectiveEntries} />
      ) : null}
      {pos === 'pronoun' && pronounSub === 'personal' ? (
        <PronounInflectionTable entries={personalPronounEntries} />
      ) : null}
      {pos === 'pronoun' && pronounSub === 'demonstrative' ? (
        <PronounInflectionTable entries={demonstrativePronounEntries} />
      ) : null}
      {pos === 'numeral' && numeralSub === 'two_three_four' ? (
        <NumeralInflectionTable entries={numeral234Entries} />
      ) : null}
      {pos === 'numeral' && numeralSub === 'five_plus' ? (
        <NumeralInflectionTable entries={numeral5PlusEntries} />
      ) : null}
      {pos === 'numeral' && numeralSub === 'ordinal' ? (
        <NumeralInflectionTable entries={ordinalNumeralEntries} />
      ) : null}
      {pos === 'verb' ? <VerbInflectionTable entry={verbEntry} /> : null}
      {pos === 'adverb' ? (
        <InvariableWordList categories={adverbCategories} />
      ) : null}
      {pos === 'preposition' ? (
        <InvariableWordList categories={prepositionCategories} />
      ) : null}
      {pos === 'conjunction' ? (
        <InvariableWordList categories={conjunctionCategories} />
      ) : null}
    </div>
  );
}
