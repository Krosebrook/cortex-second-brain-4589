import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface OptimisticUpdate<T> {
  optimisticData: T;
  rollback: () => void;
}

export function useOptimistic<T>() {
  const [optimisticState, setOptimisticState] = useState<Map<string, T>>(new Map());

  const addOptimistic = useCallback((id: string, data: T): OptimisticUpdate<T> => {
    setOptimisticState(prev => new Map(prev).set(id, data));

    const rollback = () => {
      setOptimisticState(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      toast({
        title: 'Action failed',
        description: 'Changes have been reverted',
        variant: 'destructive',
      });
    };

    return {
      optimisticData: data,
      rollback,
    };
  }, []);

  const removeOptimistic = useCallback((id: string) => {
    setOptimisticState(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearOptimistic = useCallback(() => {
    setOptimisticState(new Map());
  }, []);

  return {
    optimisticState,
    addOptimistic,
    removeOptimistic,
    clearOptimistic,
  };
}
