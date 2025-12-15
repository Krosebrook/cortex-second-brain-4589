/**
 * Knowledge Service
 * Handles all knowledge base operations with proper error handling and retry logic
 */

import { supabase } from '@/integrations/supabase/client';
import { KnowledgeItem } from '@/hooks/useKnowledge';
import { offlineStorage } from '@/lib/offline-storage';
import { BaseService, handleSupabaseResult, handleSupabaseArrayResult } from './base.service';
import { createAppError, ErrorCode } from '@/lib/error-handling';
import { validateTag } from '@/utils/security';

class KnowledgeServiceImpl extends BaseService {
  constructor() {
    super('KnowledgeService');
  }

  /**
   * Load all knowledge items for a user
   */
  async loadKnowledge(userId: string): Promise<KnowledgeItem[]> {
    return this.executeWithRetry('loadKnowledge', async () => {
      try {
        const result = await supabase
          .from('knowledge_base')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        const items = handleSupabaseArrayResult(result) as KnowledgeItem[];

        // Cache for offline use
        await offlineStorage.storeKnowledge(items);
        return items;
      } catch (error) {
        this.log('loadKnowledge', 'Falling back to offline storage');
        return await offlineStorage.getKnowledge();
      }
    });
  }

  /**
   * Add a new knowledge item
   */
  async addKnowledgeItem(
    userId: string,
    item: Omit<KnowledgeItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<KnowledgeItem> {
    // Validate tags if present
    if (item.tags) {
      for (const tag of item.tags) {
        const validation = validateTag(tag);
        if (!validation.isValid) {
          throw createAppError(ErrorCode.VALIDATION, validation.error || 'Invalid tag');
        }
      }
    }

    return this.executeWithRetry('addKnowledgeItem', async () => {
      const result = await supabase
        .from('knowledge_base')
        .insert({
          user_id: userId,
          ...item,
        })
        .select()
        .single();

      return handleSupabaseResult(result) as KnowledgeItem;
    });
  }

  /**
   * Update an existing knowledge item
   */
  async updateKnowledgeItem(
    id: string,
    userId: string,
    updates: Partial<Omit<KnowledgeItem, 'id' | 'user_id' | 'created_at'>>
  ): Promise<KnowledgeItem> {
    // Validate tags if being updated
    if (updates.tags) {
      for (const tag of updates.tags) {
        const validation = validateTag(tag);
        if (!validation.isValid) {
          throw createAppError(ErrorCode.VALIDATION, validation.error || 'Invalid tag');
        }
      }
    }

    return this.executeWithRetry('updateKnowledgeItem', async () => {
      const result = await supabase
        .from('knowledge_base')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      return handleSupabaseResult(result) as KnowledgeItem;
    });
  }

  /**
   * Soft delete a knowledge item
   */
  async softDeleteKnowledgeItem(id: string, userId: string): Promise<void> {
    return this.executeWithRetry('softDeleteKnowledgeItem', async () => {
      const result = await supabase
        .from('knowledge_base')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      handleSupabaseResult(result);
    });
  }

  /**
   * Restore a soft-deleted knowledge item
   */
  async restoreKnowledgeItem(id: string, userId: string): Promise<void> {
    return this.executeWithRetry('restoreKnowledgeItem', async () => {
      const result = await supabase
        .from('knowledge_base')
        .update({ deleted_at: null })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      handleSupabaseResult(result);
    });
  }

  /**
   * Permanently delete a knowledge item
   */
  async deleteKnowledgeItem(id: string, userId: string): Promise<void> {
    return this.executeWithRetry('deleteKnowledgeItem', async () => {
      const result = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (result.error) {
        throw result.error;
      }
    });
  }

  /**
   * Bulk soft delete knowledge items
   */
  async bulkSoftDelete(ids: string[], userId: string): Promise<void> {
    return this.executeWithRetry('bulkSoftDelete', async () => {
      const result = await supabase
        .from('knowledge_base')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids)
        .eq('user_id', userId);

      if (result.error) {
        throw result.error;
      }
    });
  }

  /**
   * Bulk restore knowledge items
   */
  async bulkRestore(ids: string[], userId: string): Promise<void> {
    return this.executeWithRetry('bulkRestore', async () => {
      const result = await supabase
        .from('knowledge_base')
        .update({ deleted_at: null })
        .in('id', ids)
        .eq('user_id', userId);

      if (result.error) {
        throw result.error;
      }
    });
  }

  /**
   * Update tags for multiple knowledge items
   */
  async updateBulkTags(
    ids: string[],
    userId: string,
    tagsToAdd: string[],
    tagsToRemove: string[]
  ): Promise<Map<string, string[]>> {
    // Validate new tags
    for (const tag of tagsToAdd) {
      const validation = validateTag(tag);
      if (!validation.isValid) {
        throw createAppError(ErrorCode.VALIDATION, validation.error || 'Invalid tag');
      }
    }

    return this.executeWithRetry('updateBulkTags', async () => {
      // Fetch current items to get their current tags
      const result = await supabase
        .from('knowledge_base')
        .select('id, tags')
        .in('id', ids)
        .eq('user_id', userId);

      const items = handleSupabaseArrayResult(result);
      const previousState = new Map<string, string[]>();

      // Update each item with new tags
      const updates = items.map(async (item) => {
        const currentTags = (item.tags as string[]) || [];
        previousState.set(item.id, [...currentTags]);

        // Remove specified tags and add new ones
        const updatedTags = [
          ...currentTags.filter((tag) => !tagsToRemove.includes(tag)),
          ...tagsToAdd.filter((tag) => !currentTags.includes(tag)),
        ];

        const updateResult = await supabase
          .from('knowledge_base')
          .update({ tags: updatedTags, updated_at: new Date().toISOString() })
          .eq('id', item.id)
          .eq('user_id', userId);

        if (updateResult.error) {
          throw updateResult.error;
        }
      });

      await Promise.all(updates);
      return previousState;
    });
  }

  /**
   * Update order of knowledge items
   */
  async updateOrder(
    orderedItems: Array<{ id: string; order_index: number }>,
    userId: string
  ): Promise<void> {
    return this.executeWithRetry('updateOrder', async () => {
      const updates = orderedItems.map(({ id, order_index }) =>
        supabase
          .from('knowledge_base')
          .update({ order_index })
          .eq('id', id)
          .eq('user_id', userId)
      );

      const results = await Promise.all(updates);
      
      for (const result of results) {
        if (result.error) {
          throw result.error;
        }
      }
    });
  }

  /**
   * Get a single knowledge item by ID
   */
  async getKnowledgeItem(id: string, userId: string): Promise<KnowledgeItem> {
    return this.executeWithRetry('getKnowledgeItem', async () => {
      const result = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      return handleSupabaseResult(result) as KnowledgeItem;
    });
  }
}

// Export singleton instance
export const KnowledgeService = new KnowledgeServiceImpl();

// Also export the class for testing
export { KnowledgeServiceImpl };
