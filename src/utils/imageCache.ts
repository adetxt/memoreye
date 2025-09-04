// IndexedDB-based image cache for persistent thumbnail storage

interface CachedImageData {
  url: string;
  thumbnails: {
    small: string;
    medium: string;
    large: string;
  };
  aspectRatio: number;
  size: { width: number; height: number };
  timestamp: number;
  fileSize?: number;
}

class ImageCacheDB {
  private dbName = 'memoreye-image-cache';
  private version = 1;
  private storeName = 'thumbnails';
  private db: IDBDatabase | null = null;
  private maxCacheSize = 100 * 1024 * 1024; // 100MB cache limit
  private maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  async init(): Promise<void> {
    return new Promise((resolve, _reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        _reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async get(url: string): Promise<CachedImageData | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);

      request.onerror = () => {
        console.error('Failed to get cached image:', request.error);
        resolve(null);
      };

      request.onsuccess = () => {
        const result = request.result as CachedImageData;
        
        // Check if cache entry is expired
        if (result && Date.now() - result.timestamp > this.maxAge) {
          this.delete(url); // Clean up expired entry
          resolve(null);
          return;
        }
        
        resolve(result || null);
      };
    });
  }

  async set(url: string, data: Omit<CachedImageData, 'url' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();

    // Calculate approximate size of thumbnails
    const estimatedSize = this.estimateDataSize(data.thumbnails);
    
    const cacheData: CachedImageData = {
      url,
      ...data,
      timestamp: Date.now(),
      fileSize: estimatedSize,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(cacheData);

      request.onerror = () => {
        console.error('Failed to cache image:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
        // Check cache size and clean up if necessary
        this.cleanupIfNeeded();
      };
    });
  }

  async delete(url: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(url);

      request.onerror = () => {
        console.error('Failed to delete cached image:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => {
        console.error('Failed to clear cache:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => {
        console.error('Failed to get cache size:', request.error);
        resolve(0);
      };

      request.onsuccess = () => {
        const results = request.result as CachedImageData[];
        const totalSize = results.reduce((sum, item) => sum + (item.fileSize || 0), 0);
        resolve(totalSize);
      };
    });
  }

  private async cleanupIfNeeded(): Promise<void> {
    const currentSize = await this.getCacheSize();
    
    if (currentSize > this.maxCacheSize) {
      await this.cleanupOldEntries();
    }
  }

  private async cleanupOldEntries(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor();

      const entriesToDelete: string[] = [];
      let deletedSize = 0;
      const targetReduction = this.maxCacheSize * 0.3; // Remove 30% of cache

      request.onerror = () => {
        console.error('Failed to cleanup cache:', request.error);
        resolve();
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor && deletedSize < targetReduction) {
          const data = cursor.value as CachedImageData;
          entriesToDelete.push(data.url);
          deletedSize += data.fileSize || 0;
          cursor.continue();
        } else {
          // Delete collected entries
          Promise.all(
            entriesToDelete.map(url => this.delete(url))
          ).then(() => {
            console.log(`Cleaned up ${entriesToDelete.length} cache entries`);
            resolve();
          }).catch(() => {
            console.error('Failed to delete some cache entries');
            resolve(); // Still resolve to prevent hanging
          });
        }
      };
    });
  }

  private estimateDataSize(thumbnails: { small: string; medium: string; large: string }): number {
    // Rough estimation: base64 data URL size
    const smallSize = thumbnails.small.length * 0.75; // base64 is ~75% of actual size
    const mediumSize = thumbnails.medium.length * 0.75;
    const largeSize = thumbnails.large.length * 0.75;
    
    return smallSize + mediumSize + largeSize;
  }
}

// Singleton instance
export const imageCacheDB = new ImageCacheDB();

// Initialize on first import
imageCacheDB.init().catch(console.error);

// Export utility functions
export const getCachedImageFromDB = async (url: string): Promise<CachedImageData | null> => {
  try {
    return await imageCacheDB.get(url);
  } catch (error) {
    console.error('Error getting cached image:', error);
    return null;
  }
};

export const setCachedImageToDB = async (
  url: string, 
  data: Omit<CachedImageData, 'url' | 'timestamp'>
): Promise<void> => {
  try {
    await imageCacheDB.set(url, data);
  } catch (error) {
    console.error('Error caching image:', error);
  }
};

export const clearImageCacheDB = async (): Promise<void> => {
  try {
    await imageCacheDB.clear();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export const getCacheSizeDB = async (): Promise<number> => {
  try {
    return await imageCacheDB.getCacheSize();
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};