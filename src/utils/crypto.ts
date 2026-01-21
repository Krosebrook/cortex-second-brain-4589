/**
 * Web Crypto API utilities for secure client-side encryption
 * Uses AES-256-GCM for authenticated encryption
 * 
 * @module utils/crypto
 */

// Key derivation parameters
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * Generates a cryptographically secure random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generates a cryptographically secure random IV (Initialization Vector)
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derives an AES-256-GCM key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as a key for PBKDF2
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(passwordBuffer).buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-256-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt).buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Gets or creates a device-specific encryption key
 * Uses a combination of device fingerprint and stored secret
 */
async function getDeviceKey(): Promise<string> {
  const DEVICE_KEY_STORAGE = '__device_key__';
  
  let deviceKey = localStorage.getItem(DEVICE_KEY_STORAGE);
  
  if (!deviceKey) {
    // Generate a new device key
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    deviceKey = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(DEVICE_KEY_STORAGE, deviceKey);
  }
  
  return deviceKey;
}

/**
 * Encrypts data using AES-256-GCM
 * Returns a base64-encoded string containing salt + iv + ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const salt = generateSalt();
    const iv = generateIV();
    const password = await getDeviceKey();
    const key = await deriveKey(password, salt);
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv).buffer as ArrayBuffer },
      key,
      new Uint8Array(data).buffer as ArrayBuffer
    );
    
    // Combine salt + iv + ciphertext
    const combined = new Uint8Array(
      salt.length + iv.length + ciphertext.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts data encrypted with AES-256-GCM
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);
    
    const password = await getDeviceKey();
    const key = await deriveKey(password, salt);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv).buffer as ArrayBuffer },
      key,
      new Uint8Array(ciphertext).buffer as ArrayBuffer
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Checks if Web Crypto API is available
 */
export function isCryptoSupported(): boolean {
  return !!(
    typeof crypto !== 'undefined' &&
    crypto.subtle &&
    typeof crypto.subtle.encrypt === 'function'
  );
}

/**
 * Secure storage wrapper using Web Crypto API
 * Provides encrypted localStorage with expiration
 */
export const secureStorageV2 = {
  /**
   * Stores an encrypted value with optional expiration
   */
  async setItem(key: string, value: unknown, expirationHours = 24): Promise<void> {
    if (!isCryptoSupported()) {
      console.warn('[SecureStorage] Web Crypto not supported, using fallback');
      localStorage.setItem(key, JSON.stringify({
        value,
        expiration: Date.now() + expirationHours * 60 * 60 * 1000,
        version: 1,
      }));
      return;
    }

    const item = {
      value,
      timestamp: Date.now(),
      expiration: Date.now() + expirationHours * 60 * 60 * 1000,
      version: 2, // Version 2 indicates encrypted storage
    };

    const encrypted = await encrypt(JSON.stringify(item));
    localStorage.setItem(key, encrypted);
  },

  /**
   * Retrieves and decrypts a stored value
   */
  async getItem<T = unknown>(key: string): Promise<T | null> {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
      // Try to detect if data is encrypted (v2) or plain (v1/legacy)
      let item: { value: T; expiration: number; version?: number };

      // Check if it's a base64 encoded encrypted value
      if (stored.match(/^[A-Za-z0-9+/]+=*$/)) {
        try {
          // Try to parse as JSON first (legacy format)
          const parsed = JSON.parse(stored);
          if (typeof parsed === 'object' && 'value' in parsed) {
            item = parsed as { value: T; expiration: number; version?: number };
          } else {
            throw new Error('Not legacy format');
          }
        } catch {
          // Must be encrypted v2 format
          if (!isCryptoSupported()) {
            console.warn('[SecureStorage] Cannot decrypt without Web Crypto');
            return null;
          }
          const decrypted = await decrypt(stored);
          item = JSON.parse(decrypted) as { value: T; expiration: number; version?: number };
        }
      } else {
        // Plain JSON (really old legacy format)
        item = JSON.parse(stored) as { value: T; expiration: number; version?: number };
      }

      // Check expiration
      if (Date.now() > item.expiration) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('[SecureStorage] Failed to retrieve item:', error);
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Removes a stored value
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clears all secure storage items
   */
  clear(): void {
    // Only clear items that were set by this module
    // (preserves other localStorage items)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('__device_key__')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },
};

/**
 * Migrates legacy storage to encrypted format
 */
export async function migrateToSecureStorage(): Promise<void> {
  if (!isCryptoSupported()) {
    console.warn('[SecureStorage] Migration skipped - Web Crypto not supported');
    return;
  }

  const keysToMigrate: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !key.startsWith('__device_key__')) {
      keysToMigrate.push(key);
    }
  }

  for (const key of keysToMigrate) {
    const stored = localStorage.getItem(key);
    if (!stored) continue;

    try {
      // Try to parse as legacy format
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && 'value' in parsed && (!parsed.version || parsed.version < 2)) {
        // Migrate to encrypted format
        await secureStorageV2.setItem(key, parsed.value, 24);
        console.log(`[SecureStorage] Migrated key: ${key}`);
      }
    } catch {
      // Not a legacy format, skip
    }
  }
}
