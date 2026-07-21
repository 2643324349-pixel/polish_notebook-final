import { useState } from 'react';
import { Download, FileSpreadsheet, ImageIcon, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { NativeMenu, NativeMenuItem } from '@/components/sheet/NativeMenu';
import { useTranslation } from '@/lib/i18n/t';

interface ExportMenuProps {
  disabled?: boolean;
  exporting?: boolean;
  imageChoiceOpen: boolean;
  onImageChoiceOpenChange: (open: boolean) => void;
  onExportExcel: () => void | Promise<void>;
  onExportImage: () => void;
  onExportImageVisible: () => void | Promise<void>;
  onExportImageFull: () => void | Promise<void>;
}

export function ExportMenu({
  disabled = false,
  exporting = false,
  imageChoiceOpen,
  onImageChoiceOpenChange,
  onExportExcel,
  onExportImage,
  onExportImageVisible,
  onExportImageFull,
}: ExportMenuProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDisabled = disabled || exporting;

  return (
    <>
      <NativeMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        align="end"
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDisabled}
            className="gap-1.5"
            aria-label={t('sheet.export.toolbar.export')}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={(event) => {
              event.stopPropagation();
              if (!isDisabled) {
                setMenuOpen((prev) => !prev);
              }
            }}
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            <span>{t('sheet.export.toolbar.export')}</span>
          </Button>
        }
      >
        <NativeMenuItem
          disabled={exporting}
          onClick={() => {
            setMenuOpen(false);
            onExportImage();
          }}
        >
          <ImageIcon className="size-4" />
          {t('sheet.export.menu.image')}
        </NativeMenuItem>
        <NativeMenuItem
          disabled={exporting}
          onClick={() => {
            setMenuOpen(false);
            void onExportExcel();
          }}
        >
          <FileSpreadsheet className="size-4" />
          {t('sheet.export.menu.excel')}
        </NativeMenuItem>
      </NativeMenu>

      <AlertDialog open={imageChoiceOpen} onOpenChange={onImageChoiceOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('sheet.export.image.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('sheet.export.image.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              className="w-full"
              onClick={() => void onExportImageVisible()}
            >
              {t('sheet.export.image.visibleArea')}
            </Button>
            <Button
              type="button"
              className="w-full"
              onClick={() => void onExportImageFull()}
            >
              {t('sheet.export.image.fullTable')}
            </Button>
            <AlertDialogCancel className="w-full">
              {t('common.cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
