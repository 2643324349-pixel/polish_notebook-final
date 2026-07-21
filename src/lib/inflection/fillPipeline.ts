import { aiTranslate } from '@/lib/inflection/aiClient';
import { resolveTranslationDisplay } from '@/lib/inflection/glossResolver';
import {
  isVerbCaseType,
  resolveColumnCaseType,
  shouldFillColumn,
} from '@/lib/inflection/caseMapping';
import { analyzeWord, generateForms } from '@/lib/inflection/morfeuszClient';
import {
  mockAnalyze,
  mockGenerateForms,
  mockTranslations,
} from '@/lib/inflection/mockEngine';
import type {
  FillRowErrorCode,
  FillRowNeedsChoice,
  FillRowOutcome,
  FillRowResult,
  FormSlice,
  GenerateFormsResult,
  MockResult,
} from '@/lib/inflection/types';
import type { ColumnConfig, UILang } from '@/types';

function buildCaseTypeList(columns: ColumnConfig[]): string[] {
  const caseTypes = new Set<string>();
  for (const column of columns) {
    if (!shouldFillColumn(column)) continue;
    caseTypes.add(resolveColumnCaseType(column));
  }
  return [...caseTypes];
}

function hasFormValue(form: FormSlice | undefined): boolean {
  if (!form) return false;
  return !!(form.default || form.m || form.f || form.n);
}

function countFilledForms(
  fillableColumns: ColumnConfig[],
  formsByColumnId: Record<string, FormSlice | undefined>,
): number {
  let count = 0;
  for (const column of fillableColumns) {
    if (hasFormValue(formsByColumnId[column.id])) {
      count += 1;
    }
  }
  return count;
}

function countInflectionForms(forms: GenerateFormsResult): number {
  return Object.values(forms).filter(hasFormValue).length;
}

function withAiFlag(
  form: FormSlice | undefined,
  isAiGenerated: boolean,
): FormSlice | undefined {
  if (!form || !hasFormValue(form)) return undefined;
  return { ...form, isAiGenerated };
}

function isUsableTranslation(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  return trimmed !== '—' && trimmed !== '-';
}

function findTranslationColumn(
  fillableColumns: ColumnConfig[],
): ColumnConfig | undefined {
  return fillableColumns.find(
    (column) => resolveColumnCaseType(column) === 'translation',
  );
}

async function resolveAnalysis(
  sourceWord: string,
  uiLang: UILang,
  selectedCandidateId?: string,
): Promise<{
  analysis: MockResult | null;
  usedMock: boolean;
  errorCode?: FillRowErrorCode;
}> {
  const analyzeOutcome = await analyzeWord(sourceWord, {
    selectedCandidateId,
    lang: uiLang,
  });

  if (analyzeOutcome.error === 'timeout') {
    return { analysis: null, usedMock: false, errorCode: 'timeout' };
  }

  if (analyzeOutcome.result) {
    return { analysis: analyzeOutcome.result, usedMock: false };
  }

  if (analyzeOutcome.error === 'unavailable') {
    const mock = mockAnalyze(sourceWord);
    if (!mock) {
      return { analysis: null, usedMock: true, errorCode: 'not_found' };
    }
    return {
      analysis: mock,
      usedMock: true,
      errorCode: 'service_unavailable',
    };
  }

  const mock = mockAnalyze(sourceWord);
  if (!mock) {
    return { analysis: null, usedMock: true, errorCode: 'not_found' };
  }
  return { analysis: mock, usedMock: true };
}

async function fetchInflectionForms(
  analysis: MockResult,
  caseTypes: string[],
  usedMock: boolean,
  uiLang: UILang,
): Promise<{
  forms: GenerateFormsResult;
  aiGeneratedCases: string[];
  usedMock: boolean;
  errorCode?: FillRowErrorCode;
}> {
  if (caseTypes.length === 0) {
    return { forms: {}, aiGeneratedCases: [], usedMock };
  }

  let errorCode: FillRowErrorCode | undefined;
  let mockFlag = usedMock;
  let forms: GenerateFormsResult = {};
  let aiGeneratedCases: string[] = [];

  const morfLemma = analysis.morfLemma ?? analysis.lemma;
  const generateOutcome = await generateForms({
    morfLemma,
    pos: analysis.pos,
    hasGender: analysis.hasGender,
    caseTypes,
    lang: uiLang,
  });

  if (generateOutcome.error === 'timeout') {
    return { forms: {}, aiGeneratedCases: [], usedMock: mockFlag, errorCode: 'timeout' };
  }

  if (generateOutcome.forms && countInflectionForms(generateOutcome.forms) > 0) {
    forms = generateOutcome.forms;
    aiGeneratedCases = generateOutcome.aiGeneratedCases ?? [];
  } else {
    forms = mockGenerateForms(analysis, caseTypes);
    mockFlag = true;
    errorCode = errorCode ?? 'service_unavailable';
  }

  return { forms, aiGeneratedCases, usedMock: mockFlag, errorCode };
}

async function resolveTranslationForm(
  analysis: MockResult,
  forms: GenerateFormsResult,
  aiGeneratedCases: string[],
  sourceWord: string,
  uiLang: UILang,
  usedMock: boolean,
): Promise<FormSlice | undefined> {
  const aiCaseSet = new Set(aiGeneratedCases);
  const generatedTranslation = forms.translation?.default?.trim();

  if (isUsableTranslation(generatedTranslation)) {
    return withAiFlag(
      { default: generatedTranslation! },
      aiCaseSet.has('translation'),
    );
  }

  const glossTranslation = resolveTranslationDisplay(
    analysis.translations,
    uiLang,
  );
  if (isUsableTranslation(glossTranslation)) {
    return withAiFlag({ default: glossTranslation! }, false);
  }

  if (usedMock) {
    const fromMock = mockTranslations(analysis.lemma);
    if (isUsableTranslation(fromMock)) {
      return withAiFlag({ default: fromMock! }, false);
    }
  }

  const aiResult = await aiTranslate({
    word: analysis.lemma || sourceWord,
    pos: analysis.pos,
    lang: uiLang,
  });
  if (aiResult) {
    return withAiFlag(
      { default: aiResult.translation },
      aiResult.isAiGenerated,
    );
  }

  return undefined;
}

async function ensureTranslationColumnFilled(
  analysis: MockResult,
  fillableColumns: ColumnConfig[],
  formsByColumnId: Record<string, FormSlice | undefined>,
  sourceWord: string,
  uiLang: UILang,
): Promise<void> {
  const translationColumn = findTranslationColumn(fillableColumns);
  if (!translationColumn) return;

  const existing = formsByColumnId[translationColumn.id];
  if (hasFormValue(existing)) return;

  const aiResult = await aiTranslate({
    word: analysis.lemma || sourceWord,
    pos: analysis.pos,
    lang: uiLang,
  });
  if (!aiResult) return;

  formsByColumnId[translationColumn.id] = withAiFlag(
    { default: aiResult.translation },
    aiResult.isAiGenerated,
  );
}

function mapFormsToColumns(
  analysis: MockResult,
  fillableColumns: ColumnConfig[],
  forms: GenerateFormsResult,
  aiGeneratedCases: string[],
  translationForm: FormSlice | undefined,
): Record<string, FormSlice | undefined> {
  const formsByColumnId: Record<string, FormSlice | undefined> = {};
  const aiCaseSet = new Set(aiGeneratedCases);

  for (const column of fillableColumns) {
    const resolved = resolveColumnCaseType(column);

    if (resolved === 'translation') {
      if (translationForm) {
        formsByColumnId[column.id] = translationForm;
      }
      continue;
    }

    if (isVerbCaseType(resolved) && analysis.pos !== 'verb') {
      continue;
    }

    let rawForm: FormSlice | undefined;
    if (analysis.pos === 'verb' && resolved === 'nominative_singular') {
      rawForm = forms[resolved] ?? forms.verb_infinitive;
    } else {
      rawForm = forms[resolved];
    }

    formsByColumnId[column.id] = withAiFlag(rawForm, aiCaseSet.has(resolved));
  }

  return formsByColumnId;
}

function emptyResult(
  errorCode: FillRowErrorCode,
  usedMock = false,
): FillRowResult {
  return {
    analysis: {
      lemma: '',
      pos: 'noun',
      inflection: {},
      hasGender: false,
      confidence: 'low',
    },
    formsByColumnId: {},
    filledCount: 0,
    usedMock,
    errorCode,
  };
}

export async function fillRowPipeline(
  sourceWord: string,
  columns: ColumnConfig[],
  options?: { selectedCandidateId?: string; uiLang?: UILang },
): Promise<FillRowOutcome> {
  const uiLang = options?.uiLang ?? 'en';
  const fillableColumns = columns.filter(shouldFillColumn);
  if (fillableColumns.length === 0) return null;

  const { analysis, usedMock, errorCode } = await resolveAnalysis(
    sourceWord,
    uiLang,
    options?.selectedCandidateId,
  );

  if (errorCode === 'timeout') {
    return emptyResult('timeout', usedMock);
  }

  if (!analysis) {
    return emptyResult(errorCode ?? 'not_found', usedMock);
  }

  if (analysis.needsUserChoice && analysis.candidates?.length) {
    const needsChoice: FillRowNeedsChoice = {
      needsUserChoice: true,
      ambiguityLevel: analysis.ambiguityLevel ?? 'L2',
      candidates: analysis.candidates,
      sourceWord,
    };
    return needsChoice;
  }

  const caseTypes = buildCaseTypeList(fillableColumns);
  const inflectionOutcome = await fetchInflectionForms(
    analysis,
    caseTypes,
    usedMock,
    uiLang,
  );

  if (inflectionOutcome.errorCode === 'timeout') {
    return emptyResult('timeout', inflectionOutcome.usedMock);
  }

  const translationForm = await resolveTranslationForm(
    analysis,
    inflectionOutcome.forms,
    inflectionOutcome.aiGeneratedCases,
    sourceWord,
    uiLang,
    inflectionOutcome.usedMock || usedMock,
  );

  const formsByColumnId = mapFormsToColumns(
    analysis,
    fillableColumns,
    inflectionOutcome.forms,
    inflectionOutcome.aiGeneratedCases,
    translationForm,
  );

  await ensureTranslationColumnFilled(
    analysis,
    fillableColumns,
    formsByColumnId,
    sourceWord,
    uiLang,
  );

  const filledCount = countFilledForms(fillableColumns, formsByColumnId);
  const mergedErrorCode =
    filledCount === 0
      ? (inflectionOutcome.errorCode ?? errorCode ?? 'not_found')
      : (inflectionOutcome.errorCode ?? errorCode);

  return {
    analysis,
    formsByColumnId,
    filledCount,
    usedMock: inflectionOutcome.usedMock || usedMock,
    errorCode: mergedErrorCode,
  };
}

/** @deprecated Use fillRowPipeline */
export async function fillRowInflection(
  sourceWord: string,
  columns: ColumnConfig[],
): Promise<FillRowResult | null> {
  const outcome = await fillRowPipeline(sourceWord, columns);
  if (!outcome || 'needsUserChoice' in outcome) {
    return outcome && 'needsUserChoice' in outcome ? null : null;
  }
  return outcome;
}
