import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTranslation } from '@/lib/i18n/t';
import { RowHeaderCell } from '@/components/sheet/RowHeaderCell';
import { SheetCell } from '@/components/sheet/SheetCell';
import { makeCellKey } from '@/store/selectionStore';
import {
  ADD_COLUMN_WIDTH,
  isBodyRowFrozen,
} from '@/lib/sheet/freezeUtils';
import { isPlainEditableColumn } from '@/lib/sheet/defaultSheet';
import { getRowMarkerColor } from '@/lib/sheet/rowMeta';
import type { ColumnWidthStyle } from '@/lib/sheet/columnWidthUtils';
import { cn } from '@/lib/utils';
import type { CellData, ColumnConfig, FrozenConfig, MarkerColor, Row } from '@/types';

interface SheetRowProps {
  row: Row;
  rowIndex: number;
  columns: ColumnConfig[];
  columnWidthStyles: ColumnWidthStyle[];
  columnLeftOffsets: number[];
  frozenConfig: FrozenConfig;
  headerHeight: number;
  estimatedRowHeight: number;
  selectionMode?: boolean;
  isCellSelected: (key: string) => boolean;
  searchMatchKeys?: Set<string>;
  activeSearchKey?: string | null;
  onDelete: (rowId: string) => void | Promise<void>;
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
  onSelectCell: (
    rowIndex: number,
    colIndex: number,
    key: string,
    options: { shift?: boolean; meta?: boolean },
  ) => void;
  onEnterSelectionMode: (rowIndex: number, colIndex: number, key: string) => void;
}

export function SheetRow({
  row,
  rowIndex,
  columns,
  columnWidthStyles,
  columnLeftOffsets,
  frozenConfig,
  headerHeight,
  estimatedRowHeight,
  selectionMode = false,
  isCellSelected,
  searchMatchKeys,
  activeSearchKey,
  onDelete,
  onToggleCellHidden,
  onGenerateCell,
  onSaveCell,
  onSetCellMarkerColor,
  onSetRowMarkerColor,
  onSelectCell,
  onEnterSelectionMode,
}: SheetRowProps) {
  const { t } = useTranslation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const pendingDeleteIdRef = useRef<string | null>(null);

  const sortable = useSortable({
    id: row.id,
    disabled: selectionMode,
  });
  const rowFrozen = isBodyRowFrozen(rowIndex, frozenConfig.freeze_rows);

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const rowStickyTop = rowFrozen
    ? headerHeight + rowIndex * estimatedRowHeight
    : undefined;

  const rowMarkerColor = getRowMarkerColor(row);

  return (
    <>
      <tr
        ref={sortable.setNodeRef}
        style={style}
        className={cn(
          'border-b last:border-b-0',
          sortable.isDragging && 'z-20 opacity-80 shadow-md',
        )}
      >
        <RowHeaderCell
          rowStickyTop={rowStickyTop}
          rowFrozen={rowFrozen}
          rowMarkerColor={rowMarkerColor}
          selectionMode={selectionMode}
          dragAttributes={sortable.attributes}
          dragListeners={sortable.listeners}
          onRequestDelete={() => {
            pendingDeleteIdRef.current = row.id;
            setDeleteOpen(true);
          }}
          onSetRowMarkerColor={(color: MarkerColor | null) =>
            onSetRowMarkerColor(row.id, color)
          }
        />

        {columns.map((column, colIndex) => {
          const colFrozen = colIndex < frozenConfig.freeze_cols;
          const frozen = colFrozen || rowFrozen;
          const stickyTop = rowFrozen ? rowStickyTop : colFrozen ? 0 : undefined;
          const stickyLeft = colFrozen ? columnLeftOffsets[colIndex] : undefined;
          const zIndex = rowFrozen && colFrozen ? 30 : rowFrozen ? 20 : colFrozen ? 18 : 1;
          const cellKey = makeCellKey(row.id, column.id);
          const isSearchMatch = searchMatchKeys?.has(cellKey) ?? false;
          const isActiveSearchMatch = activeSearchKey === cellKey;

          const plainEditable = isPlainEditableColumn(column);
          const cellSupportsGender = column.supports_gender && !plainEditable;

          return (
            <SheetCell
              key={column.id}
              cell={row.cells_data[column.id] as CellData | undefined}
              rowMarkerColor={rowMarkerColor}
              widthStyle={columnWidthStyles[colIndex]}
              supportsGender={cellSupportsGender}
              plainEditable={plainEditable}
              frozen={frozen}
              stickyLeft={stickyLeft}
              stickyTop={stickyTop}
              zIndex={zIndex}
              selectionMode={selectionMode}
              isSelected={isCellSelected(cellKey)}
              isSearchMatch={isSearchMatch}
              isActiveSearchMatch={isActiveSearchMatch}
              onToggleHidden={() => onToggleCellHidden(row.id, column.id)}
              onGenerate={
                column.supports_gender
                  ? () => onGenerateCell(row.id, column.id)
                  : undefined
              }
              onSave={
                column.supports_gender || plainEditable
                  ? (value) => onSaveCell(row.id, column.id, value)
                  : undefined
              }
              onSetMarkerColor={(color) =>
                onSetCellMarkerColor(row.id, column.id, color)
              }
              onSelectCell={(options) =>
                onSelectCell(rowIndex, colIndex, cellKey, options)
              }
              onEnterSelectionMode={() =>
                onEnterSelectionMode(rowIndex, colIndex, cellKey)
              }
            />
          );
        })}

        <td
          style={{ width: ADD_COLUMN_WIDTH, minWidth: ADD_COLUMN_WIDTH }}
          className="bg-muted/10"
        />
      </tr>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(false);
        }}
        title={t('sheet.deleteRowTitle')}
        description={t('sheet.deleteRowDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={async () => {
          const id = pendingDeleteIdRef.current ?? row.id;
          if (!id) return;
          await onDelete(id);
          pendingDeleteIdRef.current = null;
          setDeleteOpen(false);
        }}
      />
    </>
  );
}
