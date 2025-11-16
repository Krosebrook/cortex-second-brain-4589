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

  const deleteKnowledgeItem = async (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    confirm({
      title: 'Delete Knowledge Item',
      description: `Are you sure you want to delete "${itemToDelete.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        const previousItems = [...items];

        // Optimistically update UI
        setItems(items.filter(item => item.id !== id));

        try {
          const { error } = await supabase
            .from('knowledge_base')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('Error deleting knowledge item:', error);
            setItems(previousItems);
            enhancedToast.error('Error', 'Failed to delete knowledge item');
            return;
          }

          enhancedToast.destructive(
            'Item Deleted',
            `"${itemToDelete.title}" has been deleted`,
            async () => {
              // Undo deletion - restore the item
              const { error: restoreError } = await supabase
                .from('knowledge_base')
                .insert({
                  id: itemToDelete.id,
                  user_id: user?.id,
                  title: itemToDelete.title,
                  content: itemToDelete.content,
                  type: itemToDelete.type,
                  source_url: itemToDelete.source_url,
                  tags: itemToDelete.tags
                });

              if (restoreError) {
                enhancedToast.error('Error', 'Failed to restore knowledge item');
              } else {
                await loadKnowledge();
                enhancedToast.success('Item Restored', 'The knowledge item has been restored');
              }
            }
          );
        } catch (error) {
          console.error('Error deleting knowledge item:', error);
          setItems(previousItems);
          enhancedToast.error('Error', 'Failed to delete knowledge item');
        }
      },
      successMessage: undefined,
      errorMessage: undefined
    });
  };

  const deleteBulkKnowledgeItems = async (ids: string[]) => {
    if (ids.length === 0) return;

    const itemsToDelete = items.filter(item => ids.includes(item.id));

    confirm({
      title: 'Delete Multiple Items',
      description: `Are you sure you want to delete ${ids.length} knowledge item${ids.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete ${ids.length} Item${ids.length > 1 ? 's' : ''}`,
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        const previousItems = [...items];

        // Optimistically update UI
        setItems(items.filter(item => !ids.includes(item.id)));

        try {
          const { error } = await supabase
            .from('knowledge_base')
            .delete()
            .in('id', ids);

          if (error) {
            console.error('Error deleting knowledge items:', error);
            setItems(previousItems);
            enhancedToast.error('Error', 'Failed to delete knowledge items');
            return;
          }

          enhancedToast.destructive(
            'Items Deleted',
            `${ids.length} knowledge item${ids.length > 1 ? 's have' : ' has'} been deleted`,
            async () => {
              // Undo deletion - restore all items
              const { error: restoreError } = await supabase
                .from('knowledge_base')
                .insert(
                  itemsToDelete.map(item => ({
                    id: item.id,
                    user_id: user?.id,
                    title: item.title,
                    content: item.content,
                    type: item.type,
                    source_url: item.source_url,
                    tags: item.tags
                  }))
                );

              if (restoreError) {
                enhancedToast.error('Error', 'Failed to restore knowledge items');
              } else {
                await loadKnowledge();
                enhancedToast.success('Items Restored', 'All knowledge items have been restored');
              }
            }
          );
        } catch (error) {
          console.error('Error deleting knowledge items:', error);
          setItems(previousItems);
          enhancedToast.error('Error', 'Failed to delete knowledge items');
        }
      },
      successMessage: undefined,
      errorMessage: undefined
    });
  };

  return {
    items,
    loading,
    addKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    deleteBulkKnowledgeItems,
    refreshKnowledge: loadKnowledge
  };
};