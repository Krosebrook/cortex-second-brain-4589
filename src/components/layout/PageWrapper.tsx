/**
 * Page Wrapper Component
 * Consistent page layout wrapper with proper spacing for fixed navbar
 */

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Container } from '@/components/ui/container';

interface PageWrapperProps {
  className?: string;
  children: ReactNode;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
}

export const PageWrapper = ({
  className,
  children,
  containerSize = 'xl',
  noPadding = false,
}: PageWrapperProps) => {
  return (
    <main
      className={cn(
        'min-h-screen',
        !noPadding && 'pt-24 pb-12',
        className
      )}
    >
      <Container size={containerSize}>
        {children}
      </Container>
    </main>
  );
};

export default PageWrapper;
