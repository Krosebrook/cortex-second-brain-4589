import React from 'react';
import { cn } from '@/lib/utils';

interface DragIndicatorProps {
  visible: boolean;
  className?: string;
}

export const DragIndicator: React.FC<DragIndicatorProps> = ({ visible, className }) => {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute left-0 right-0 h-0.5 bg-primary transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
};
