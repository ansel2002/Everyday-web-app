import { useSyncExternalStore } from 'react';
import { cache, getMeta, setMeta, type CachedRecord } from './cache';
import type { Cloud, RemoteRecord } from './cloud';
import { decryptJson, encryptJson, opaqueId } from './crypto';
import { dataKeys } from './keys';
import { store, type Change } from './store';
import type { TableName, Tables } from './types';

/**
 * Keeps three copies in step: the decrypted store in memory, the encrypted cache
 * on this device, and the encrypted records in the cloud. The latest change wins.
 */

/** What is inside each encrypted record. */
interface Envelope {
  t: TableName;
  k: string;
  r: Tables[TableName] | null;
  u: string;
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

let state: SyncState = 'synced';
let lastSynced: string | null = null;
const listeners = new Set<() => void>();
let cloud: Cloud | null = null;
let timers: number[] = [];
let pushTimer: number | undefined;
let running: Promise<void> | null = null;
// Changes are encrypted one after another, so two quick edits of the same thing keep their order.
let writeQueue: Promise<void> = Promise.resolve();

const CURSOR = 'cursor';
/** Pull a little before the last cursor, in case a slower write landed just behind it. */
const OVERLAP_MS = 60_000;

function setState(next: SyncState) {
  state = next;
  if (next === 'synced') lastSynced = new Date().toISOString();
  listeners.forEach((fn) => fn());
}

export function useSyncState(): { state: SyncState; lastSynced: string | null } {
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => `${state}|${lastSynced}`,
  );
  return { state, lastSynced };
}

async function idFor(table: TableName, key: string) {
  return opaqueId(dataKeys().hmac, `${table}:${key}`);
}

/** Encrypt the app's own changes into the cache, then send them soon. */
function onLocalChanges(changes: Change[]) {
  writeQueue = writeQueue
    .then(async () => {
      const { aes } = dataKeys();
      const rows: CachedRecord[] = [];
      for (const change of changes) {
        const envelope: Envelope = { t: change.table, k: change.key, r: change.row, u: change.updatedAt };
        const sealed = await encryptJson(aes, envelope);
        rows.push({
          id: await idFor(change.table, change.key),
          ...sealed,
          updatedAt: change.updatedAt,
          deleted: change.row === null,
          dirty: 1,
        });
      }
      await cache.records.bulkPut(rows);
    })
    .catch((error) => console.error('Could not save a change', error));
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => void syncNow(), 1500);
}

/** Decrypt the cache into the store. Called once after unlocking. */
export async function loadFromCache() {
  const { aes } = dataKeys();
  const rows = await cache.records.toArray();
  const changes = [];
  for (const row of rows) {
    if (row.deleted) continue;
    try {
      const env = await decryptJson<Envelope>(aes, row);
      changes.push({ table: env.t, key: env.k, row: env.r });
    } catch {
      console.warn('Skipped a record that could not be decrypted');
    }
  }
  store.applyRemote(changes);
}

async function push() {
  await writeQueue;
  const dirty = await cache.records.where('dirty').equals(1).toArray();
  if (!dirty.length || !cloud) return;
  const rows: RemoteRecord[] = dirty.map((r) => ({ id: r.id, iv: r.iv, ct: r.ct, updated_at: r.updatedAt, deleted: r.deleted }));
  await cloud.pushRecords(rows);
  // Mark clean only if nothing changed while sending.
  await cache.transaction('rw', cache.records, async () => {
    for (const sent of dirty) {
      const now = await cache.records.get(sent.id);
      if (now && now.updatedAt === sent.updatedAt) await cache.records.update(sent.id, { dirty: 0 });
    }
  });
}

async function pull() {
  if (!cloud) return;
  const { aes } = dataKeys();
  const cursor = await getMeta<string>(CURSOR);
  const since = cursor ? new Date(new Date(cursor).getTime() - OVERLAP_MS).toISOString() : null;
  const remote = await cloud.pullRecords(since);
  const changes = [];
  const toCache: CachedRecord[] = [];
  let newest = cursor ?? null;
  for (const row of remote) {
    if (row.synced_at && (!newest || row.synced_at > newest)) newest = row.synced_at;
    const local = await cache.records.get(row.id);
    if (local && local.updatedAt >= row.updated_at) continue; // ours is the same or newer
    try {
      const env = await decryptJson<Envelope>(aes, row);
      changes.push({ table: env.t, key: env.k, row: row.deleted ? null : env.r });
      toCache.push({ id: row.id, iv: row.iv, ct: row.ct, updatedAt: row.updated_at, deleted: row.deleted, dirty: 0 });
    } catch {
      console.warn('Skipped a cloud record that could not be decrypted');
    }
  }
  await cache.records.bulkPut(toCache);
  store.applyRemote(changes);
  if (newest) await setMeta(CURSOR, newest);
}

/** Send local changes, then fetch new ones. Safe to call often. */
export function syncNow(): Promise<void> {
  if (running) return running;
  running = (async () => {
    if (!cloud) return;
    if (!navigator.onLine) return setState('offline');
    setState('syncing');
    try {
      await push();
      await pull();
      setState('synced');
    } catch (error) {
      console.warn('Sync paused', error);
      setState(navigator.onLine ? 'error' : 'offline');
    }
  })().finally(() => {
    running = null;
  });
  return running;
}

const onOnline = () => void syncNow();
const onVisible = () => {
  if (document.visibilityState === 'visible') void syncNow();
};

export function startSync(target: Cloud) {
  cloud = target;
  store.onChange(onLocalChanges);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', () => setState('offline'));
  document.addEventListener('visibilitychange', onVisible);
  timers.push(window.setInterval(() => void syncNow(), 60_000));
  void syncNow();
}

/** Stop syncing (sign out). Sends anything pending first when possible. */
export async function stopSync() {
  try {
    await syncNow();
  } catch {
    // leaving anyway
  }
  store.onChange(null);
  window.removeEventListener('online', onOnline);
  document.removeEventListener('visibilitychange', onVisible);
  timers.forEach((t) => window.clearInterval(t));
  timers = [];
  window.clearTimeout(pushTimer);
  cloud = null;
}
