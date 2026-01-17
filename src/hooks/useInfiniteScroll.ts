/**
 * Infinite Scroll Hook
 * Cursor-based pagination with intersection observer for infinite scrolling
 * 
 * @module hooks/useInfiniteScroll
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { UIConfig } from '@/config/app-config';

export interface CursorPaginationState {
  cursor: string | null;
  pageSize: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UseInfiniteScrollOptions<T> {
  /** Unique query key */
  queryKey: string[];
  /** Fetch function that returns cursor-paginated data */
  queryFn: (cursor: string | null, pageSize: number) => Promise<CursorPaginatedResult<T>>;
  /** Page size */
  pageSize?: number;
  /** Whether the query is enabled */
  enabled?: boolean;
  /** Stale time in ms */
  staleTime?: number;
  /** Get unique ID for each item */
  getItemId?: (item: T) => string;
}

export interface UseInfiniteScrollResult<T> {
  /** All loaded data */
  data: T[];
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Whether fetching more data */
  isFetchingNextPage: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Whether there are more items to load */
  hasNextPage: boolean;
  /** Fetch more items */
  fetchNextPage: () => void;
  /** Refresh all data */
  refresh: () => void;
  /** Ref to attach to sentinel element for auto-loading */
  sentinelRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>({
  queryKey,
  queryFn,
  pageSize = UIConfig.defaultPageSize,
  enabled = true,
  staleTime = 30000,
  getItemId = (item: T) => (item as { id: string }).id,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [sentinelNode, setSentinelNode] = useState<HTMLElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam, pageSize),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled,
    staleTime,
  });

  // Flatten all pages into single array, deduplicating by ID
  const flattenedData = useMemo(() => {
    if (!data?.pages) return [];
    
    const seenIds = new Set<string>();
    const result: T[] = [];
    
    for (const page of data.pages) {
      for (const item of page.data) {
        const id = getItemId(item);
        if (!seenIds.has(id)) {
          seenIds.add(id);
          result.push(item);
        }
      }
    }
    
    return result;
  }, [data?.pages, getItemId]);

  // Set up intersection observer for auto-loading
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!sentinelNode || !hasNextPage || isFetchingNextPage) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(sentinelNode);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sentinelNode, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useCallback((node: HTMLElement | null) => {
    setSentinelNode(node);
  }, []);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data: flattenedData,
    isLoading,
    isFetchingNextPage,
    error: error as Error | null,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    refresh,
    sentinelRef,
  };
}

export default useInfiniteScroll;
