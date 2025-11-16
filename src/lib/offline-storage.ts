import { cacheManager } from './cache-manager';

// IndexedDB wrapper for offline storage
const DB_NAME = 'tessa_offline_db';
const DB_VERSION = 1;
const CHATS_STORE = 'chats';
const KNOWLEDGE_STORE = 'knowledge';
const SYNC_QUEUE_STORE = 'sync_queue';

interface SyncOperation {
  id: string;
  type: 'chat' | 'knowledge';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(CHATS_STORE)) {
          db.createObjectStore(CHATS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(KNOWLEDGE_STORE)) {
          db.createObjectStore(KNOWLEDGE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Cache operations
  async saveToCache(storeName: string, data: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFromCache<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFromCache<T>(storeName: string): Promise<T[]> {
    // Check memory cache first
    const cacheKey = storeName === CHATS_STORE ? 'chats' : storeName === KNOWLEDGE_STORE ? 'knowledge' : null;
    if (cacheKey) {
      const cached = cacheManager.get<T[]>(cacheKey);
      if (cached) return cached;
    }

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result || [];
        // Store in memory cache
        if (cacheKey && result.length > 0) {
          cacheManager.set(cacheKey, result);
        }
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFromCache(storeName: string, key: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearCache(storeName?: string): Promise<void> {
    const db = await this.ensureDB();
    const stores = storeName ? [storeName] : [CHATS_STORE, KNOWLEDGE_STORE, SYNC_QUEUE_STORE];
    
    return Promise.all(
      stores.map(store => 
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([store], 'readwrite');
          const objectStore = transaction.objectStore(store);
          const request = objectStore.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      )
    ).then(() => {});
  }

  // Chat-specific operations
  async storeChats(chats: any[]): Promise<void> {
    const promises = chats.map(chat => this.saveToCache(CHATS_STORE, chat));
    await Promise.all(promises);
  }

  async getChats(): Promise<any[]> {
    return this.getAllFromCache(CHATS_STORE);
  }

  // Knowledge-specific operations
  async storeKnowledge(items: any[]): Promise<void> {
    const promises = items.map(item => this.saveToCache(KNOWLEDGE_STORE, item));
    await Promise.all(promises);
  }

  async getKnowledge(): Promise<any[]> {
    return this.getAllFromCache(KNOWLEDGE_STORE);
  }
  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const syncOp: SyncOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };
    return this.saveToCache(SYNC_QUEUE_STORE, syncOp);
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    return this.getAllFromCache<SyncOperation>(SYNC_QUEUE_STORE);
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    return this.deleteFromCache(SYNC_QUEUE_STORE, id);
  }

  async incrementRetries(id: string): Promise<void> {
    const operation = await this.getFromCache<SyncOperation>(SYNC_QUEUE_STORE, id);
    if (operation) {
      operation.retries++;
      await this.saveToCache(SYNC_QUEUE_STORE, operation);
    }
  }

  async getCacheTimestamp(storeName: string, key: string): Promise<number | null> {
    const data = await this.getFromCache<any>(storeName, key);
    return data?.cachedAt || null;
  }

  // Store name constants
  get stores() {
    return {
      CHATS: CHATS_STORE,
      KNOWLEDGE: KNOWLEDGE_STORE,
      SYNC_QUEUE: SYNC_QUEUE_STORE,
    };
  }
}

export const offlineStorage = new OfflineStorage();
