import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineStorage } from '@/lib/offline-storage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface OfflineContextType {
  isOffline: boolean;
  hasPendingSync: boolean;
  syncPendingOperations: () => Promise<void>;
  isSyncing: boolean;
  pendingCount: number;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { isOnline, wasOffline } = useNetworkStatus();
  const { user } = useAuth();

  // Initialize offline storage
  useEffect(() => {
    offlineStorage.init().catch(error => {
      console.error('Failed to initialize offline storage:', error);
    });
  }, []);

  // Check for pending operations
  useEffect(() => {
    const checkPending = async () => {
      try {
        const queue = await offlineStorage.getSyncQueue();
        setHasPendingSync(queue.length > 0);
        setPendingCount(queue.length);
      } catch (error) {
        console.error('Error checking pending operations:', error);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && hasPendingSync && user) {
      console.log('Connection restored, syncing pending operations...');
      toast.info('Back online! Syncing your changes...');
      syncPendingOperations();
    }
  }, [isOnline, wasOffline, hasPendingSync, user]);

  const syncPendingOperations = async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    console.log('Starting sync of pending operations...');

    try {
      const queue = await offlineStorage.getSyncQueue();
      console.log(`Syncing ${queue.length} pending operations`);

      let successCount = 0;
      let failCount = 0;

      for (const operation of queue) {
        try {
          // Skip operations with too many retries
          if (operation.retries >= 3) {
            console.warn(`Skipping operation ${operation.id} (too many retries)`);
            await offlineStorage.removeFromSyncQueue(operation.id);
            failCount++;
            continue;
          }

          // Execute the operation based on type
          if (operation.type === 'chat') {
            await syncChatOperation(operation);
          } else if (operation.type === 'knowledge') {
            await syncKnowledgeOperation(operation);
          }

          // Remove from queue on success
          await offlineStorage.removeFromSyncQueue(operation.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          await offlineStorage.incrementRetries(operation.id);
          failCount++;
        }
      }

      console.log(`Sync complete: ${successCount} succeeded, ${failCount} failed`);

      if (successCount > 0) {
        toast.success(`Synced ${successCount} ${successCount === 1 ? 'change' : 'changes'}`);
      }

      if (failCount > 0) {
        toast.error(`Failed to sync ${failCount} ${failCount === 1 ? 'change' : 'changes'}`);
      }

      // Update pending state
      const remainingQueue = await offlineStorage.getSyncQueue();
      setHasPendingSync(remainingQueue.length > 0);
      setPendingCount(remainingQueue.length);
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Failed to sync changes. Will retry automatically.');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncChatOperation = async (operation: any) => {
    const { operation: op, data } = operation;

    if (op === 'create') {
      await supabase.from('chats').insert(data);
    } else if (op === 'update') {
      await supabase.from('chats').update(data).eq('id', data.id);
    } else if (op === 'delete') {
      await supabase.from('chats').delete().eq('id', data.id);
    }
  };

  const syncKnowledgeOperation = async (operation: any) => {
    const { operation: op, data } = operation;

    if (op === 'create') {
      await supabase.from('knowledge_base').insert(data);
    } else if (op === 'update') {
      await supabase.from('knowledge_base').update(data).eq('id', data.id);
    } else if (op === 'delete') {
      await supabase.from('knowledge_base').delete().eq('id', data.id);
    }
  };

  const value = {
    isOffline: !isOnline,
    hasPendingSync,
    syncPendingOperations,
    isSyncing,
    pendingCount,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
