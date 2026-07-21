import { forwardRef, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SheetHeaderRow } from '@/components/sheet/SheetHeaderRow';
import { SheetRow } from '@/components/sheet/SheetRow';
import { getColumnLeftOffsets } from '@/lib/sheet/freezeUtils';
import { getEffectiveColumnWidths } from '@/lib/sheet/columnWidthUtils';
import type { ColumnPresetOption } from '@/lib/sheet/columnPresets';
import {
  makeCellKey,
  useSelectionStore,
  type CellPosition,
} from '@/store/selectionStore';
import type { ColumnConfig, FrozenConfig, MarkerColor, Row } from '@/types';

const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 56;

interface SheetTableProps {
  columns: ColumnConfig[];
  rows: Row[];
  frozenConfig: FrozenConfig;
  onAddPreset: (preset: ColumnPresetOption) => void | Promise<void>;
  onAddCustom: (label: string) => void | Promise<void>;
  onRenameColumn: (columnId: string, label: string) => void;
  onDeleteColumn: (columnId: string) => void | Promise<void>;
  onReorderColumns: (activeId: string, overId: string) => void;
  onDeleteRow: (rowId: string) => void | Promise<void>;
  onReorderRows: (rows: Row[]) => void;
  onToggleCellHidden: (rowId: string, columnId: string) => void;
  onGenerateCell: (rowId: string, columnId: string) => void | Promise<void>;
  onSaveCell: (
    rowId: string,
    columnId: string,
    value: string,
  ) => void | Promise<void>;
  onSetCellMarkerColor: (
    rowId: string,
    columnId: string,
    color: MarkerColor | null,
  ) => void | Promise<void>;
  onSetRowMarkerColor: (
    rowId: string,
    color: MarkerColor | null,
  ) => void | Promise<void>;
  onOpenFreeze: () => void;
  searchMatchKeys?: Set<string>;
  activeSearchKey?: string | null;
}

export const SheetTable = forwardRef<HTMLDivElement, SheetTableProps>(
  function SheetTable(
    {
      columns,
      rows,
      frozenConfig,
      onAddPreset,
      onAddCustom,
      onRenameColumn,
      onDeleteColumn,
      onReorderColumns,
      onDeleteRow,
      onReorderRows,
      onToggleCellHidden,
      onGenerateCell,
      onSaveCell,
      onSetCellMarkerColor,
      onSetRowMarkerColor,
      onOpenFreeze,
      searchMatchKeys,
      activeSearchKey,
    },
    ref,
  ) {
  const {
    mode,
    enterSelectionMode,
    exitSelectionMode,
    toggleCell,
    setAllSelected,
    isSelected,
  } = useSelectionStore();

  const selectionMode = mode === 'selecting';

  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(
    null,
  );

  useEffect(() => {
    if (!scrollContainer) return;

    const updateWidth = () => {
      setContainerWidth(scrollContainer.clientWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(scrollContainer);
    return () => observer.disconnect();
  }, [scrollContainer]);

  const columnWidths = useMemo(
    () => getEffectiveColumnWidths(columns, containerWidth),
    [columns, containerWidth],
  );

  const columnLeftOffsets = useMemo(
    () => getColumnLeftOffsets(columns, columnWidths),
    [columns, columnWidths],
  );

  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);

  const cellGrid = useMemo(
    () =>
      rows.map((row) =>
        columns.map((column) => makeCellKey(row.id, column.id)),
      ),
    [rows, columns],
  );

  const allKeys = useMemo(() => cellGrid.flat(), [cellGrid]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleRowDragEnd = (event: DragEndEvent) => {
    if (selectionMode) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((row) => row.id === active.id);
    const newIndex = rows.findIndex((row) => row.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorderRows(arrayMove(rows, oldIndex, newIndex));
  };

  const handleSelectCell = (
    rowIndex: number,
    colIndex: number,
    key: string,
    options: { shift?: boolean; meta?: boolean },
  ) => {
    const position: CellPosition = { rowIndex, colIndex };
    toggleCell(key, position, options, cellGrid);
  };

  const handleEnterSelectionMode = (
    rowIndex: number,
    colIndex: number,
    key: string,
  ) => {
    enterSelectionMode();
    toggleCell(
      key,
      { rowIndex, colIndex },
      undefined,
      cellGrid,
    );
  };

  useEffect(() => {
    if (!selectionMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        exitSelectionMode();
        return;
      }

      if (event.key === 'a' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setAllSelected(allKeys);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectionMode, allKeys, exitSelectionMode, setAllSelected]);

  return (
    <div
      ref={(node) => {
        setScrollContainer(node);
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className="max-h-[calc(100vh-220px)] overflow-auto rounded-lg border"
    >
      <table className="w-full min-w-max border-collapse text-sm">
        <SheetHeaderRow
          columns={columns}
          columnWidths={columnWidths}
          frozenConfig={frozenConfig}
          selectionMode={selectionMode}
          onAddPreset={onAddPreset}
          onAddCustom={onAddCustom}
          onRename={onRenameColumn}
          onDelete={onDeleteColumn}
          onReorder={onReorderColumns}
          onOpenFreeze={onOpenFreeze}
        />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleRowDragEnd}
        >
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <tbody>
              {rows.map((row, rowIndex) => (
                <SheetRow
                  key={row.id}
                  row={row}
                  rowIndex={rowIndex}
                  columns={columns}
                  columnWidths={columnWidths}
                  columnLeftOffsets={columnLeftOffsets}
                  frozenConfig={frozenConfig}
                  headerHeight={HEADER_HEIGHT}
                  rowHeight={ROW_HEIGHT}
                  selectionMode={selectionMode}
                  isCellSelected={isSelected}
                  onDelete={onDeleteRow}
                  onToggleCellHidden={onToggleCellHidden}
                  onGenerateCell={onGenerateCell}
                  onSaveCell={onSaveCell}
                  onSetCellMarkerColor={onSetCellMarkerColor}
                  onSetRowMarkerColor={onSetRowMarkerColor}
                  onSelectCell={handleSelectCell}
                  onEnterSelectionMode={handleEnterSelectionMode}
                  searchMatchKeys={searchMatchKeys}
                  activeSearchKey={activeSearchKey}
                />
              ))}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>
    </div>
  );
},
);
