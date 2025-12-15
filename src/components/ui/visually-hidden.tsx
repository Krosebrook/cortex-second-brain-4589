/**
 * Visually Hidden Component
 * For accessibility - content is hidden visually but available to screen readers
 */

import { cn } from '@/lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';

interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export const VisuallyHidden = ({
  children,
  className,
  ...props
}: VisuallyHiddenProps) => {
  return (
    <span
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </span>
  );
};

export default VisuallyHidden;
