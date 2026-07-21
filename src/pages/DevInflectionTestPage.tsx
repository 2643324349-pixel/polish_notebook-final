/**
 * Dev-only page for E2E inflection testing (no Supabase required).
 * Visit /dev/inflection-test while `pnpm dev` is running.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { AmbiguityPickerDialog } from '@/components/sheet/AmbiguityPickerDialog';
import { SheetTable } from '@/components/sheet/SheetTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInflection } from '@/hooks/useInflection';
import { applyFormToCell } from '@/lib/inflection/applyFormToCell';
import { shouldFillColumn } from '@/lib/inflection/caseMapping';
import {
  isFillRowNeedsChoice,
  type AmbiguityLevel,
  type AnalyzeCandidate,
  type FillRowResult,
} from '@/lib/inflection/types';
import { createColumnFromPreset } from '@/lib/sheet/columnUtils';
import {
  getAdjectiveColumnPresets,
  getVerbColumnPresets,
} from '@/lib/sheet/columnPresets';
import {
  DEFAULT_FROZEN_CONFIG,
  createEmptyCell,
  getOrderedVisibleColumns,
} from '@/lib/sheet/defaultSheet';
import { setCellDefaultValue } from '@/lib/sheet/cellUtils';
import type { CellData, CellsData, ColumnConfig, ColumnsConfig, Row } from '@/types';

import type { ColumnPresetOption } from '@/lib/sheet/columnPresets';

function buildConfig(
  extraPresets: ColumnPresetOption[],
  includeCaseTypes: string[],
): ColumnsConfig {
  const translation: ColumnConfig = {
    id: 'col_translation',
    case_type: 'translation',
    label_i18n: {
      en: 'Translation',
      'zh-CN': '翻译',
      uk: 'Переклад',
      de: 'Übersetzung',
    },
    width: 150,
    is_visible: true,
    is_system: true,
    supports_gender: false,
  };

  const lemma: ColumnConfig = {
    id: 'col_lemma',
    case_type: 'nominative_singular',
    label_i18n: {
      en: 'Lemma',
      'zh-CN': '单词(主格)/原形',
      uk: 'Лема',
      de: 'Lemma',
    },
    width: 160,
    is_visible: true,
    is_system: true,
    supports_gender: true,
  };

  const extras = extraPresets
    .filter((p) => includeCaseTypes.includes(p.case_type))
    .map((p) => createColumnFromPreset(p));

  const columns = [translation, lemma, ...extras];
  return {
    columns,
    column_order: columns.map((c) => c.id),
  };
}

function makeRow(id: string, word: string, columns: ColumnConfig[]): Row {
  const cells: CellsData = {};
  for (const col of columns) {
    cells[col.id] = createEmptyCell(col.supports_gender);
  }
  const lemmaCol = columns.find((c) => c.id === 'col_lemma');
  if (lemmaCol) {
    cells[lemmaCol.id] = setCellDefaultValue(
      cells[lemmaCol.id] as CellData,
      word,
      true,
    );
  }
  return {
    id,
    sheet_id: 'dev-test',
    cells_data: cells,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

interface TestSectionProps {
  title: string;
  word: string;
  columnsConfig: ColumnsConfig;
}

function TestSection({ title, word, columnsConfig }: TestSectionProps) {
  const columns = useMemo(
    () => getOrderedVisibleColumns(columnsConfig),
    [columnsConfig],
  );

  const [rows, setRows] = useState<Row[]>(() => [
    makeRow(`row-${word}`, word, columns),
  ]);

  const { fillRow, fillMessages } = useInflection();

  const [ambiguityOpen, setAmbiguityOpen] = useState(false);
  const [ambiguityLevel, setAmbiguityLevel] = useState<AmbiguityLevel>('L2');
  const [ambiguityCandidates, setAmbiguityCandidates] = useState<
    AnalyzeCandidate[]
  >([]);
  const pendingFillRef = useRef<{ rowId: string; sourceWord: string } | null>(
    null,
  );

  const applyFillResult = useCallback(
    async (rowId: string, result: FillRowResult) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;

      const fillableColumns = columns.filter(shouldFillColumn);

      if (result.errorCode === 'timeout') {
        toast.error(fillMessages.timeout);
        return;
      }
      if (result.filledCount === 0) {
        toast.error(fillMessages.notFound);
        return;
      }

      const nextCells = { ...row.cells_data };
      for (const fillColumn of fillableColumns) {
        const form = result.formsByColumnId[fillColumn.id];
        const nextCell = applyFormToCell(
          nextCells[fillColumn.id] as CellData | undefined,
          form,
          fillColumn.supports_gender,
        );
        if (nextCell) nextCells[fillColumn.id] = nextCell;
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, cells_data: nextCells } : r,
        ),
      );
    },
    [rows, columns, fillMessages],
  );

  const handleGenerateCell = useCallback(
    async (rowId: string, columnId: string) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;

      const column = columns.find((c) => c.id === columnId);
      if (!column?.supports_gender) return;

      const cell = row.cells_data[columnId] as CellData | undefined;
      const sourceWord =
        cell?.gender_values.default?.value?.trim() ||
        cell?.gender_values.m?.value?.trim();
      if (!sourceWord) {
        toast.error('请先在单元格中输入单词');
        return;
      }

      try {
        const result = await fillRow(sourceWord, columns);
        if (!result) {
          toast.error(fillMessages.notFound);
          return;
        }
        if (isFillRowNeedsChoice(result)) {
          pendingFillRef.current = { rowId, sourceWord };
          setAmbiguityLevel(result.ambiguityLevel);
          setAmbiguityCandidates(result.candidates);
          setAmbiguityOpen(true);
          return;
        }
        await applyFillResult(rowId, result);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : fillMessages.notFound,
        );
      }
    },
    [rows, columns, fillRow, fillMessages, applyFillResult],
  );

  const handleAmbiguitySelect = useCallback(
    async (candidateId: string) => {
      const pending = pendingFillRef.current;
      if (!pending) return;
      setAmbiguityOpen(false);

      try {
        const result = await fillRow(pending.sourceWord, columns, {
          selectedCandidateId: candidateId,
        });
        pendingFillRef.current = null;
        if (!result || isFillRowNeedsChoice(result)) {
          toast.error(fillMessages.notFound);
          return;
        }
        await applyFillResult(pending.rowId, result);
      } catch (error) {
        pendingFillRef.current = null;
        toast.error(
          error instanceof Error ? error.message : fillMessages.notFound,
        );
      }
    },
    [columns, fillRow, fillMessages, applyFillResult],
  );

  const handleSaveCell = useCallback(
    (rowId: string, columnId: string, value: string) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const column = columns.find((c) => c.id === columnId);
          if (!column) return row;
          return {
            ...row,
            cells_data: {
              ...row.cells_data,
              [columnId]: setCellDefaultValue(
                row.cells_data[columnId] as CellData | undefined,
                value.trim(),
                column.supports_gender,
              ),
            },
          };
        }),
      );
    },
    [columns],
  );

  return (
    <div className="space-y-3" data-testid={`section-${word}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="overflow-hidden rounded-xl border">
        <SheetTable
          columns={columns}
          rows={rows}
          frozenConfig={DEFAULT_FROZEN_CONFIG}
          onAddPreset={() => {}}
          onAddCustom={() => {}}
          onRenameColumn={() => {}}
          onDeleteColumn={async () => {}}
          onReorderColumns={() => {}}
          onDeleteRow={async () => {}}
          onReorderRows={setRows}
          onToggleCellHidden={() => {}}
          onGenerateCell={handleGenerateCell}
          onSaveCell={handleSaveCell}
          onSetCellMarkerColor={async () => {}}
          onSetRowMarkerColor={async () => {}}
          onOpenFreeze={() => {}}
        />
      </div>

      <AmbiguityPickerDialog
        open={ambiguityOpen}
        level={ambiguityLevel}
        word={word}
        candidates={ambiguityCandidates}
        onOpenChange={(open) => {
          setAmbiguityOpen(open);
          if (!open) pendingFillRef.current = null;
        }}
        onSelect={(id) => void handleAmbiguitySelect(id)}
      />
    </div>
  );
}

export function DevInflectionTestPage() {
  const verbConfig = useMemo(
    () =>
      buildConfig(getVerbColumnPresets(), [
        'verb_present_1sg',
        'verb_present_2sg',
        'verb_present_3sg',
        'verb_present_1pl',
      ]),
    [],
  );
  const adjConfig = useMemo(
    () =>
      buildConfig(getAdjectiveColumnPresets(), [
        'instrumental_singular',
        'nominative_plural',
        'genitive_plural',
      ]),
    [],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6" data-testid="dev-inflection-test">
      <Toaster position="top-center" richColors />
      <div>
        <h1 className="text-2xl font-bold">Inflection E2E Test</h1>
        <p className="text-sm text-muted-foreground">
          Dev-only · 测试 mieć (L2) 与 nowy (L3)
        </p>
      </div>

      <Tabs defaultValue="verb">
        <TabsList>
          <TabsTrigger value="verb">verb · mieć</TabsTrigger>
          <TabsTrigger value="adj">adj · nowy</TabsTrigger>
        </TabsList>
        <TabsContent value="verb" className="mt-4">
          <TestSection
            title="动词 mieć — 预期 L2 弹窗"
            word="mieć"
            columnsConfig={verbConfig}
          />
        </TabsContent>
        <TabsContent value="adj" className="mt-4">
          <TestSection
            title="形容词 nowy — 预期 L3 弹窗"
            word="nowy"
            columnsConfig={adjConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
