import { useState, useEffect, useCallback } from 'react';
import { backgroundSync } from '@/lib/background-sync';

interface SyncStats {
  pending: number;
  completed: number;
  failed: number;
}

interface SyncState {
  isSyncing: boolean;
  isOnline: boolean;
  stats: SyncStats;
  lastSyncMessage: string | null;
}

/**
 * Hook for managing background sync state and operations
 */
export function useBackgroundSync() {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    isOnline: navigator.onLine,
    stats: { pending: 0, completed: 0, failed: 0 },
    lastSyncMessage: null,
  });

  // Update online status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to sync events
  useEffect(() => {
    const unsubscribe = backgroundSync.subscribe((event) => {
      setState(prev => ({
        ...prev,
        isSyncing: event.type === 'sync-start' || event.type === 'sync-progress',
        stats: {
          pending: event.pending,
          completed: event.completed,
          failed: event.failed,
        },
        lastSyncMessage: event.message || null,
      }));
    });

    // Get initial pending count
    backgroundSync.getPendingCount().then(count => {
      setState(prev => ({
        ...prev,
        stats: { ...prev.stats, pending: count }
      }));
    });

    return unsubscribe;
  }, []);

  // Queue a chat operation for sync
  const queueChatOperation = useCallback(
    async (operation: 'create' | 'update' | 'delete', data: any) => {
      await backgroundSync.queueOperation('chat', operation, data);
    },
    []
  );

  // Queue a knowledge operation for sync
  const queueKnowledgeOperation = useCallback(
    async (operation: 'create' | 'update' | 'delete', data: any) => {
      await backgroundSync.queueOperation('knowledge', operation, data);
    },
    []
  );

  // Force sync all pending operations
  const forceSync = useCallback(async () => {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }
    await backgroundSync.forceSync();
  }, []);

  // Get pending operation count
  const getPendingCount = useCallback(async () => {
    return backgroundSync.getPendingCount();
  }, []);

  return {
    ...state,
    queueChatOperation,
    queueKnowledgeOperation,
    forceSync,
    getPendingCount,
    hasPendingOperations: state.stats.pending > 0,
  };
}

export default useBackgroundSync;
