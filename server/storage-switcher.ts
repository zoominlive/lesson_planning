import dotenv from 'dotenv';

// Load environment variables from .env.local first
dotenv.config({ path: '.env.local' });

// Check DB_TYPE from environment
const DB_TYPE = process.env.DB_TYPE || 'postgresql';

console.log('[Storage] DB_TYPE set to:', DB_TYPE);

let storageInstance: any = null;
let initPromise: Promise<any> | null = null;

async function initMySQLStorage() {
  console.log('[Storage] Initializing MySQL storage...');
  const { MySQLStorage } = await import('./mysql-storage');
  const { initMySQLDatabase } = await import('./mysql-db');
  
  const db = await initMySQLDatabase();
  storageInstance = new MySQLStorage(db);
  
  console.log('[Storage] MySQL storage initialized');
  return storageInstance;
}

async function initPostgreSQLStorage() {
  console.log('[Storage] Initializing PostgreSQL storage...');
  // Use the existing DatabaseStorage from storage.ts
  const { storage } = await import('./storage');
  storageInstance = storage;
  console.log('[Storage] PostgreSQL storage initialized');
  return storageInstance;
}

// Initialize the appropriate storage
async function getStorageInstance() {
  if (storageInstance) {
    return storageInstance;
  }
  
  if (!initPromise) {
    if (DB_TYPE === 'mysql') {
      initPromise = initMySQLStorage();
    } else {
      initPromise = initPostgreSQLStorage();
    }
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

// Initialize storage immediately when module loads
if (DB_TYPE === 'mysql') {
  console.log('[Storage] Starting MySQL storage initialization...');
  getStorageInstance().catch(console.error);
} else {
  console.log('[Storage] Will use PostgreSQL storage');
  // PostgreSQL will be initialized lazily when first accessed
}