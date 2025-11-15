import { supabase } from '@/integrations/supabase/client';
import { KnowledgeItem } from '@/hooks/useKnowledge';
import { offlineStorage } from '@/lib/offline-storage';

export class KnowledgeService {
  static async loadKnowledge(userId: string): Promise<KnowledgeItem[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items = (data || []) as KnowledgeItem[];
      
      // Store in offline cache
      await offlineStorage.storeKnowledge(items);
      return items;
    } catch (error) {
      console.error('Error loading knowledge:', error);
      // Try to load from offline storage
      return await offlineStorage.getKnowledge();
    }
  }

  static async addKnowledgeItem(
    userId: string,
    item: Omit<KnowledgeItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<KnowledgeItem> {
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: userId,
        ...item
      })
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeItem;
  }

  static async updateKnowledgeItem(
    id: string,
    updates: Partial<Omit<KnowledgeItem, 'id' | 'user_id' | 'created_at'>>
  ): Promise<KnowledgeItem> {
    const { data, error } = await supabase
      .from('knowledge_base')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeItem;
  }

  static async deleteKnowledgeItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
