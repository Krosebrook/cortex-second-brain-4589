import { supabase } from '@/integrations/supabase/client';
import { Conflict, ConflictError } from '@/types/conflict';

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
        return {
          type: 'delete',
          actionId,
          itemId,
          expected: { version: expectedVersion },
          actual: null,
          timestamp: Date.now(),
        };
      }

      // For knowledge_base, check version; for chats, check updated_at
      const currentVersion = table === 'knowledge_base'
        ? (currentState as any).version ?? 0
        : 0;

      if (currentVersion !== expectedVersion && table === 'knowledge_base') {
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

      return null;
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
    const updatePayload = updates as Record<string, unknown>;
    let result: any;
    
    if (table === 'knowledge_base') {
      result = await (supabase as any)
        .from(table)
        .update(updatePayload)
        .eq('id', id)
        .eq('version', expectedVersion)
        .select()
        .single();
    } else {
      result = await (supabase as any)
        .from(table)
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
    }

    const { data, error } = result;

    if (error || !data) {
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

    const canMerge = differences.length > 0 && differences.length < 3;
    return { differences, canMerge };
  }
}
