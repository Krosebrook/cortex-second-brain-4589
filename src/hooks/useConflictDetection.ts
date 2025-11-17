import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conflict } from '@/types/conflict';

export const useConflictDetection = (
  table: 'knowledge_base' | 'chats',
  itemIds: string[]
) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => {
    if (itemIds.length === 0) return;

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: `id=in.(${itemIds.join(',')})`,
        },
        (payload) => {
          // Notify about external changes
          console.log(`External update detected on ${table}:`, payload);
          
          // Add conflict notification
          const conflict: Conflict = {
            type: 'update',
            actionId: 'external',
            itemId: payload.new.id,
            itemTitle: payload.new.title,
            expected: payload.old,
            actual: payload.new,
            timestamp: Date.now(),
          };
          
          setConflicts(prev => [...prev, conflict]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, itemIds]);

  const clearConflicts = () => setConflicts([]);

  return { conflicts, clearConflicts };
};
