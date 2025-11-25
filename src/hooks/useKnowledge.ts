import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { enhancedToast } from '@/components/feedback/EnhancedToast';
import { useConfirmationDialog } from '@/components/feedback/ConfirmationProvider';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'document' | 'web_page' | 'file';
  source_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  version?: number;
}

export const useKnowledge = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { confirm } = useConfirmationDialog();

  useEffect(() => {
    if (user) {
      loadKnowledge();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadKnowledge = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('user_id', user?.id)
        .is('deleted_at', null)
        .order('order_index', { ascending: true })
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading knowledge:', error);
        enhancedToast.error('Error', 'Failed to load knowledge base');
        return;
      }

      setItems((data || []) as KnowledgeItem[]);
    } catch (error) {
      console.error('Error loading knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const addKnowledgeItem = async (item: Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .insert({
          ...item,
          user_id: user.id
        });

      if (error) {
        console.error('Error adding knowledge item:', error);
        enhancedToast.error('Error', 'Failed to add knowledge item');
        return;
      }

      await loadKnowledge();
      enhancedToast.success('Success', 'Knowledge item added successfully');
    } catch (error) {
      console.error('Error adding knowledge item:', error);
      enhancedToast.error('Error', 'Failed to add knowledge item');
    }
  };

  const updateKnowledgeItem = async (id: string, updates: Partial<Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating knowledge item:', error);
        enhancedToast.error('Error', 'Failed to update knowledge item');
        return;
      }

      await loadKnowledge();
      enhancedToast.success('Success', 'Knowledge item updated successfully');
    } catch (error) {
      console.error('Error updating knowledge item:', error);
      enhancedToast.error('Error', 'Failed to update knowledge item');
    }
  };

  const softDeleteKnowledgeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadKnowledge();
    } catch (error) {
      console.error('Error soft deleting knowledge item:', error);
      throw error;
    }
  };

  const restoreKnowledgeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      await loadKnowledge();
    } catch (error) {
      console.error('Error restoring knowledge item:', error);
      throw error;
    }
  };

  const deleteKnowledgeItem = async (id: string) => {
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
        } catch (error) {
          enhancedToast.error('Error', 'Failed to delete knowledge item');
        }
      },
      successMessage: undefined,
      errorMessage: undefined
    });
  };

  const softDeleteBulkKnowledgeItems = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;
      await loadKnowledge();
      return items.filter(item => ids.includes(item.id));
    } catch (error) {
      console.error('Error soft deleting knowledge items:', error);
      throw error;
    }
  };

  const restoreBulkKnowledgeItems = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ deleted_at: null })
        .in('id', ids);

      if (error) throw error;
      await loadKnowledge();
    } catch (error) {
      console.error('Error restoring knowledge items:', error);
      throw error;
    }
  };

  const deleteBulkKnowledgeItems = async (ids: string[]) => {
    if (ids.length === 0) return;

    const itemsToDelete = items.filter(item => ids.includes(item.id));

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
        } catch (error) {
          console.error('Error deleting knowledge items:', error);
          enhancedToast.error('Error', 'Failed to delete knowledge items');
        }
      },
      successMessage: undefined,
      errorMessage: undefined
    });
  };

  const updateKnowledgeOrder = async (orderedItems: { id: string; order_index: number }[]) => {
    try {
      const updates = orderedItems.map(({ id, order_index }) =>
        supabase
          .from('knowledge_base')
          .update({ order_index })
          .eq('id', id)
      );

      await Promise.all(updates);
      await loadKnowledge();
      enhancedToast.success('Success', 'Items reordered successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      enhancedToast.error('Error', 'Failed to update order');
    }
  };

  const updateBulkTags = async (itemIds: string[], tagsToAdd: string[], tagsToRemove: string[]): Promise<{
    success: boolean;
    previousState: { id: string; tags: string[]; version?: number }[];
  }> => {
    try {
      // Validate all tags before processing
      const { validateTag } = await import('@/utils/security');
      
      for (const tag of tagsToAdd) {
        const validation = validateTag(tag);
        if (!validation.isValid) {
          enhancedToast.error('Invalid Tag', validation.error || 'Tag validation failed');
          return { success: false, previousState: [] };
        }
      }
      
      const itemsToUpdate = items.filter(item => itemIds.includes(item.id));
      
      // Capture previous state
      const previousState = itemsToUpdate.map(item => ({
        id: item.id,
        tags: [...(item.tags || [])],
        version: item.version,
      }));
      
      const updates = itemsToUpdate.map(async (item) => {
        let updatedTags = [...(item.tags || [])];
        
        tagsToAdd.forEach(tag => {
          if (!updatedTags.includes(tag)) {
            updatedTags.push(tag);
          }
        });
        
        updatedTags = updatedTags.filter(tag => !tagsToRemove.includes(tag));
        
        return supabase
          .from('knowledge_base')
          .update({ tags: updatedTags })
          .eq('id', item.id);
      });

      await Promise.all(updates);
      await loadKnowledge();
      
      const action = tagsToAdd.length > 0 ? 'added to' : 'removed from';
      enhancedToast.success('Success', `Tags ${action} ${itemIds.length} items`);
      
      return { success: true, previousState };
    } catch (error) {
      console.error('Error updating tags:', error);
      enhancedToast.error('Error', 'Failed to update tags');
      return { success: false, previousState: [] };
    }
  };

  const restoreBulkTags = async (previousState: { id: string; tags: string[] }[]): Promise<boolean> => {
    try {
      const updates = previousState.map(({ id, tags }) =>
        supabase
          .from('knowledge_base')
          .update({ tags })
          .eq('id', id)
      );

      await Promise.all(updates);
      await loadKnowledge();
      
      return true;
    } catch (error) {
      console.error('Error restoring tags:', error);
      return false;
    }
  };

  return {
    items,
    loading,
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
    refreshKnowledge: loadKnowledge
  };
};

const updateKnowledgeOrder = async (orderedItems: { id: string; order_index: number }[]) => {
  // This will be added inside useKnowledge hook
};

const updateBulkTags = async (itemIds: string[], tagsToAdd: string[], tagsToRemove: string[]) => {
  // This will be added inside useKnowledge hook
};