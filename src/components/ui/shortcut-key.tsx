import React from 'react';
import { cn } from '@/lib/utils';

interface ShortcutKeyProps {
  children: React.ReactNode;
  className?: string;
}

export const ShortcutKey: React.FC<ShortcutKeyProps> = ({ children, className }) => {
  return (
    <kbd
      className={cn(
        'px-2 py-1 text-xs font-semibold rounded',
        'bg-muted text-muted-foreground',
        'border border-border shadow-sm',
        'inline-block min-w-[1.5rem] text-center',
        className
      )}
    >
      {children}
    </kbd>
  );
};

interface ShortcutComboProps {
  keys: string[];
  separator?: string;
  className?: string;
}

export const ShortcutCombo: React.FC<ShortcutComboProps> = ({ 
  keys, 
  separator = '+', 
  className 
}) => {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <ShortcutKey>{key}</ShortcutKey>
          {index < keys.length - 1 && (
            <span className="text-muted-foreground text-xs">{separator}</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
};
