import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface NativeMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

interface MenuPosition {
  top: number;
  left: number;
}

export function NativeMenu({
  open,
  onOpenChange,
  trigger,
  children,
  align = 'end',
  className,
}: NativeMenuProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: align === 'end' ? rect.right : rect.left,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, align]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };

    const handleReposition = () => updatePosition();

    window.addEventListener('click', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('click', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open, onOpenChange]);

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        className="fixed z-[999] min-w-[10rem] rounded-md border bg-popover p-1 shadow-md"
        style={{
          top: position.top,
          left: position.left,
          transform: align === 'end' ? 'translateX(-100%)' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>,
      document.body,
    );

  return (
    <div
      ref={triggerRef}
      className={cn('relative overflow-visible', className)}
    >
      {trigger}
      {menu}
    </div>
  );
}

interface NativeMenuItemProps {
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export function NativeMenuItem({
  onClick,
  destructive = false,
  disabled = false,
  children,
}: NativeMenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50',
        destructive && 'text-destructive hover:bg-destructive/10',
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </button>
  );
}
