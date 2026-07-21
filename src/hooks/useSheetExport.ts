import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { exportSheetToExcel } from '@/lib/export/exportExcel';
import {
  exportFullTableImages,
  exportVisibleTableImage,
} from '@/lib/export/exportImage';
import {
  LARGE_SHEET_ROW_THRESHOLD,
  tableNeedsPagedExport,
} from '@/lib/export/exportUtils';
import { t } from '@/lib/i18n/t';
import type { ColumnConfig, Row, UILang } from '@/types';

export function useSheetExport(
  columns: ColumnConfig[],
  rows: Row[],
  uiLang: UILang,
) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [imageChoiceOpen, setImageChoiceOpen] = useState(false);

  const needsImageRangeChoice = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container) return false;
    return tableNeedsPagedExport(container);
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (exporting) return;

    setExporting(true);
    const isLarge = rows.length > LARGE_SHEET_ROW_THRESHOLD;
    const loadingToast = toast.loading(
      isLarge
        ? t('sheet.export.toast.tooManyRows')
        : t('sheet.export.toast.excelGenerating'),
    );

    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0);
      });
      await exportSheetToExcel({ columns, rows, uiLang });
      toast.success(t('sheet.export.toast.excelSuccess'), { id: loadingToast });
    } catch (error) {
      console.error('[export] excel failed', error);
      toast.error(t('sheet.export.toast.failed'), { id: loadingToast });
    } finally {
      setExporting(false);
    }
  }, [columns, rows, uiLang, exporting]);

  const handleExportImageVisible = useCallback(async () => {
    const container = tableContainerRef.current;
    if (exporting) return;
    if (!container) {
      toast.error(t('sheet.export.toast.failed'));
      return;
    }

    setExporting(true);
    setImageChoiceOpen(false);

    try {
      await exportVisibleTableImage(container);
      toast.success(t('sheet.export.toast.imageSuccess'));
    } catch (error) {
      console.error('[export] visible image failed', error);
      toast.error(t('sheet.export.toast.failed'), {
        description: t('sheet.export.image.longPressHint'),
      });
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  const handleExportImageFull = useCallback(async () => {
    const container = tableContainerRef.current;
    if (exporting) return;
    if (!container) {
      toast.error(t('sheet.export.toast.failed'));
      return;
    }

    setExporting(true);
    setImageChoiceOpen(false);

    try {
      const { pageCount } = await exportFullTableImages(container);
      toast.success(t('sheet.export.toast.imagePages', { count: pageCount }));
    } catch (error) {
      console.error('[export] full image failed', error);
      toast.error(t('sheet.export.toast.failed'), {
        description: t('sheet.export.image.longPressHint'),
      });
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  const handleExportImageClick = useCallback(() => {
    if (needsImageRangeChoice()) {
      setImageChoiceOpen(true);
      return;
    }
    void handleExportImageVisible();
  }, [needsImageRangeChoice, handleExportImageVisible]);

  return {
    tableContainerRef,
    exporting,
    imageChoiceOpen,
    setImageChoiceOpen,
    handleExportExcel,
    handleExportImageClick,
    handleExportImageVisible,
    handleExportImageFull,
  };
}
