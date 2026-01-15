import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conflict } from '@/types/conflict';
import { toast } from 'sonner';

interface RealtimeConflictOptions {
  tables?: ('knowledge_base' | 'chats')[];
  onConflictDetected?: (conflict: Conflict) => void;
  showNotifications?: boolean;
}

interface LocalChange {
  itemId: string;
  table: 'knowledge_base' | 'chats';
  timestamp: number;
  expectedVersion?: number;
}

export const useRealtimeConflicts = (options: RealtimeConflictOptions = {}) => {
  const { 
    tables = ['knowledge_base', 'chats'], 
    onConflictDetected,
    showNotifications = true 
  } = options;
  
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isListening, setIsListening] = useState(false);
  const localChangesRef = useRef<Map<string, LocalChange>>(new Map());
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  // Track local changes to detect conflicts
  const trackLocalChange = useCallback((itemId: string, table: 'knowledge_base' | 'chats', expectedVersion?: number) => {
    localChangesRef.current.set(`${table}:${itemId}`, {
      itemId,
      table,
      timestamp: Date.now(),
      expectedVersion
    });
    
    // Clean up old tracked changes after 5 minutes
    setTimeout(() => {
      localChangesRef.current.delete(`${table}:${itemId}`);
    }, 5 * 60 * 1000);
  }, []);

  const addConflict = useCallback((conflict: Conflict) => {
    setConflicts(prev => {
      // Avoid duplicates
      const exists = prev.some(c => 
        c.itemId === conflict.itemId && 
        c.type === conflict.type &&
        Date.now() - c.timestamp < 60000 // Within last minute
      );
      if (exists) return prev;
      return [...prev, conflict];
    });
    
    onConflictDetected?.(conflict);
    
    if (showNotifications) {
      toast.warning(
        `Sync conflict detected`, 
        {
          description: `"${conflict.itemTitle || conflict.itemId.slice(0, 8)}" was modified externally`,
          action: {
            label: 'Review',
            onClick: () => {
              // This could navigate to settings or show a modal
              console.log('Review conflict:', conflict);
            }
          }
        }
      );
    }
  }, [onConflictDetected, showNotifications]);

  const removeConflict = useCallback((itemId: string) => {
    setConflicts(prev => prev.filter(c => c.itemId !== itemId));
  }, []);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    const subscribeToTable = (table: 'knowledge_base' | 'chats') => {
      const channel = supabase
        .channel(`realtime-conflicts-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          async (payload) => {
            const newRecord = payload.new as Record<string, any> | null;
            const oldRecord = payload.old as Record<string, any> | null;
            const itemId = newRecord?.id || oldRecord?.id;
            
            if (!itemId) return;
            
            const key = `${table}:${itemId}`;
            const localChange = localChangesRef.current.get(key);
            
            // Skip if this is our own change (within last 5 seconds)
            if (localChange && Date.now() - localChange.timestamp < 5000) {
              return;
            }

            // Get current user to check if this is their data
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const record = newRecord || oldRecord;
            if (record?.user_id !== user.id) return;

            // Check for conflicts based on event type
            if (payload.eventType === 'UPDATE' && newRecord && oldRecord) {
              if (localChange) {
                const conflict: Conflict = {
                  type: 'update',
                  actionId: 'realtime-' + Date.now(),
                  itemId: newRecord.id,
                  itemTitle: newRecord.title,
                  expected: oldRecord,
                  actual: newRecord,
                  timestamp: Date.now(),
                };
                addConflict(conflict);
              }
            } else if (payload.eventType === 'DELETE' && oldRecord) {
              if (localChange) {
                const conflict: Conflict = {
                  type: 'delete',
                  actionId: 'realtime-' + Date.now(),
                  itemId: oldRecord.id,
                  itemTitle: oldRecord.title,
                  expected: oldRecord,
                  actual: null,
                  timestamp: Date.now(),
                };
                addConflict(conflict);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsListening(true);
          }
        });

      return channel;
    };

    // Subscribe to all specified tables
    channelsRef.current = tables.map(subscribeToTable);

    return () => {
      channelsRef.current.forEach(channel => {
        channel.unsubscribe();
      });
      channelsRef.current = [];
      setIsListening(false);
    };
  }, [tables, addConflict]);

  // Version check for optimistic updates
  const checkVersion = useCallback(async (
    table: 'knowledge_base' | 'chats',
    itemId: string,
    expectedVersion: number
  ): Promise<{ hasConflict: boolean; currentVersion?: number }> => {
    const { data, error } = await supabase
      .from(table)
      .select('version')
      .eq('id', itemId)
      .single();

    if (error) {
      console.error('Version check failed:', error);
      return { hasConflict: false };
    }

    const currentVersion = data?.version || 0;
    return {
      hasConflict: currentVersion !== expectedVersion,
      currentVersion
    };
  }, []);

  // Resolve a conflict
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'keep-local' | 'keep-server' | 'merge',
    localData?: any
  ): Promise<boolean> => {
    const conflict = conflicts.find(c => c.itemId === conflictId);
    if (!conflict) return false;

    try {
      if (resolution === 'keep-local' && localData) {
        const table = conflict.type === 'delete' ? 'knowledge_base' : 'knowledge_base';
        await supabase
          .from(table)
          .upsert({
            id: conflictId,
            ...localData,
            updated_at: new Date().toISOString()
          });
      } else if (resolution === 'merge' && localData && conflict.actual) {
        // Merge strategy: combine fields intelligently
        const merged = {
          ...conflict.actual,
          ...localData,
          // For arrays like tags, combine unique values
          tags: conflict.actual.tags && localData.tags 
            ? [...new Set([...conflict.actual.tags, ...localData.tags])]
            : localData.tags || conflict.actual.tags,
          updated_at: new Date().toISOString()
        };
        
        await supabase
          .from('knowledge_base')
          .update(merged)
          .eq('id', conflictId);
      }
      // keep-server: no action needed, server version is already current

      removeConflict(conflictId);
      toast.success('Conflict resolved');
      return true;
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast.error('Failed to resolve conflict');
      return false;
    }
  }, [conflicts, removeConflict]);

  return {
    conflicts,
    isListening,
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length,
    trackLocalChange,
    addConflict,
    removeConflict,
    clearConflicts,
    checkVersion,
    resolveConflict
  };
};

export default useRealtimeConflicts;
