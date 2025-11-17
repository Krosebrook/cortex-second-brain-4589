import { useVirtualizer } from '@tanstack/react-virtual';
import { RefObject } from 'react';

interface UseVirtualScrollOptions {
  count: number;
  parentRef: RefObject<HTMLElement>;
  estimateSize?: number;
  overscan?: number;
  enabled?: boolean;
}

export function useVirtualScroll({
  count,
  parentRef,
  estimateSize = 80,
  overscan = 5,
  enabled = true,
}: UseVirtualScrollOptions) {
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    enabled,
  });

  return virtualizer;
}
