import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableTitleProps {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function EditableTitle({
  value,
  onSave,
  placeholder = 'Untitled',
  className,
  inputClassName,
  disabled = false,
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commit = async () => {
    const trimmed = draft.trim() || placeholder;
    setIsEditing(false);
    setDraft(trimmed);
    if (trimmed !== value) {
      await onSave(trimmed);
    }
  };

  if (isEditing && !disabled) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setIsEditing(false);
          }
        }}
        className={cn('h-7 px-2', inputClassName)}
      />
    );
  }

  return (
    <span
      className={cn(
        'truncate',
        !disabled && 'cursor-text',
        className,
      )}
      onDoubleClick={() => !disabled && setIsEditing(true)}
      title={value}
    >
      {value || placeholder}
    </span>
  );
}
