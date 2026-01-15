import { useState, useCallback } from 'react';
import { Conflict, ConflictResolution, ConflictError } from '@/types/conflict';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseConflictResolutionProps {
  onConflictResolved?: (conflict: Conflict, resolution: ConflictResolution) => void;
}

export const useConflictResolution = ({ onConflictResolved }: UseConflictResolutionProps = {}) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  const addConflict = useCallback((conflict: Conflict) => {
    setConflicts(prev => {
      // Avoid duplicates
      const exists = prev.some(c => c.itemId === conflict.itemId && c.type === conflict.type);
      if (exists) return prev;
      return [...prev, conflict];
    });
  }, []);

  const removeConflict = useCallback((itemId: string) => {
    setConflicts(prev => prev.filter(c => c.itemId !== itemId));
  }, []);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: ConflictResolution,
    mergedData?: any
  ): Promise<void> => {
    const conflict = conflicts.find(c => c.itemId === conflictId);
    if (!conflict) return;

    setIsResolving(true);

    try {
      switch (resolution) {
        case 'skip':
          // Just remove the conflict, don't update anything
          removeConflict(conflictId);
          break;

        case 'apply':
          // Apply the provided data (either local or server version)
          if (mergedData) {
            const table = conflict.type === 'update' ? 'knowledge_base' : 'chats';
            const { error } = await supabase
              .from(table)
              .update(mergedData)
              .eq('id', conflictId);

            if (error) throw error;
          }
          removeConflict(conflictId);
          break;

        case 'merge':
          // Merge the data - combine both versions
          if (conflict.expected && conflict.actual) {
            const merged = mergeVersions(conflict.expected, conflict.actual);
            const table = conflict.type === 'update' ? 'knowledge_base' : 'chats';
            
            const { error } = await supabase
              .from(table)
              .update(merged)
              .eq('id', conflictId);

            if (error) throw error;
          }
          removeConflict(conflictId);
          break;

        case 'cancel':
          // Do nothing, keep the conflict in the list
          break;
      }

      onConflictResolved?.(conflict, resolution);
    } catch (error: any) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [conflicts, removeConflict, onConflictResolved]);

  const resolveAllConflicts = useCallback(async (resolution: ConflictResolution): Promise<void> => {
    setIsResolving(true);

    try {
      for (const conflict of conflicts) {
        if (resolution === 'skip') {
          removeConflict(conflict.itemId);
        } else if (resolution === 'apply') {
          // Apply local version for all
          await resolveConflict(conflict.itemId, 'apply', conflict.expected);
        }
      }

      toast.success(`Resolved ${conflicts.length} conflicts`);
    } catch (error: any) {
      toast.error(`Failed to resolve conflicts: ${error.message}`);
    } finally {
      setIsResolving(false);
    }
  }, [conflicts, removeConflict, resolveConflict]);

  const mergeVersions = (local: any, server: any): any => {
    const merged: any = { ...server };

    // For text content, prefer the longer version or most recent
    if (local.content && server.content) {
      merged.content = local.content.length > server.content.length 
        ? local.content 
        : server.content;
    }

    // Merge tags (combine unique tags)
    if (local.tags && server.tags) {
      merged.tags = [...new Set([...local.tags, ...server.tags])];
    }

    // Always update the timestamp
    merged.updated_at = new Date().toISOString();

    return merged;
  };

  const handleConflictError = useCallback((error: ConflictError) => {
    addConflict(error.conflict);
    toast.warning('Conflict detected - please review your changes');
  }, [addConflict]);

  const refreshConflicts = useCallback(async () => {
    // Re-check for any conflicts with the server
    // This would typically involve comparing local cached data with server data
    toast.info('Checking for conflicts...');
  }, []);

  return {
    conflicts,
    isResolving,
    addConflict,
    removeConflict,
    clearConflicts,
    resolveConflict,
    resolveAllConflicts,
    handleConflictError,
    refreshConflicts,
    hasConflicts: conflicts.length > 0
  };
};

export default useConflictResolution;
