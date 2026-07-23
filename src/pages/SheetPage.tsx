import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AmbiguityPickerDialog } from '@/components/sheet/AmbiguityPickerDialog';
import { BulkActionBar } from '@/components/sheet/BulkActionBar';
import { ExportMenu } from '@/components/sheet/ExportMenu';
import { FreezeConfigPanel } from '@/components/sheet/FreezeConfigPanel';
import { MoveSheetDialog } from '@/components/sheet/MoveSheetDialog';
import { SelectionModeBar } from '@/components/sheet/SelectionModeBar';
import { SheetSearch } from '@/components/sheet/SheetSearch';
import { SheetTabBar } from '@/components/sheet/SheetTabBar';
import { SheetTable } from '@/components/sheet/SheetTable';
import { SheetToolbar } from '@/components/sheet/SheetToolbar';
import { VipUpgradeDialog } from '@/components/vip/VipUpgradeDialog';
import { useAuth } from '@/hooks/useAuth';
import { useVip } from '@/hooks/useVip';
import { useInflection } from '@/hooks/useInflection';
import {
  isFillRowNeedsChoice,
  type AmbiguityLevel,
  type AnalyzeCandidate,
  type FillRowResult,
} from '@/lib/inflection/types';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useRows } from '@/hooks/useRows';
import { useSheetColumns } from '@/hooks/useSheetColumns';
import { useSheetFreeze } from '@/hooks/useSheetFreeze';
import { useSheetRows } from '@/hooks/useSheetRows';
import { useSheetExport } from '@/hooks/useSheetExport';
import { useSheetSearch } from '@/hooks/useSheetSearch';
import { useSheetTabs } from '@/hooks/useSheetTabs';
import { applyFormToCell } from '@/lib/inflection/applyFormToCell';
import { shouldFillColumn } from '@/lib/inflection/caseMapping';
import {
  applyBulkHide,
  applyBulkShow,
  getCellSourceWord,
  isCellEmpty,
  isCellHidden,
  setCellDefaultValue,
  toggleCellHiddenState,
} from '@/lib/sheet/cellUtils';
import { makeCellKey, useSelectionStore } from '@/store/selectionStore';
import { isPlainEditableColumn } from '@/lib/sheet/defaultSheet';
import { countUserTotalRows } from '@/lib/api/rows';
import { FREE_ROW_LIMIT } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/t';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import type { CellData, CellsData, Sheet } from '@/types';

export function SheetPage() {
  const { id: sheetId } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isVip } = useVip();
  const { allNotebooks } = useNotebooks();

  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [ambiguityOpen, setAmbiguityOpen] = useState(false);
  const [vipDialogOpen, setVipDialogOpen] = useState(false);
  const [totalRowCount, setTotalRowCount] = useState<number | undefined>();
  const [ambiguityLevel, setAmbiguityLevel] = useState<AmbiguityLevel>('L2');
  const [ambiguityWord, setAmbiguityWord] = useState('');
  const [ambiguityCandidates, setAmbiguityCandidates] = useState<
    AnalyzeCandidate[]
  >([]);
  const pendingFillRef = useRef<{
    rowId: string;
    sourceWord: string;
  } | null>(null);
  const rowCountLoadedRef = useRef(false);

  const {
    mode,
    enterSelectionMode,
    exitSelectionMode,
    toggleAll,
    selectedCells,
  } = useSelectionStore();

  const selectionMode = mode === 'selecting';

  const {
    currentSheet,
    tabs,
    notebookId,
    loading: tabsLoading,
    error: tabsError,
    busy,
    createTab,
    renameTab,
    deleteTab,
    duplicateTab,
    moveTab,
    reorderTabs,
    updateCurrentSheet,
  } = useSheetTabs(sheetId);

  const onSheetChange = useCallback(
    (sheet: Sheet) => {
      updateCurrentSheet(sheet);
    },
    [updateCurrentSheet],
  );

  const { rows, loading: rowsLoading, updateRowsCells, updateCellMarker, updateRowMarker, setRows } =
    useRows(currentSheet);

  const getRowCells = useCallback(
    (rowId: string): CellsData => {
      const row = rows.find((item) => item.id === rowId);
      return row?.cells_data ?? {};
    },
    [rows],
  );

  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);

  const columnsState = useSheetColumns({
    sheet: currentSheet,
    onSheetChange,
    onRowsUpdate: updateRowsCells,
    rowIds,
    getRowCells,
  });

  const rowsState = useSheetRows({
    sheet: currentSheet,
    rows,
    setRows,
    onSheetChange,
  });

  useEffect(() => {
    if (!user || isVip) {
      rowCountLoadedRef.current = false;
      setTotalRowCount(undefined);
      return;
    }

    rowCountLoadedRef.current = false;
    void countUserTotalRows(user.id)
      .then((total) => {
        rowCountLoadedRef.current = true;
        setTotalRowCount(total);
      })
      .catch((error) => {
        console.error('Failed to count user rows:', error);
      });
  }, [user, isVip]);

  const freezeState = useSheetFreeze({
    sheet: currentSheet,
    columnCount: columnsState.visibleColumns.length,
    onSheetChange,
  });

  const { fillRow, fillMessages } = useInflection();

  const uiLang = useSettingsStore((s) => s.uiLang);

  const sheetSearch = useSheetSearch(rows, columnsState.visibleColumns);

  const sheetExport = useSheetExport(
    columnsState.visibleColumns,
    rows,
    uiLang,
  );

  const allCellKeys = useMemo(
    () =>
      rows.flatMap((row) =>
        columnsState.visibleColumns.map((column) =>
          makeCellKey(row.id, column.id),
        ),
      ),
    [rows, columnsState.visibleColumns],
  );

  const selectionStats = useMemo(() => {
    if (!selectionMode) {
      return { actionable: 0, hideable: 0, showable: 0 };
    }

    const selectedSet = new Set(selectedCells);
    let actionable = 0;
    let hideable = 0;
    let showable = 0;

    for (const row of rows) {
      for (const column of columnsState.visibleColumns) {
        const key = makeCellKey(row.id, column.id);
        if (!selectedSet.has(key)) continue;

        const cell = row.cells_data[column.id] as CellData | undefined;
        if (isCellEmpty(cell)) continue;

        actionable += 1;
        if (isCellHidden(cell)) {
          showable += 1;
        } else {
          hideable += 1;
        }
      }
    }

    return { actionable, hideable, showable };
  }, [selectionMode, selectedCells, rows, columnsState.visibleColumns]);

  const applyBulkAction = useCallback(
    async (applyFn: (cell: CellData | undefined) => CellData | null) => {
      const selectedSet = new Set(useSelectionStore.getState().selectedCells);
      const updates: { rowId: string; cellsData: CellsData }[] = [];

      for (const row of rows) {
        let changed = false;
        const nextCells = { ...row.cells_data };

        for (const column of columnsState.visibleColumns) {
          const key = makeCellKey(row.id, column.id);
          if (!selectedSet.has(key)) continue;

          const cell = nextCells[column.id] as CellData | undefined;
          const nextCell = applyFn(cell);
          if (nextCell) {
            nextCells[column.id] = nextCell;
            changed = true;
          }
        }

        if (changed) {
          updates.push({ rowId: row.id, cellsData: nextCells });
        }
      }

      if (updates.length === 0) return;

      setBulkBusy(true);
      try {
        await updateRowsCells(updates);
        exitSelectionMode();
      } finally {
        setBulkBusy(false);
      }
    },
    [rows, columnsState.visibleColumns, updateRowsCells, exitSelectionMode],
  );

  const handleBulkHide = useCallback(
    () => void applyBulkAction(applyBulkHide),
    [applyBulkAction],
  );

  const handleBulkShow = useCallback(
    () => void applyBulkAction(applyBulkShow),
    [applyBulkAction],
  );

  const handleToggleCellHidden = useCallback(
    async (rowId: string, columnId: string) => {
      const row = rows.find((item) => item.id === rowId);
      if (!row) return;

      const cell = row.cells_data[columnId] as CellData | undefined;
      if (!cell) return;

      const nextCell = toggleCellHiddenState(cell);
      await updateRowsCells([
        {
          rowId,
          cellsData: {
            ...row.cells_data,
            [columnId]: nextCell,
          },
        },
      ]);
    },
    [rows, updateRowsCells],
  );

  const applyFillResult = useCallback(
    async (rowId: string, result: FillRowResult) => {
      const row = rows.find((item) => item.id === rowId);
      if (!row) return;

      const fillableColumns = columnsState.visibleColumns.filter(shouldFillColumn);

      if (result.errorCode === 'timeout') {
        toast.error(fillMessages.timeout);
        return;
      }

      if (result.filledCount === 0) {
        toast.error(fillMessages.notFound);
        return;
      }

      if (result.usedMock && result.errorCode === 'service_unavailable') {
        toast.warning(fillMessages.serviceUnavailable);
      }

      const nextCells = { ...row.cells_data };

      for (const fillColumn of fillableColumns) {
        const form = result.formsByColumnId[fillColumn.id];
        const nextCell = applyFormToCell(
          nextCells[fillColumn.id] as CellData | undefined,
          form,
          fillColumn.supports_gender,
        );
        if (nextCell) {
          nextCells[fillColumn.id] = nextCell;
        }
      }

      await updateRowsCells([
        {
          rowId,
          cellsData: nextCells,
        },
      ]);
    },
    [rows, columnsState.visibleColumns, fillMessages, updateRowsCells],
  );

  const handleGenerateCell = useCallback(
    async (rowId: string, columnId: string) => {
      const row = rows.find((item) => item.id === rowId);
      if (!row) return;

      const column = columnsState.visibleColumns.find(
        (col) => col.id === columnId,
      );
      if (!column?.supports_gender) return;

      const cell = row.cells_data[columnId] as CellData | undefined;
      const sourceWord = getCellSourceWord(cell);
      if (!sourceWord) {
        toast.error('请先在单元格中输入单词');
        return;
      }

      const fillableColumns = columnsState.visibleColumns.filter(shouldFillColumn);
      if (fillableColumns.length === 0) return;

      try {
        const result = await fillRow(sourceWord, columnsState.visibleColumns);
        if (!result) {
          toast.error(fillMessages.notFound);
          return;
        }

        if (isFillRowNeedsChoice(result)) {
          pendingFillRef.current = { rowId, sourceWord };
          setAmbiguityLevel(result.ambiguityLevel);
          setAmbiguityWord(result.sourceWord);
          setAmbiguityCandidates(result.candidates);
          setAmbiguityOpen(true);
          return;
        }

        await applyFillResult(rowId, result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : fillMessages.notFound;
        toast.error(message);
      }
    },
    [
      rows,
      columnsState.visibleColumns,
      fillRow,
      fillMessages,
      applyFillResult,
    ],
  );

  const handleAmbiguitySelect = useCallback(
    async (candidateId: string) => {
      const pending = pendingFillRef.current;
      if (!pending) return;

      setAmbiguityOpen(false);

      try {
        const result = await fillRow(pending.sourceWord, columnsState.visibleColumns, {
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
        const message =
          error instanceof Error ? error.message : fillMessages.notFound;
        toast.error(message);
      }
    },
    [fillRow, columnsState.visibleColumns, fillMessages, applyFillResult],
  );

  const handleSaveCell = useCallback(
    async (rowId: string, columnId: string, value: string) => {
      const row = rows.find((item) => item.id === rowId);
      if (!row) return;

      const column = columnsState.visibleColumns.find(
        (col) => col.id === columnId,
      );
      if (
        !column ||
        (!column.supports_gender && !isPlainEditableColumn(column))
      ) {
        return;
      }

      const cell = row.cells_data[columnId] as CellData | undefined;
      const nextCell = setCellDefaultValue(
        cell,
        value.trim(),
        column.supports_gender && !isPlainEditableColumn(column),
      );

      await updateRowsCells([
        {
          rowId,
          cellsData: {
            ...row.cells_data,
            [columnId]: nextCell,
          },
        },
      ]);
    },
    [rows, columnsState.visibleColumns, updateRowsCells],
  );

  const handleAddRow = useCallback(async () => {
    if (!user) return;

    if (!isVip) {
      if (rowCountLoadedRef.current && totalRowCount !== undefined) {
        if (totalRowCount >= FREE_ROW_LIMIT) {
          setVipDialogOpen(true);
          return;
        }
      } else {
        try {
          const total = await countUserTotalRows(user.id);
          rowCountLoadedRef.current = true;
          setTotalRowCount(total);
          if (total >= FREE_ROW_LIMIT) {
            setVipDialogOpen(true);
            return;
          }
        } catch (error) {
          console.error('Failed to count user rows:', error);
          toast.error(t('vip.rowLimit.countFailed'));
          return;
        }
      }
    }

    await rowsState.addRow();

    if (!isVip) {
      setTotalRowCount((current) => (current ?? 0) + 1);
    }
  }, [user, isVip, rowsState, totalRowCount, t]);

  const loading = tabsLoading || rowsLoading;

  if (loading && !currentSheet) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        加载中...
      </div>
    );
  }

  if (tabsError || !currentSheet) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {tabsError ?? '页面不存在'}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <SheetTabBar
        tabs={tabs}
        activeSheetId={sheetId}
        busy={busy}
        onCreate={() => void createTab()}
        onRename={(id, title) => void renameTab(id, title)}
        onDelete={(id) => void deleteTab(id)}
        onDuplicate={(id) => void duplicateTab(id)}
        onMove={(id) => setMoveTargetId(id)}
        onReorder={reorderTabs}
      />

      <SheetToolbar
        busy={busy || bulkBusy || sheetExport.exporting}
        selectionMode={selectionMode}
        searchOpen={sheetSearch.isOpen}
        onAddRow={() => void handleAddRow()}
        onOpenFreeze={() => setFreezeOpen(true)}
        onEnterSelectionMode={enterSelectionMode}
        onOpenSearch={sheetSearch.toggle}
        exportControl={
          <ExportMenu
            disabled={busy || bulkBusy}
            exporting={sheetExport.exporting}
            imageChoiceOpen={sheetExport.imageChoiceOpen}
            onImageChoiceOpenChange={sheetExport.setImageChoiceOpen}
            onExportExcel={sheetExport.handleExportExcel}
            onExportImage={sheetExport.handleExportImageClick}
            onExportImageVisible={sheetExport.handleExportImageVisible}
            onExportImageFull={sheetExport.handleExportImageFull}
          />
        }
      />

      <SheetSearch
        open={sheetSearch.isOpen}
        query={sheetSearch.query}
        matchCount={sheetSearch.matches.length}
        inputRef={sheetSearch.inputRef}
        onQueryChange={sheetSearch.setQuery}
        onClose={sheetSearch.close}
        onNext={sheetSearch.goNext}
        onPrevious={sheetSearch.goPrev}
      />

      {selectionMode && (
        <SelectionModeBar
          totalCells={allCellKeys.length}
          onToggleAll={() => toggleAll(allCellKeys)}
          onDone={exitSelectionMode}
        />
      )}

      <div
        className={cn(
          'flex-1 overflow-hidden p-4',
          selectionMode && 'pb-20',
        )}
      >
        <SheetTable
          ref={sheetExport.tableContainerRef}
          columns={columnsState.visibleColumns}
          rows={rows}
          frozenConfig={freezeState.frozenConfig}
          onAddPreset={(preset) => void columnsState.addColumn(preset)}
          onAddCustom={(label) => void columnsState.addCustomColumn(label)}
          onRenameColumn={columnsState.renameColumn}
          onDeleteColumn={(columnId) => columnsState.deleteColumn(columnId)}
          onReorderColumns={columnsState.reorderColumns}
          onDeleteRow={(rowId) => rowsState.deleteRow(rowId)}
          onReorderRows={rowsState.reorderRows}
          onToggleCellHidden={(rowId, columnId) =>
            void handleToggleCellHidden(rowId, columnId)
          }
          onGenerateCell={(rowId, columnId) =>
            handleGenerateCell(rowId, columnId)
          }
          onSaveCell={(rowId, columnId, value) =>
            handleSaveCell(rowId, columnId, value)
          }
          onSetCellMarkerColor={(rowId, columnId, color) =>
            updateCellMarker(rowId, columnId, color)
          }
          onSetRowMarkerColor={(rowId, color) =>
            updateRowMarker(rowId, color)
          }
          onOpenFreeze={() => setFreezeOpen(true)}
          searchMatchKeys={sheetSearch.isOpen ? sheetSearch.matchKeys : undefined}
          activeSearchKey={sheetSearch.isOpen ? sheetSearch.activeKey : null}
        />
      </div>

      {selectionMode && (
        <BulkActionBar
          actionableCount={selectionStats.actionable}
          hideableCount={selectionStats.hideable}
          showableCount={selectionStats.showable}
          onHide={handleBulkHide}
          onShow={handleBulkShow}
          busy={bulkBusy}
        />
      )}

      <MoveSheetDialog
        open={!!moveTargetId}
        onOpenChange={(open) => {
          if (!open) setMoveTargetId(null);
        }}
        notebooks={allNotebooks}
        currentNotebookId={notebookId}
        userId={user?.id ?? ''}
        onSelect={(targetNotebookId) => {
          if (moveTargetId) {
            void moveTab(moveTargetId, targetNotebookId);
          }
        }}
      />

      <AmbiguityPickerDialog
        open={ambiguityOpen}
        level={ambiguityLevel}
        word={ambiguityWord}
        candidates={ambiguityCandidates}
        onOpenChange={(open) => {
          setAmbiguityOpen(open);
          if (!open) pendingFillRef.current = null;
        }}
        onSelect={(candidateId) => void handleAmbiguitySelect(candidateId)}
      />

      <FreezeConfigPanel
        open={freezeOpen}
        onOpenChange={setFreezeOpen}
        config={freezeState.frozenConfig}
        columnCount={columnsState.visibleColumns.length}
        onSave={freezeState.updateFrozenConfig}
        onReset={() => {
          freezeState.resetFrozenConfig();
          setFreezeOpen(false);
        }}
      />

      <VipUpgradeDialog
        open={vipDialogOpen}
        onOpenChange={setVipDialogOpen}
        rowCount={totalRowCount}
      />
    </div>
  );
}
