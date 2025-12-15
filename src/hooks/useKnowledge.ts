/**
 * useKnowledge Hook
 * Manages knowledge base items with proper service integration and loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedToast } from '@/components/feedback/EnhancedToast';
import { useConfirmationDialog } from '@/components/feedback/ConfirmationProvider';
import { KnowledgeService } from '@/services/knowledge.service';
import { useAsyncAction } from './useAsyncAction';
import { validateTag } from '@/utils/security';

// ============================================
// Types
// ============================================

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string | null;
  type: 'note' | 'document' | 'web_page' | 'file' | null;
  source_url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  version?: number;
  order_index?: number;
  deleted_at?: string | null;
  user_id?: string;
}

interface TagUpdateResult {
  success: boolean;
  previousState: { id: string; tags: string[]; version?: number }[];
}

interface UseKnowledgeReturn {
  items: KnowledgeItem[];
  loading: boolean;
  addKnowledgeItem: (item: Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateKnowledgeItem: (id: string, updates: Partial<Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteKnowledgeItem: (id: string) => Promise<void>;
  deleteBulkKnowledgeItems: (ids: string[]) => Promise<void>;
  softDeleteKnowledgeItem: (id: string) => Promise<void>;
  restoreKnowledgeItem: (id: string) => Promise<void>;
  softDeleteBulkKnowledgeItems: (ids: string[]) => Promise<KnowledgeItem[]>;
  restoreBulkKnowledgeItems: (ids: string[]) => Promise<void>;
  updateKnowledgeOrder: (orderedItems: { id: string; order_index: number }[]) => Promise<void>;
  updateBulkTags: (itemIds: string[], tagsToAdd: string[], tagsToRemove: string[]) => Promise<TagUpdateResult>;
  restoreBulkTags: (previousState: { id: string; tags: string[] }[]) => Promise<boolean>;
  refreshKnowledge: () => Promise<KnowledgeItem[] | null>;
}

// ============================================
// Hook Implementation
// ============================================

export const useKnowledge = (): UseKnowledgeReturn => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const { user } = useAuth();
  const { confirm } = useConfirmationDialog();

  // ============================================
  // Async Actions
  // ============================================

  const loadKnowledgeAction = useAsyncAction(
    async () => {
      if (!user) return [];
      return KnowledgeService.loadKnowledge(user.id);
    },
    {
      showToast: false,
      onSuccess: (data) => {
        // Sort by order_index, then by updated_at
        const sorted = [...data].sort((a, b) => {
          const orderA = a.order_index ?? Infinity;
          const orderB = b.order_index ?? Infinity;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        setItems(sorted);
      },
    }
  );

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    if (user) {
      loadKnowledgeAction.execute();
    } else {
      setItems([]);
    }
  }, [user?.id]);

  // ============================================
  // Actions
  // ============================================

  const addKnowledgeItem = useCallback(async (
    item: Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> => {
    if (!user) return;

    try {
      await KnowledgeService.addKnowledgeItem(user.id, item);
      await loadKnowledgeAction.execute();
      enhancedToast.success('Success', 'Knowledge item added successfully');
    } catch (error) {
      console.error('Error adding knowledge item:', error);
      enhancedToast.error('Error', 'Failed to add knowledge item');
    }
  }, [user, loadKnowledgeAction]);

  const updateKnowledgeItem = useCallback(async (
    id: string,
    updates: Partial<Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> => {
    if (!user) return;

    try {
      await KnowledgeService.updateKnowledgeItem(id, user.id, updates);
      await loadKnowledgeAction.execute();
      enhancedToast.success('Success', 'Knowledge item updated successfully');
    } catch (error) {
      console.error('Error updating knowledge item:', error);
      enhancedToast.error('Error', 'Failed to update knowledge item');
    }
  }, [user, loadKnowledgeAction]);

  const softDeleteKnowledgeItem = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    await KnowledgeService.softDeleteKnowledgeItem(id, user.id);
    await loadKnowledgeAction.execute();
  }, [user, loadKnowledgeAction]);

  const restoreKnowledgeItem = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    await KnowledgeService.restoreKnowledgeItem(id, user.id);
    await loadKnowledgeAction.execute();
  }, [user, loadKnowledgeAction]);

  const deleteKnowledgeItem = useCallback(async (id: string): Promise<void> => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    confirm({
      title: 'Delete Knowledge Item',
      description: `Are you sure you want to delete "${itemToDelete.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await softDeleteKnowledgeItem(id);
          enhancedToast.success('Item Deleted', `"${itemToDelete.title}" has been deleted`);
        } catch {
          enhancedToast.error('Error', 'Failed to delete knowledge item');
        }
      },
    });
  }, [items, confirm, softDeleteKnowledgeItem]);

  const softDeleteBulkKnowledgeItems = useCallback(async (ids: string[]): Promise<KnowledgeItem[]> => {
    if (!user) return [];
    const itemsToDelete = items.filter(item => ids.includes(item.id));
    await KnowledgeService.bulkSoftDelete(ids, user.id);
    await loadKnowledgeAction.execute();
    return itemsToDelete;
  }, [user, items, loadKnowledgeAction]);

  const restoreBulkKnowledgeItems = useCallback(async (ids: string[]): Promise<void> => {
    if (!user) return;
    await KnowledgeService.bulkRestore(ids, user.id);
    await loadKnowledgeAction.execute();
  }, [user, loadKnowledgeAction]);

  const deleteBulkKnowledgeItems = useCallback(async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;

    confirm({
      title: 'Delete Multiple Items',
      description: `Are you sure you want to delete ${ids.length} knowledge item${ids.length > 1 ? 's' : ''}?`,
      confirmText: `Delete ${ids.length} Item${ids.length > 1 ? 's' : ''}`,
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await softDeleteBulkKnowledgeItems(ids);
          enhancedToast.success(
            'Items Deleted',
            `${ids.length} knowledge item${ids.length > 1 ? 's have' : ' has'} been deleted`
          );
        } catch {
          enhancedToast.error('Error', 'Failed to delete knowledge items');
        }
      },
    });
  }, [confirm, softDeleteBulkKnowledgeItems]);

  const updateKnowledgeOrder = useCallback(async (
    orderedItems: { id: string; order_index: number }[]
  ): Promise<void> => {
    if (!user) return;

    try {
      await KnowledgeService.updateOrder(orderedItems, user.id);
      await loadKnowledgeAction.execute();
      enhancedToast.success('Success', 'Items reordered successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      enhancedToast.error('Error', 'Failed to update order');
    }
  }, [user, loadKnowledgeAction]);

  const updateBulkTags = useCallback(async (
    itemIds: string[],
    tagsToAdd: string[],
    tagsToRemove: string[]
  ): Promise<TagUpdateResult> => {
    if (!user) return { success: false, previousState: [] };

    // Validate all tags before processing
    for (const tag of tagsToAdd) {
      const validation = validateTag(tag);
      if (!validation.isValid) {
        enhancedToast.error('Invalid Tag', validation.error || 'Tag validation failed');
        return { success: false, previousState: [] };
      }
    }

    try {
      // Capture previous state
      const itemsToUpdate = items.filter(item => itemIds.includes(item.id));
      const previousState = itemsToUpdate.map(item => ({
        id: item.id,
        tags: [...(item.tags || [])],
        version: item.version,
      }));

      await KnowledgeService.updateBulkTags(itemIds, user.id, tagsToAdd, tagsToRemove);
      await loadKnowledgeAction.execute();

      const action = tagsToAdd.length > 0 ? 'added to' : 'removed from';
      enhancedToast.success('Success', `Tags ${action} ${itemIds.length} items`);

      return { success: true, previousState };
    } catch (error) {
      console.error('Error updating tags:', error);
      enhancedToast.error('Error', 'Failed to update tags');
      return { success: false, previousState: [] };
    }
  }, [user, items, loadKnowledgeAction]);

  const restoreBulkTags = useCallback(async (
    previousState: { id: string; tags: string[] }[]
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Restore each item's tags individually
      await Promise.all(
        previousState.map(({ id, tags }) =>
          KnowledgeService.updateKnowledgeItem(id, user.id, { tags })
        )
      );
      await loadKnowledgeAction.execute();
      return true;
    } catch (error) {
      console.error('Error restoring tags:', error);
      return false;
    }
  }, [user, loadKnowledgeAction]);

  // ============================================
  // Return
  // ============================================

  return {
    items,
    loading: loadKnowledgeAction.loading,
    addKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    deleteBulkKnowledgeItems,
    softDeleteKnowledgeItem,
    restoreKnowledgeItem,
    softDeleteBulkKnowledgeItems,
    restoreBulkKnowledgeItems,
    updateKnowledgeOrder,
    updateBulkTags,
    restoreBulkTags,
    refreshKnowledge: loadKnowledgeAction.execute,
  };
};
