/**
 * Stores Service
 * Handles store operations with integrated API key access audit logging
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService, handleSupabaseResult, handleSupabaseArrayResult } from './base.service';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Store = Tables<'stores'>;
export type StoreInsert = TablesInsert<'stores'>;
export type StoreUpdate = TablesUpdate<'stores'>;

export interface StoreWithoutApiKey extends Omit<Store, 'api_key_encrypted'> {}

export interface SyncResult {
  success: boolean;
  results: Record<string, { synced: number; failed: number; errors: string[] }>;
  summary: { total_synced: number; total_failed: number };
}

export interface StoreService {
  getStores(): Promise<StoreWithoutApiKey[]>;
  getStore(storeId: string): Promise<StoreWithoutApiKey>;
  getStoreWithApiKey(storeId: string): Promise<Store>;
  createStore(store: Omit<StoreInsert, 'user_id'>): Promise<Store>;
  updateStore(storeId: string, updates: StoreUpdate): Promise<Store>;
  updateStoreApiKey(storeId: string, encryptedApiKey: string): Promise<Store>;
  deleteStore(storeId: string): Promise<void>;
  syncStore(storeId: string, syncTypes?: ('products' | 'orders' | 'customers' | 'inventory')[]): Promise<SyncResult>;
}

class StoresServiceImpl extends BaseService implements StoreService {
  constructor() {
    super('StoresService');
  }

  /**
   * Log API key access for audit trail
   */
  private async logAccess(
    storeId: string,
    accessType: 'view' | 'decrypt' | 'update' | 'create' | 'delete',
    metadata: Record<string, string | number | boolean | null> = {}
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_api_key_access', {
        p_store_id: storeId,
        p_access_type: accessType,
        p_metadata: metadata as unknown as Record<string, never>
      });

      if (error) {
        // Log error but don't throw - audit logging shouldn't break the main operation
        this.logError('logAccess', error);
      }
    } catch (err) {
      this.logError('logAccess', err);
    }
  }

  /**
   * Get all stores for the current user (without API keys for security)
   */
  async getStores(): Promise<StoreWithoutApiKey[]> {
    return this.executeWithRetry('getStores', async () => {
      const result = await supabase
        .from('stores')
        .select('id, user_id, platform, store_name, store_url, is_connected, last_sync_at, created_at, updated_at')
        .order('created_at', { ascending: false });

      return handleSupabaseArrayResult(result);
    });
  }

  /**
   * Get a specific store by ID (without API key)
   */
  async getStore(storeId: string): Promise<StoreWithoutApiKey> {
    return this.executeWithRetry('getStore', async () => {
      const result = await supabase
        .from('stores')
        .select('id, user_id, platform, store_name, store_url, is_connected, last_sync_at, created_at, updated_at')
        .eq('id', storeId)
        .single();

      return handleSupabaseResult(result);
    });
  }

  /**
   * Get a store with its API key (logs access for audit)
   */
  async getStoreWithApiKey(storeId: string): Promise<Store> {
    return this.executeWithRetry('getStoreWithApiKey', async () => {
      const result = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      const store = handleSupabaseResult(result);

      // Log API key access for audit trail
      await this.logAccess(storeId, 'decrypt', {
        operation: 'getStoreWithApiKey',
        has_api_key: !!store.api_key_encrypted
      });

      return store;
    });
  }

  /**
   * Create a new store
   */
  async createStore(store: Omit<StoreInsert, 'user_id'>): Promise<Store> {
    return this.executeWithRetry('createStore', async () => {
      const userId = await this.getCurrentUserId();

      const result = await supabase
        .from('stores')
        .insert({
          ...store,
          user_id: userId
        })
        .select()
        .single();

      const newStore = handleSupabaseResult(result);

      // Log store creation with API key
      if (store.api_key_encrypted) {
        await this.logAccess(newStore.id, 'create', {
          operation: 'createStore',
          platform: store.platform,
          store_name: store.store_name
        });
      }

      return newStore;
    });
  }

  /**
   * Update a store
   */
  async updateStore(storeId: string, updates: StoreUpdate): Promise<Store> {
    return this.executeWithRetry('updateStore', async () => {
      const result = await supabase
        .from('stores')
        .update(updates)
        .eq('id', storeId)
        .select()
        .single();

      const updatedStore = handleSupabaseResult(result);

      // Log if API key was updated
      if (updates.api_key_encrypted !== undefined) {
        await this.logAccess(storeId, 'update', {
          operation: 'updateStore',
          api_key_changed: true
        });
      }

      return updatedStore;
    });
  }

  /**
   * Update only the API key for a store
   */
  async updateStoreApiKey(storeId: string, encryptedApiKey: string): Promise<Store> {
    return this.executeWithRetry('updateStoreApiKey', async () => {
      const result = await supabase
        .from('stores')
        .update({ api_key_encrypted: encryptedApiKey })
        .eq('id', storeId)
        .select()
        .single();

      const updatedStore = handleSupabaseResult(result);

      // Log API key update
      await this.logAccess(storeId, 'update', {
        operation: 'updateStoreApiKey',
        api_key_rotated: true
      });

      return updatedStore;
    });
  }

  /**
   * Delete a store
   */
  async deleteStore(storeId: string): Promise<void> {
    return this.executeWithRetry('deleteStore', async () => {
      // Log deletion before actually deleting (since we can't log after)
      await this.logAccess(storeId, 'delete', {
        operation: 'deleteStore'
      });

      const result = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (result.error) {
        throw result.error;
      }
    });
  }

  /**
   * Sync store data from the e-commerce platform
   */
  async syncStore(
    storeId: string,
    syncTypes: ('products' | 'orders' | 'customers' | 'inventory')[] = ['products', 'orders', 'customers', 'inventory']
  ): Promise<{
    success: boolean;
    results: Record<string, { synced: number; failed: number; errors: string[] }>;
    summary: { total_synced: number; total_failed: number };
  }> {
    return this.executeWithRetry('syncStore', async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await supabase.functions.invoke('sync-store', {
        body: { storeId, syncTypes },
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    });
  }

  /**
   * Get sync logs for a store
   */
  async getSyncLogs(storeId: string, limit: number = 10): Promise<any[]> {
    return this.executeWithRetry('getSyncLogs', async () => {
      const result = await supabase
        .from('store_sync_logs')
        .select('*')
        .eq('store_id', storeId)
        .order('started_at', { ascending: false })
        .limit(limit);

      return handleSupabaseArrayResult(result);
    });
  }

  /**
   * Get synced products for a store
   */
  async getSyncedProducts(storeId: string): Promise<any[]> {
    return this.executeWithRetry('getSyncedProducts', async () => {
      const result = await supabase
        .from('synced_products')
        .select('*')
        .eq('store_id', storeId)
        .order('title');

      return handleSupabaseArrayResult(result);
    });
  }

  /**
   * Get synced orders for a store
   */
  async getSyncedOrders(storeId: string): Promise<any[]> {
    return this.executeWithRetry('getSyncedOrders', async () => {
      const result = await supabase
        .from('synced_orders')
        .select('*')
        .eq('store_id', storeId)
        .order('order_date', { ascending: false });

      return handleSupabaseArrayResult(result);
    });
  }

  /**
   * Get synced customers for a store
   */
  async getSyncedCustomers(storeId: string): Promise<any[]> {
    return this.executeWithRetry('getSyncedCustomers', async () => {
      const result = await supabase
        .from('synced_customers')
        .select('*')
        .eq('store_id', storeId)
        .order('last_name');

      return handleSupabaseArrayResult(result);
    });
  }

  /**
   * Check for unusual access patterns for the current user
   */
  async checkUnusualAccess(
    timeWindowMinutes: number = 60,
    accessThreshold: number = 20
  ): Promise<{
    is_unusual: boolean;
    access_count: number;
    unique_stores_accessed: number;
    first_access: string | null;
    last_access: string | null;
  } | null> {
    return this.executeWithRetry('checkUnusualAccess', async () => {
      const userId = await this.getCurrentUserId();

      const { data, error } = await supabase.rpc('detect_unusual_api_key_access', {
        p_user_id: userId,
        p_time_window_minutes: timeWindowMinutes,
        p_access_threshold: accessThreshold
      });

      if (error) {
        this.logError('checkUnusualAccess', error);
        return null;
      }

      return data?.[0] || null;
    });
  }
}

// Export singleton instance
export const StoresService = new StoresServiceImpl();
