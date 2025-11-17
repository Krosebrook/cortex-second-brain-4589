import { supabase } from '@/integrations/supabase/client';
import { Conflict, ConflictError, ConflictType } from '@/types/conflict';

export class ConflictResolver {
  static async detectConflict(
    table: 'knowledge_base' | 'chats',
    itemId: string,
    expectedVersion: number,
    actionId: string
  ): Promise<Conflict | null> {
    try {
      const { data: currentState, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !currentState) {
        // Item doesn't exist - delete conflict
        return {
          type: 'delete',
          actionId,
          itemId,
          expected: { version: expectedVersion },
          actual: null,
          timestamp: Date.now(),
        };
      }

      // Check version (optimistic locking)
      if (currentState.version !== expectedVersion) {
        // Item was updated - update conflict
        return {
          type: 'update',
          actionId,
          itemId,
          itemTitle: currentState.title,
          expected: { version: expectedVersion },
          actual: currentState,
          timestamp: Date.now(),
        };
      }

      return null; // No conflict
    } catch (error) {
      console.error('Error detecting conflict:', error);
      return null;
    }
  }

  static async updateWithVersionCheck<T>(
    table: 'knowledge_base' | 'chats',
    id: string,
    updates: Partial<T>,
    expectedVersion: number,
    actionId: string
  ): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .eq('version', expectedVersion)
      .select()
      .single();

    if (error || !data) {
      // Detect what kind of conflict occurred
      const conflict = await this.detectConflict(table, id, expectedVersion, actionId);
      if (conflict) {
        throw new ConflictError(conflict);
      }
      throw error;
    }

    return data as T;
  }

  static compareStates(expected: any, actual: any): { differences: string[]; canMerge: boolean } {
    const differences: string[] = [];
    
    if (!actual) {
      return { differences: ['Item was deleted'], canMerge: false };
    }

    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    
    for (const key of keys) {
      if (key === 'version' || key === 'updated_at') continue;
      
      if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
        differences.push(key);
      }
    }

    // Can merge if only non-conflicting fields changed
    const canMerge = differences.length > 0 && differences.length < 3;

    return { differences, canMerge };
  }
}
