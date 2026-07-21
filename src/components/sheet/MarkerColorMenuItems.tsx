import { Check, ChevronLeft } from 'lucide-react';
import { NativeMenuItem } from '@/components/sheet/NativeMenu';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { MARKER_COLOR_OPTIONS } from '@/lib/sheet/markerColors';
import { useTranslation } from '@/lib/i18n/t';
import type { MarkerColor } from '@/types';

const MARKER_COLOR_I18N_KEYS: Record<string, string> = {
  fog_blue: 'sheet.markerColor.fogBlue',
  gray_green: 'sheet.markerColor.grayGreen',
  lotus_pink: 'sheet.markerColor.lotusPink',
};

interface MarkerColorMenuItemsProps {
  currentColor?: MarkerColor | null;
  onSelect: (color: MarkerColor | null) => void;
  onClose?: () => void;
  variant?: 'native' | 'context';
  showBack?: boolean;
  onBack?: () => void;
}

function ColorSwatch({ color }: { color: MarkerColor }) {
  return (
    <span
      className="inline-block size-4 shrink-0 rounded-sm border border-black/10"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export function MarkerColorMenuItems({
  currentColor,
  onSelect,
  onClose,
  variant = 'native',
  showBack = false,
  onBack,
}: MarkerColorMenuItemsProps) {
  const { t } = useTranslation();

  const handleSelect = (color: MarkerColor | null) => {
    onSelect(color);
    onClose?.();
  };

  if (variant === 'context') {
    return (
      <>
        {showBack && onBack && (
          <ContextMenuItem onSelect={onBack}>
            <ChevronLeft className="size-4" />
            {t('sheet.markerColor.title')}
          </ContextMenuItem>
        )}
        {MARKER_COLOR_OPTIONS.map((option) => (
          <ContextMenuItem
            key={option.id}
            onSelect={() => handleSelect(option.value)}
          >
            <ColorSwatch color={option.value} />
            {t(MARKER_COLOR_I18N_KEYS[option.id])}
            {currentColor === option.value && (
              <Check className="ml-auto size-4" />
            )}
          </ContextMenuItem>
        ))}
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => handleSelect(null)}>
          {t('sheet.markerColor.noColor')}
          {!currentColor && <Check className="ml-auto size-4" />}
        </ContextMenuItem>
      </>
    );
  }

  return (
    <>
      {showBack && onBack && (
        <NativeMenuItem onClick={onBack}>
          <ChevronLeft className="size-4" />
          {t('sheet.markerColor.title')}
        </NativeMenuItem>
      )}
      {MARKER_COLOR_OPTIONS.map((option) => (
        <NativeMenuItem
          key={option.id}
          onClick={() => handleSelect(option.value)}
        >
          <ColorSwatch color={option.value} />
          <span className="flex-1 text-left">
            {t(MARKER_COLOR_I18N_KEYS[option.id])}
          </span>
          {currentColor === option.value && (
            <Check className="size-4" />
          )}
        </NativeMenuItem>
      ))}
      <NativeMenuItem onClick={() => handleSelect(null)}>
        <span className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 text-left">{t('sheet.markerColor.noColor')}</span>
        {!currentColor && <Check className="size-4" />}
      </NativeMenuItem>
    </>
  );
}
