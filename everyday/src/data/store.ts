import { useMemo, useSyncExternalStore } from 'react';
import type { TableName, Tables } from './types';

/**
 * The app's data, decrypted, in memory. Screens read from here synchronously.
 *
 * Every change made by the app is reported to the change listener (sync.ts), which
 * encrypts it, keeps it in the local cache and sends it to the cloud. Changes that
 * arrive from the cloud are applied with `applyRemote` and are not echoed back.
 */

/** The key of each record, unique within its table. */
export const keyOf: { [T in TableName]: (row: Tables[T]) => string } = {
  moods: (r) => r.date,
  lessonProgress: (r) => r.lessonId,
  habits: (r) => r.id,
  habitLogs: (r) => `${r.habitId}|${r.date}`,
  journalEntries: (r) => r.id,
  weeklyReviews: (r) => r.weekStart,
  settings: (r) => r.key,
};

export const TABLE_NAMES = Object.keys(keyOf) as TableName[];

export interface Change {
  table: TableName;
  key: string;
  /** The new row, or null when it was deleted. */
  row: Tables[TableName] | null;
  /** When the change was made (ISO), used to settle conflicts: the latest change wins. */
  updatedAt: string;
}

type Data = { [T in TableName]: Map<string, Tables[T]> };

function emptyData(): Data {
  return Object.fromEntries(TABLE_NAMES.map((t) => [t, new Map()])) as unknown as Data;
}

let data = emptyData();
let version = 0;
const subscribers = new Set<() => void>();
let changeListener: ((changes: Change[]) => void) | null = null;
let pending: Change[] | null = null;

function notify() {
  version += 1;
  subscribers.forEach((fn) => fn());
}

function record(change: Change) {
  if (pending) pending.push(change);
  else changeListener?.([change]);
}

export const store = {
  all<T extends TableName>(table: T): Tables[T][] {
    return [...data[table].values()] as Tables[T][];
  },

  get<T extends TableName>(table: T, key: string): Tables[T] | undefined {
    return data[table].get(key) as Tables[T] | undefined;
  },

  put<T extends TableName>(table: T, row: Tables[T]) {
    const key = keyOf[table](row);
    (data[table] as Map<string, Tables[T]>).set(key, row);
    record({ table, key, row, updatedAt: new Date().toISOString() });
    if (!pending) notify();
  },

  remove(table: TableName, key: string) {
    if (!data[table].delete(key)) return;
    record({ table, key, row: null, updatedAt: new Date().toISOString() });
    if (!pending) notify();
  },

  /** Several changes at once: one re-render, one batch to sync. */
  batch(fn: () => void) {
    pending = [];
    try {
      fn();
    } finally {
      const changes = pending;
      pending = null;
      if (changes.length) {
        changeListener?.(changes);
        notify();
      }
    }
  },

  /** Load data from the cache or the cloud without sending it back out. */
  applyRemote(changes: Omit<Change, 'updatedAt'>[]) {
    for (const { table, key, row } of changes) {
      if (row) (data[table] as Map<string, unknown>).set(key, row);
      else data[table].delete(key);
    }
    if (changes.length) notify();
  },

  /** Forget everything in memory (sign out, delete all data). */
  reset() {
    data = emptyData();
    notify();
  },

  onChange(listener: ((changes: Change[]) => void) | null) {
    changeListener = listener;
  },
};

/** Run a function whenever anything in the store changes. Returns an unsubscribe function. */
export function subscribeStore(fn: () => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Read from the store; re-runs when anything changes. */
export function useStore<T>(select: () => T, deps: unknown[] = []): T {
  const v = useSyncExternalStore(subscribeStore, () => version);
  return useMemo(select, [v, ...deps]);
}
