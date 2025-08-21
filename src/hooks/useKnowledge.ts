import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        toast.error('Failed to load knowledge base');
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
        toast.error('Failed to add knowledge item');
        return;
      }

      await loadKnowledge();
      toast.success('Knowledge item added successfully');
    } catch (error) {
      console.error('Error adding knowledge item:', error);
      toast.error('Failed to add knowledge item');
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
        toast.error('Failed to update knowledge item');
        return;
      }

      await loadKnowledge();
      toast.success('Knowledge item updated successfully');
    } catch (error) {
      console.error('Error updating knowledge item:', error);
      toast.error('Failed to update knowledge item');
    }
  };

  const deleteKnowledgeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting knowledge item:', error);
        toast.error('Failed to delete knowledge item');
        return;
      }

      await loadKnowledge();
      toast.success('Knowledge item deleted successfully');
    } catch (error) {
      console.error('Error deleting knowledge item:', error);
      toast.error('Failed to delete knowledge item');
    }
  };

  return {
    items,
    loading,
    addKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    refreshKnowledge: loadKnowledge
  };
};