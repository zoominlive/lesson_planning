import dotenv from 'dotenv';

// Load environment variables from .env.local first
dotenv.config({ path: '.env.local' });

// Always use PostgreSQL
const DB_TYPE = 'postgresql';

console.log('[Storage] Using PostgreSQL storage');

let storageInstance: any = null;
let initPromise: Promise<any> | null = null;

async function initPostgreSQLStorage() {
  console.log('[Storage] Initializing PostgreSQL storage...');
  // Use the existing DatabaseStorage from storage.ts
  const { storage } = await import('./storage');
  storageInstance = storage;
  console.log('[Storage] PostgreSQL storage initialized');
  return storageInstance;
}

// Initialize the storage
async function getStorageInstance() {
  if (storageInstance) {
    return storageInstance;
  }
  
  if (!initPromise) {
    initPromise = initPostgreSQLStorage();
  }
  
  return await initPromise;
}

// Export a proxy object that delegates all calls to the appropriate storage
export const storage = new Proxy({} as any, {
  get(target, prop) {
    if (!storageInstance && initPromise) {
      // Storage is still initializing
      return async (...args: any[]) => {
        const instance = await getStorageInstance();
        return (instance as any)[prop](...args);
      };
    }
    
    if (!storageInstance) {
      // First access - start initialization
      getStorageInstance().catch(console.error);
      return async (...args: any[]) => {
        const instance = await getStorageInstance();
        return (instance as any)[prop](...args);
      };
    }
    
    // Storage is ready - use it directly
    return (storageInstance as any)[prop];
  }
});

// Initialize PostgreSQL storage when module loads
console.log('[Storage] PostgreSQL storage will be initialized on first use');