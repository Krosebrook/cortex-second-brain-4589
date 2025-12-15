/**
 * useStores Hook
 * Manages store operations with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { StoresService, Store, StoreInsert, StoreUpdate, StoreWithoutApiKey, SyncResult } from '@/services/stores.service';
import { toast } from '@/hooks/use-toast';

export interface UseStoresReturn {
  // State
  stores: StoreWithoutApiKey[];
  selectedStore: Store | null;
  loading: boolean;
  error: Error | null;

  // Actions
  loadStores: () => Promise<void>;
  getStore: (storeId: string) => Promise<StoreWithoutApiKey | null>;
  getStoreWithApiKey: (storeId: string) => Promise<Store | null>;
  createStore: (store: Omit<StoreInsert, 'user_id'>) => Promise<Store | null>;
  updateStore: (storeId: string, updates: StoreUpdate) => Promise<Store | null>;
  updateStoreApiKey: (storeId: string, encryptedApiKey: string) => Promise<Store | null>;
  deleteStore: (storeId: string) => Promise<boolean>;
  syncStore: (storeId: string, syncTypes?: ('products' | 'orders' | 'customers' | 'inventory')[]) => Promise<SyncResult | null>;
  selectStore: (store: Store | null) => void;
  checkUnusualAccess: () => Promise<{
    is_unusual: boolean;
    access_count: number;
    unique_stores_accessed: number;
  } | null>;
  refreshStores: () => Promise<void>;
  getSyncLogs: (storeId: string) => Promise<any[] | null>;
  getSyncedProducts: (storeId: string) => Promise<any[] | null>;
  getSyncedOrders: (storeId: string) => Promise<any[] | null>;
  getSyncedCustomers: (storeId: string) => Promise<any[] | null>;
}

export function useStores(): UseStoresReturn {
  const [stores, setStores] = useState<StoreWithoutApiKey[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Helper to execute async actions with loading state
  const executeAction = useCallback(async <T,>(
    action: () => Promise<T>,
    showLoadingState = true
  ): Promise<T | null> => {
    if (showLoadingState) setLoading(true);
    setError(null);
    
    try {
      const result = await action();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, []);

  // Load all stores
  const loadStores = useCallback(async () => {
    await executeAction(async () => {
      const data = await StoresService.getStores();
      setStores(data);
      return data;
    });
  }, [executeAction]);

  // Get a single store (without API key)
  const getStore = useCallback(async (storeId: string): Promise<StoreWithoutApiKey | null> => {
    return executeAction(async () => {
      return await StoresService.getStore(storeId);
    });
  }, [executeAction]);

  // Get a store with API key (logs access for audit)
  const getStoreWithApiKey = useCallback(async (storeId: string): Promise<Store | null> => {
    return executeAction(async () => {
      const result = await StoresService.getStoreWithApiKey(storeId);
      setSelectedStore(result);
      return result;
    });
  }, [executeAction]);

  // Create a new store
  const createStore = useCallback(async (store: Omit<StoreInsert, 'user_id'>): Promise<Store | null> => {
    return executeAction(async () => {
      const result = await StoresService.createStore(store);
      if (result) {
        // Add to local state (without API key for security)
        const { api_key_encrypted, ...storeWithoutKey } = result;
        setStores(prev => [storeWithoutKey, ...prev]);
        toast({
          title: 'Store created',
          description: `${result.store_name} has been connected successfully.`
        });
      }
      return result;
    });
  }, [executeAction]);

  // Update a store
  const updateStore = useCallback(async (storeId: string, updates: StoreUpdate): Promise<Store | null> => {
    return executeAction(async () => {
      const result = await StoresService.updateStore(storeId, updates);
      if (result) {
        // Update local state
        const { api_key_encrypted, ...storeWithoutKey } = result;
        setStores(prev => prev.map(s => s.id === storeId ? storeWithoutKey : s));
        
        // Update selected store if it's the same
        if (selectedStore?.id === storeId) {
          setSelectedStore(result);
        }
        
        toast({
          title: 'Store updated',
          description: `${result.store_name} has been updated.`
        });
      }
      return result;
    });
  }, [executeAction, selectedStore?.id]);

  // Update store API key
  const updateStoreApiKey = useCallback(async (storeId: string, encryptedApiKey: string): Promise<Store | null> => {
    return executeAction(async () => {
      const result = await StoresService.updateStoreApiKey(storeId, encryptedApiKey);
      if (result) {
        // Update selected store if it's the same
        if (selectedStore?.id === storeId) {
          setSelectedStore(result);
        }
        
        toast({
          title: 'API key updated',
          description: 'Your store API key has been rotated successfully.'
        });
      }
      return result;
    });
  }, [executeAction, selectedStore?.id]);

  // Delete a store
  const deleteStore = useCallback(async (storeId: string): Promise<boolean> => {
    const result = await executeAction(async () => {
      await StoresService.deleteStore(storeId);
      
      // Remove from local state
      setStores(prev => prev.filter(s => s.id !== storeId));
      
      // Clear selected store if it was deleted
      if (selectedStore?.id === storeId) {
        setSelectedStore(null);
      }
      
      toast({
        title: 'Store deleted',
        description: 'The store has been disconnected and removed.'
      });
      
      return true;
    });
    
    return result === true;
  }, [executeAction, selectedStore?.id]);

  // Sync a store with real e-commerce platform data
  const syncStore = useCallback(async (
    storeId: string,
    syncTypes?: ('products' | 'orders' | 'customers' | 'inventory')[]
  ): Promise<SyncResult | null> => {
    return executeAction(async () => {
      const result = await StoresService.syncStore(storeId, syncTypes);
      
      // Refresh stores to get updated last_sync_at
      await loadStores();
      
      if (result.success) {
        toast({
          title: 'Sync completed',
          description: `Synced ${result.summary.total_synced} items${result.summary.total_failed > 0 ? `, ${result.summary.total_failed} failed` : ''}.`
        });
      } else {
        toast({
          title: 'Sync completed with errors',
          description: `${result.summary.total_failed} items failed to sync.`,
          variant: 'destructive'
        });
      }
      
      return result;
    });
  }, [executeAction, loadStores]);

  // Get sync logs for a store
  const getSyncLogs = useCallback(async (storeId: string): Promise<any[] | null> => {
    return executeAction(async () => {
      return await StoresService.getSyncLogs(storeId);
    }, false);
  }, [executeAction]);

  // Get synced products for a store
  const getSyncedProducts = useCallback(async (storeId: string): Promise<any[] | null> => {
    return executeAction(async () => {
      return await StoresService.getSyncedProducts(storeId);
    }, false);
  }, [executeAction]);

  // Get synced orders for a store
  const getSyncedOrders = useCallback(async (storeId: string): Promise<any[] | null> => {
    return executeAction(async () => {
      return await StoresService.getSyncedOrders(storeId);
    }, false);
  }, [executeAction]);

  // Get synced customers for a store
  const getSyncedCustomers = useCallback(async (storeId: string): Promise<any[] | null> => {
    return executeAction(async () => {
      return await StoresService.getSyncedCustomers(storeId);
    }, false);
  }, [executeAction]);

  // Select a store
  const selectStore = useCallback((store: Store | null) => {
    setSelectedStore(store);
  }, []);

  // Check for unusual access patterns
  const checkUnusualAccess = useCallback(async () => {
    return executeAction(async () => {
      const data = await StoresService.checkUnusualAccess();
      if (data) {
        const result = {
          is_unusual: data.is_unusual,
          access_count: Number(data.access_count),
          unique_stores_accessed: Number(data.unique_stores_accessed)
        };
        
        // Alert if unusual access detected
        if (result.is_unusual) {
          toast({
            title: 'Security Alert',
            description: `Unusual API key access pattern detected: ${result.access_count} accesses in the last hour.`,
            variant: 'destructive'
          });
        }
        
        return result;
      }
      return null;
    }, false);
  }, [executeAction]);

  // Alias for loadStores
  const refreshStores = loadStores;

  // Load stores on mount
  useEffect(() => {
    loadStores();
  }, [loadStores]);

  return {
    stores,
    selectedStore,
    loading,
    error,
    loadStores,
    getStore,
    getStoreWithApiKey,
    createStore,
    updateStore,
    updateStoreApiKey,
    deleteStore,
    syncStore,
    selectStore,
    checkUnusualAccess,
    refreshStores,
    getSyncLogs,
    getSyncedProducts,
    getSyncedOrders,
    getSyncedCustomers
  };
}
