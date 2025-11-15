import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineStorage } from '@/lib/offline-storage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface OfflineContextType {
  isOffline: boolean;
  isOnline: boolean;
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

  useEffect(() => {
    offlineStorage.init().catch(error => {
      console.error('Failed to initialize offline storage:', error);
    });
  }, []);

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
    const interval = setInterval(checkPending, 10000);

    return () => clearInterval(interval);
  }, []);

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
          if (operation.retries >= 3) {
            console.warn(`Skipping operation ${operation.id} (too many retries)`);
            await offlineStorage.removeFromSyncQueue(operation.id);
            failCount++;
            continue;
          }

          if (operation.type === 'chat') {
            await syncChatOperation(operation);
          } else if (operation.type === 'knowledge') {
            await syncKnowledgeOperation(operation);
          }

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

      const remainingQueue = await offlineStorage.getSyncQueue();
      setHasPendingSync(remainingQueue.length > 0);
      setPendingCount(remainingQueue.length);
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Failed to sync pending changes');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncChatOperation = async (operation: any) => {
    const { operation: op, data } = operation;
    
    switch (op) {
      case 'create':
        await supabase.from('chats').insert(data);
        break;
      case 'update':
        await supabase.from('chats').update(data.updates).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('chats').delete().eq('id', data.id);
        break;
    }
  };

  const syncKnowledgeOperation = async (operation: any) => {
    const { operation: op, data } = operation;
    
    switch (op) {
      case 'create':
        await supabase.from('knowledge_base').insert(data);
        break;
      case 'update':
        await supabase.from('knowledge_base').update(data.updates).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('knowledge_base').delete().eq('id', data.id);
        break;
    }
  };

  const value: OfflineContextType = {
    isOffline: !isOnline,
    isOnline,
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
