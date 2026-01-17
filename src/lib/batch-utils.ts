/**
 * Batch Utilities
 * Utilities for efficient batch database operations with progress tracking
 * 
 * @module lib/batch-utils
 */

import { supabase } from '@/integrations/supabase/client';
import { BatchConfig } from '@/config/app-config';

export interface BatchResult<T = unknown> {
  success: number;
  failed: number;
  total: number;
  errors: Array<{ index: number; error: string; item?: T }>;
  successItems: T[];
}

export interface BatchOptions {
  /** Number of items to process per batch */
  batchSize?: number;
  /** Delay between batches in ms */
  delayMs?: number;
  /** Callback for progress updates */
  onProgress?: (completed: number, total: number, batchNumber: number) => void;
  /** Whether to continue processing on individual item failure */
  continueOnError?: boolean;
  /** Signal for aborting the operation */
  signal?: AbortSignal;
}

/**
 * Process items in batches with proper error handling and progress tracking
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchOptions = {}
): Promise<BatchResult<R>> {
  const {
    batchSize = BatchConfig.defaultBatchSize,
    delayMs = BatchConfig.batchDelayMs,
    onProgress,
    continueOnError = true,
    signal,
  } = options;

  const result: BatchResult<R> = {
    success: 0,
    failed: 0,
    total: items.length,
    errors: [],
    successItems: [],
  };

  if (items.length === 0) {
    return result;
  }

  const batches = Math.ceil(items.length / batchSize);
  
  for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
    // Check for abort
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batchItems = items.slice(start, end);

    // Process batch items in parallel
    const batchPromises = batchItems.map(async (item, localIndex) => {
      const globalIndex = start + localIndex;
      try {
        const processedItem = await processor(item, globalIndex);
        return { success: true, item: processedItem, index: globalIndex };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          index: globalIndex,
          item: item as unknown as R,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    for (const batchResult of batchResults) {
      if (batchResult.success) {
        result.success++;
        result.successItems.push(batchResult.item);
      } else {
        result.failed++;
        result.errors.push({
          index: batchResult.index,
          error: batchResult.error || 'Unknown error',
          item: batchResult.item,
        });

        if (!continueOnError) {
          return result;
        }
      }
    }

    // Progress callback
    onProgress?.(start + batchItems.length, items.length, batchIndex + 1);

    // Delay between batches (except for last batch)
    if (batchIndex < batches - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return result;
}

/**
 * Batch insert items into a Supabase table
 */
export async function batchInsert<T extends Record<string, unknown>>(
  tableName: string,
  items: T[],
  options: BatchOptions = {}
): Promise<BatchResult<T>> {
  const {
    batchSize = BatchConfig.defaultBatchSize,
    onProgress,
    signal,
  } = options;

  const result: BatchResult<T> = {
    success: 0,
    failed: 0,
    total: items.length,
    errors: [],
    successItems: [],
  };

  if (items.length === 0) {
    return result;
  }

  const batches = Math.ceil(items.length / batchSize);

  for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batchItems = items.slice(start, end);

    try {
      // Use raw supabase client to avoid type restrictions
      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert(batchItems)
        .select();

      if (error) {
        // Mark all items in batch as failed
        batchItems.forEach((item, localIndex) => {
          result.failed++;
          result.errors.push({
            index: start + localIndex,
            error: error.message,
            item: item as T,
          });
        });
      } else {
        result.success += batchItems.length;
        result.successItems.push(...(data as unknown as T[]));
      }
    } catch (error) {
      batchItems.forEach((item, localIndex) => {
        result.failed++;
        result.errors.push({
          index: start + localIndex,
          error: error instanceof Error ? error.message : String(error),
          item: item as T,
        });
      });
    }

    onProgress?.(start + batchItems.length, items.length, batchIndex + 1);

    // Small delay between batches to avoid overwhelming the database
    if (batchIndex < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return result;
}

/**
 * Batch update items in a Supabase table
 */
export async function batchUpdate<T extends { id: string } & Record<string, unknown>>(
  tableName: string,
  items: T[],
  options: BatchOptions = {}
): Promise<BatchResult<T>> {
  return processBatch(
    items,
    async (item) => {
      const { id, ...updates } = item;
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as T;
    },
    options
  );
}

/**
 * Batch delete items from a Supabase table
 */
export async function batchDelete(
  tableName: string,
  ids: string[],
  options: BatchOptions = {}
): Promise<BatchResult<{ id: string }>> {
  const {
    batchSize = BatchConfig.defaultBatchSize,
    onProgress,
    signal,
  } = options;

  const result: BatchResult<{ id: string }> = {
    success: 0,
    failed: 0,
    total: ids.length,
    errors: [],
    successItems: [],
  };

  if (ids.length === 0) {
    return result;
  }

  const batches = Math.ceil(ids.length / batchSize);

  for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, ids.length);
    const batchIds = ids.slice(start, end);

    try {
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .in('id', batchIds);

      if (error) {
        batchIds.forEach((id, localIndex) => {
          result.failed++;
          result.errors.push({
            index: start + localIndex,
            error: error.message,
            item: { id },
          });
        });
      } else {
        result.success += batchIds.length;
        batchIds.forEach(id => result.successItems.push({ id }));
      }
    } catch (error) {
      batchIds.forEach((id, localIndex) => {
        result.failed++;
        result.errors.push({
          index: start + localIndex,
          error: error instanceof Error ? error.message : String(error),
          item: { id },
        });
      });
    }

    onProgress?.(start + batchIds.length, ids.length, batchIndex + 1);

    if (batchIndex < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return result;
}
