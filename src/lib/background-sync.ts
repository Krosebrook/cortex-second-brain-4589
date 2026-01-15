import { offlineStorage } from './offline-storage';
import { supabase } from '@/integrations/supabase/client';

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

interface SyncResult {
  success: boolean;
  operationId: string;
  error?: string;
}

type SyncEventType = 'sync-start' | 'sync-complete' | 'sync-error' | 'sync-progress';

interface SyncEventDetail {
  type: SyncEventType;
  pending: number;
  completed: number;
  failed: number;
  message?: string;
}

class BackgroundSyncManager {
  private isSyncing = false;
  private syncTimeout: NodeJS.Timeout | null = null;
  private listeners: Set<(event: SyncEventDetail) => void> = new Set();
  private stats = { pending: 0, completed: 0, failed: 0 };

  /**
   * Initialize background sync
   */
  async init(): Promise<void> {
    // Initialize offline storage
    await offlineStorage.init();

    // Listen for online events
    window.addEventListener('online', () => this.onOnline());

    // Check for pending operations on init
    if (navigator.onLine) {
      setTimeout(() => this.processSyncQueue(), 1000);
    }

    // Register service worker sync if available
    this.registerServiceWorkerSync();

    console.log('[BackgroundSync] Initialized');
  }

  /**
   * Register service worker background sync
   */
  private async registerServiceWorkerSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // TypeScript doesn't have full types for Background Sync API
        await (registration as any).sync.register('cortex-sync');
        console.log('[BackgroundSync] Service worker sync registered');
      } catch (error) {
        console.warn('[BackgroundSync] Service worker sync registration failed:', error);
      }
    }
  }

  /**
   * Handle coming back online
   */
  private onOnline(): void {
    console.log('[BackgroundSync] Device came online, processing sync queue...');
    this.emit({ type: 'sync-start', ...this.stats, message: 'Device online, syncing...' });
    this.processSyncQueue();
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(
    type: 'chat' | 'knowledge',
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    await offlineStorage.addToSyncQueue({ type, operation, data });
    this.stats.pending++;
    this.emit({ type: 'sync-progress', ...this.stats });

    // If online, try to sync immediately
    if (navigator.onLine) {
      this.scheduleSyncQueue();
    }
  }

  /**
   * Schedule sync queue processing with debounce
   */
  private scheduleSyncQueue(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.syncTimeout = setTimeout(() => this.processSyncQueue(), 500);
  }

  /**
   * Process all pending sync operations
   */
  async processSyncQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    const queue = await offlineStorage.getSyncQueue();

    if (queue.length === 0) {
      this.isSyncing = false;
      return;
    }

    this.stats.pending = queue.length;
    this.emit({ type: 'sync-start', ...this.stats, message: `Syncing ${queue.length} operation(s)...` });

    const results: SyncResult[] = [];

    for (const operation of queue) {
      try {
        const result = await this.processOperation(operation);
        results.push(result);

        if (result.success) {
          await offlineStorage.removeFromSyncQueue(operation.id);
          this.stats.completed++;
          this.stats.pending--;
        } else {
          if (operation.retries < MAX_RETRIES) {
            await offlineStorage.incrementRetries(operation.id);
            // Schedule retry with exponential backoff
            const delay = RETRY_DELAYS[operation.retries] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            setTimeout(() => this.processSyncQueue(), delay);
          } else {
            // Max retries exceeded, remove from queue
            await offlineStorage.removeFromSyncQueue(operation.id);
            this.stats.failed++;
            this.stats.pending--;
            console.error(`[BackgroundSync] Operation ${operation.id} failed after max retries`);
          }
        }

        this.emit({ type: 'sync-progress', ...this.stats });
      } catch (error) {
        console.error(`[BackgroundSync] Error processing operation ${operation.id}:`, error);
        this.stats.failed++;
        this.emit({ type: 'sync-error', ...this.stats, message: String(error) });
      }
    }

    this.isSyncing = false;

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    this.emit({
      type: 'sync-complete',
      ...this.stats,
      message: `Sync complete: ${successCount} succeeded, ${failCount} failed`
    });

    console.log(`[BackgroundSync] Completed: ${successCount} succeeded, ${failCount} failed`);
  }

  /**
   * Process a single sync operation
   */
  private async processOperation(operation: {
    id: string;
    type: 'chat' | 'knowledge';
    operation: 'create' | 'update' | 'delete';
    data: any;
  }): Promise<SyncResult> {
    try {
      switch (operation.type) {
        case 'chat':
          return await this.syncChatOperation(operation);
        case 'knowledge':
          return await this.syncKnowledgeOperation(operation);
        default:
          return { success: false, operationId: operation.id, error: 'Unknown operation type' };
      }
    } catch (error) {
      return { success: false, operationId: operation.id, error: String(error) };
    }
  }

  /**
   * Sync chat operations
   */
  private async syncChatOperation(operation: {
    id: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
  }): Promise<SyncResult> {
    const { operation: op, data, id } = operation;

    switch (op) {
      case 'create': {
        const { error } = await supabase.from('chats').insert(data);
        if (error) throw error;
        return { success: true, operationId: id };
      }
      case 'update': {
        const { error } = await supabase
          .from('chats')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
        return { success: true, operationId: id };
      }
      case 'delete': {
        const { error } = await supabase
          .from('chats')
          .delete()
          .eq('id', data.id);
        if (error) throw error;
        return { success: true, operationId: id };
      }
      default:
        return { success: false, operationId: id, error: 'Unknown operation' };
    }
  }

  /**
   * Sync knowledge operations
   */
  private async syncKnowledgeOperation(operation: {
    id: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
  }): Promise<SyncResult> {
    const { operation: op, data, id } = operation;

    switch (op) {
      case 'create': {
        const { error } = await supabase.from('knowledge_base').insert(data);
        if (error) throw error;
        return { success: true, operationId: id };
      }
      case 'update': {
        const { error } = await supabase
          .from('knowledge_base')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
        return { success: true, operationId: id };
      }
      case 'delete': {
        const { error } = await supabase
          .from('knowledge_base')
          .delete()
          .eq('id', data.id);
        if (error) throw error;
        return { success: true, operationId: id };
      }
      default:
        return { success: false, operationId: id, error: 'Unknown operation' };
    }
  }

  /**
   * Subscribe to sync events
   */
  subscribe(callback: (event: SyncEventDetail) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Emit sync event to all listeners
   */
  private emit(detail: SyncEventDetail): void {
    this.listeners.forEach(callback => callback(detail));
  }

  /**
   * Get current sync status
   */
  getStatus(): { isSyncing: boolean; stats: typeof this.stats } {
    return {
      isSyncing: this.isSyncing,
      stats: { ...this.stats }
    };
  }

  /**
   * Force sync all pending operations
   */
  async forceSync(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }
    await this.processSyncQueue();
  }

  /**
   * Get pending operation count
   */
  async getPendingCount(): Promise<number> {
    const queue = await offlineStorage.getSyncQueue();
    return queue.length;
  }
}

export const backgroundSync = new BackgroundSyncManager();

// Hook for using background sync in components
export const useBackgroundSync = () => {
  return {
    queueOperation: backgroundSync.queueOperation.bind(backgroundSync),
    forceSync: backgroundSync.forceSync.bind(backgroundSync),
    subscribe: backgroundSync.subscribe.bind(backgroundSync),
    getStatus: backgroundSync.getStatus.bind(backgroundSync),
    getPendingCount: backgroundSync.getPendingCount.bind(backgroundSync),
  };
};
