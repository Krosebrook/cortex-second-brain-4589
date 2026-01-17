/**
 * Paginated Query Hook
 * Reusable hook for cursor-based pagination with React Query
 * 
 * @module hooks/usePaginatedQuery
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UIConfig } from '@/config/app-config';

export interface PaginationState {
  page: number;
  pageSize: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export interface UsePaginatedQueryOptions<T> {
  /** Unique query key */
  queryKey: string[];
  /** Fetch function that returns paginated data */
  queryFn: (pagination: PaginationState) => Promise<PaginatedResult<T>>;
  /** Initial page size */
  pageSize?: number;
  /** Whether the query is enabled */
  enabled?: boolean;
  /** Stale time in ms */
  staleTime?: number;
  /** Cache time in ms */
  gcTime?: number;
}

export interface UsePaginatedQueryResult<T> {
  /** Current page data */
  data: T[];
  /** Total count of items */
  totalCount: number;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Items per page */
  pageSize: number;
  /** Whether query is loading */
  isLoading: boolean;
  /** Whether query is fetching (includes background refetches) */
  isFetching: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Change page size */
  setPageSize: (size: number) => void;
  /** Refresh current page */
  refresh: () => void;
  /** Check if can go to next page */
  canNextPage: boolean;
  /** Check if can go to previous page */
  canPrevPage: boolean;
}

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  pageSize: initialPageSize = UIConfig.defaultPageSize,
  enabled = true,
  staleTime = 30000,
  gcTime = 300000,
}: UsePaginatedQueryOptions<T>): UsePaginatedQueryResult<T> {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const pagination: PaginationState = useMemo(() => ({
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  }), [page, pageSize]);

  const fullQueryKey = [...queryKey, pagination];

  const {
    data: result,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: fullQueryKey,
    queryFn: () => queryFn(pagination),
    enabled,
    staleTime,
    gcTime,
    placeholderData: (previousData) => previousData,
  });

  const data = result?.data ?? [];
  const totalCount = result?.count ?? 0;
  const hasMore = result?.hasMore ?? false;
  const totalPages = Math.ceil(totalCount / pageSize);

  const canNextPage = page < totalPages;
  const canPrevPage = page > 1;

  const nextPage = useCallback(() => {
    if (canNextPage) {
      setPage(p => p + 1);
    }
  }, [canNextPage]);

  const prevPage = useCallback(() => {
    if (canPrevPage) {
      setPage(p => p - 1);
    }
  }, [canPrevPage]);

  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, Math.max(totalPages, 1)));
    setPage(validPage);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    const validSize = Math.max(1, Math.min(size, UIConfig.maxPageSize));
    setPageSizeState(validSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    if (hasMore) {
      const nextPagination: PaginationState = {
        page: page + 1,
        pageSize,
        offset: page * pageSize,
      };
      queryClient.prefetchQuery({
        queryKey: [...queryKey, nextPagination],
        queryFn: () => queryFn(nextPagination),
        staleTime,
      });
    }
  }, [hasMore, page, pageSize, queryKey, queryFn, queryClient, staleTime]);

  // Auto-prefetch on hover or when reaching end of current page
  useMemo(() => {
    if (enabled && hasMore && !isFetching) {
      prefetchNextPage();
    }
  }, [enabled, hasMore, isFetching, prefetchNextPage]);

  return {
    data,
    totalCount,
    hasMore,
    currentPage: page,
    totalPages,
    pageSize,
    isLoading,
    isFetching,
    error: error as Error | null,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    refresh,
    canNextPage,
    canPrevPage,
  };
}

export default usePaginatedQuery;
