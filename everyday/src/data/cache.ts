import Dexie, { type EntityTable } from 'dexie';

/**
 * The encrypted copy of the account's records on this device (IndexedDB), so the app
 * opens and works offline. Rows hold only ciphertext; they are decrypted into the
 * in-memory store after unlocking.
 */
export interface CachedRecord {
  /** Opaque id (HMAC of table and key). */
  id: string;
  iv: string;
  ct: string;
  /** When the change was made (ISO). The latest change wins. */
  updatedAt: string;
  deleted: boolean;
  /** 1 while the change has not reached the cloud yet. */
  dirty: 0 | 1;
}

export interface Meta {
  key: string;
  value: unknown;
}

export const cache = new Dexie('everyday-cache') as Dexie & {
  records: EntityTable<CachedRecord, 'id'>;
  meta: EntityTable<Meta, 'key'>;
};

cache.version(1).stores({
  records: 'id, dirty',
  meta: 'key',
});

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await cache.meta.get(key))?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown) {
  await cache.meta.put({ key, value });
}

/** Empty the cache, including keys. Used on sign out and delete. */
export async function wipeCache() {
  await cache.transaction('rw', cache.records, cache.meta, async () => {
    await cache.records.clear();
    await cache.meta.clear();
  });
}
