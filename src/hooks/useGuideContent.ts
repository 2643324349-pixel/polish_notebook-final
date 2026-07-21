import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ADJECTIVE_STRUCTURES,
  ADVERB_CATEGORY_STRUCTURES,
  CASE_STRUCTURE,
  CONJUNCTION_CATEGORY_STRUCTURES,
  DEMONSTRATIVE_PRONOUN_STRUCTURES,
  NUMERAL_234_STRUCTURES,
  NUMERAL_5PLUS_STRUCTURES,
  ORDINAL_NUMERAL_STRUCTURES,
  PERSONAL_PRONOUN_STRUCTURES,
  POS_DESCRIPTION_IDS,
  PREPOSITION_CATEGORY_STRUCTURES,
  VERB_ROBIC_STRUCTURE,
  NOUN_STRUCTURES,
} from '@/data/guideContent';
import type {
  AdjectiveEntry,
  CaseInfo,
  CaseKey,
  InvariableCategory,
  InvariableCategoryStructure,
  NounEntry,
  NumeralEntry,
  PosKey,
  PronounEntry,
  VerbEntry,
} from '@/types/guide';
import { CASE_ORDER, POS_ORDER } from '@/types/guide';

function buildInvariableCategories(
  structures: InvariableCategoryStructure[],
  t: (key: string) => string,
): InvariableCategory[] {
  return structures.map((category) => {
    const baseKey = `guide.entries.invariable.${category.group}.${category.categoryId}`;
    const descriptionKey = `${baseKey}.description`;
    const description = t(descriptionKey);
    return {
      title: t(`${baseKey}.title`),
      ...(description !== descriptionKey ? { description } : {}),
      items: category.items.map((item) => ({
        polish: item.polish,
        translation: t(`${baseKey}.items.${item.id}`),
      })),
    };
  });
}

export function useGuideContent() {
  const { t, i18n } = useTranslation();

  return useMemo(() => {
    const caseInfo = Object.fromEntries(
      CASE_ORDER.map((key) => {
        const structure = CASE_STRUCTURE[key];
        return [
          key,
          {
            ...structure,
            name: t(`guide.cases.${key}.name`),
            description: t(`guide.cases.${key}.description`),
            exampleTranslation: t(`guide.cases.${key}.exampleTranslation`),
          } satisfies CaseInfo,
        ];
      }),
    ) as Record<CaseKey, CaseInfo>;

    const nounEntries: NounEntry[] = NOUN_STRUCTURES.map((entry) => ({
      lemma: entry.lemma,
      singular: entry.singular,
      plural: entry.plural,
      translation: t(`guide.entries.nouns.${entry.id}.translation`),
      label: t(`guide.entries.nouns.${entry.id}.label`),
    }));

    const adjectiveEntries: AdjectiveEntry[] = ADJECTIVE_STRUCTURES.map(
      (entry) => ({
        lemma: entry.lemma,
        singular: entry.singular,
        plural: entry.plural,
        translation: t(`guide.entries.adjectives.${entry.id}.translation`),
      }),
    );

    const buildPronounEntries = (
      structures: typeof PERSONAL_PRONOUN_STRUCTURES,
      subKey: 'personal' | 'demonstrative',
    ): PronounEntry[] =>
      structures.map((entry) => ({
        lemma: entry.lemma,
        singular: entry.singular,
        plural: entry.plural,
        translation: t(
          `guide.entries.pronouns.${subKey}.${entry.id}.translation`,
        ),
      }));

    const demonstrativePronounEntries = buildPronounEntries(
      DEMONSTRATIVE_PRONOUN_STRUCTURES,
      'demonstrative',
    );

    const personalPronounEntries = buildPronounEntries(
      PERSONAL_PRONOUN_STRUCTURES,
      'personal',
    );

    const buildNumeralEntries = (
      structures: typeof NUMERAL_234_STRUCTURES,
      subKey: '234' | 'fivePlus' | 'ordinal',
    ): NumeralEntry[] =>
      structures.map((entry) => ({
        lemma: entry.lemma,
        hasGender: entry.hasGender,
        singular: entry.singular,
        plural: entry.plural,
        forms: entry.forms,
        translation: t(
          `guide.entries.numerals.${subKey}.${entry.id}.translation`,
        ),
      }));

    const numeral234Entries = buildNumeralEntries(NUMERAL_234_STRUCTURES, '234');
    const numeral5PlusEntries = buildNumeralEntries(
      NUMERAL_5PLUS_STRUCTURES,
      'fivePlus',
    );
    const ordinalNumeralEntries = buildNumeralEntries(
      ORDINAL_NUMERAL_STRUCTURES,
      'ordinal',
    );

    const verbEntry: VerbEntry = {
      lemma: VERB_ROBIC_STRUCTURE.lemma,
      translation: t(
        `guide.entries.verbs.${VERB_ROBIC_STRUCTURE.id}.translation`,
      ),
      rows: VERB_ROBIC_STRUCTURE.rows.map((row) => ({
        present: row.present,
        past: row.past,
        person: t(
          `guide.entries.verbs.${VERB_ROBIC_STRUCTURE.id}.persons.${row.personId}`,
        ),
      })),
    };

    const adverbCategories = buildInvariableCategories(
      ADVERB_CATEGORY_STRUCTURES,
      t,
    );
    const prepositionCategories = buildInvariableCategories(
      PREPOSITION_CATEGORY_STRUCTURES,
      t,
    );
    const conjunctionCategories = buildInvariableCategories(
      CONJUNCTION_CATEGORY_STRUCTURES,
      t,
    );

    const posDescriptions = Object.fromEntries(
      (Object.keys(POS_DESCRIPTION_IDS) as PosKey[]).map((key) => [
        key,
        t(`guide.posDescriptions.${key}`),
      ]),
    ) as Partial<Record<PosKey, string>>;

    const singularCaseHeaders = Object.fromEntries(
      CASE_ORDER.map((key) => [
        key,
        t(`guide.caseHeaders.singular.${key}`),
      ]),
    ) as Record<CaseKey, string>;

    const pluralCaseHeaders = Object.fromEntries(
      CASE_ORDER.map((key) => [key, t(`guide.caseHeaders.plural.${key}`)]),
    ) as Record<CaseKey, string>;

    const posTabs = POS_ORDER.map((key) => ({
      key,
      label: t(`guide.posTabs.${key}`),
    }));

    const pronounSubOptions = [
      { value: 'personal', label: t('guide.pronounSub.personal') },
      { value: 'demonstrative', label: t('guide.pronounSub.demonstrative') },
    ] as const;

    const numeralSubOptions = [
      { value: 'two_three_four', label: t('guide.numeralSub.two_three_four') },
      { value: 'five_plus', label: t('guide.numeralSub.five_plus') },
      { value: 'ordinal', label: t('guide.numeralSub.ordinal') },
    ] as const;

    return {
      caseInfo,
      nounEntries,
      adjectiveEntries,
      demonstrativePronounEntries,
      personalPronounEntries,
      numeral234Entries,
      numeral5PlusEntries,
      ordinalNumeralEntries,
      verbEntry,
      adverbCategories,
      prepositionCategories,
      conjunctionCategories,
      posDescriptions,
      singularCaseHeaders,
      pluralCaseHeaders,
      posTabs,
      pronounSubOptions,
      numeralSubOptions,
      translationHeader: t('guide.translationHeader'),
      personHeader: t('guide.personHeader'),
      presentHeader: t('guide.presentHeader'),
      pastHeader: t('guide.pastHeader'),
      genderMfnLabel: t('common.genderMfn'),
      title: t('guide.title'),
      subtitle: t('guide.subtitle'),
    };
  }, [t, i18n.language]);
}
