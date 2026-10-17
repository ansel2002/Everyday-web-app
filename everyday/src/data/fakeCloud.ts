import type { Cloud, ReminderRow, RemoteRecord } from './cloud';
import type { VaultRow } from './keys';

/**
 * Development only: a pretend cloud kept in localStorage, used when no Supabase
 * settings are present. The "magic link" signs in straight away. Behaves like the
 * real thing for records (server timestamps, latest change wins), so sync can be tried.
 * Never included in production builds.
 */
interface FakeState {
  user: { id: string; email: string } | null;
  vault: VaultRow | null;
  records: Record<string, RemoteRecord>;
  reminders: ReminderRow[];
  clock: number;
}

const KEY = 'everyday.fakeCloud';

function load(): FakeState {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (saved) return saved;
  } catch {
    // start fresh
  }
  return { user: null, vault: null, records: {}, reminders: [], clock: Date.now() };
}

function save(state: FakeState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function fakeCloud(): Cloud {
  const listeners = new Set<() => void>();
  const delay = () => new Promise((r) => setTimeout(r, 150));

  return {
    kind: 'fake',

    async getUser() {
      return load().user;
    },

    onAuthChange(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },

    async sendMagicLink(email) {
      await delay();
      const state = load();
      state.user = { id: `fake-${email.toLowerCase()}`, email };
      save(state);
      listeners.forEach((fn) => setTimeout(fn, 600)); // as if the link was opened
    },

    async signInWithGoogle() {
      // Pretend the Google round trip happened.
      await delay();
      const state = load();
      state.user = { id: 'fake-google-reader', email: 'reader@gmail.example' };
      save(state);
      listeners.forEach((fn) => setTimeout(fn, 300));
    },

    async signOut() {
      const state = load();
      state.user = null;
      save(state);
    },

    async getVault() {
      await delay();
      return load().vault;
    },

    async saveVault(vault) {
      const state = load();
      state.vault = vault;
      save(state);
    },

    async pushRecords(rows) {
      await delay();
      const state = load();
      for (const row of rows) {
        const existing = state.records[row.id];
        if (existing && existing.updated_at > row.updated_at) continue; // latest change wins
        state.clock = Math.max(state.clock + 1, Date.now());
        state.records[row.id] = { ...row, synced_at: new Date(state.clock).toISOString() };
      }
      save(state);
    },

    async pullRecords(since) {
      await delay();
      return Object.values(load().records)
        .filter((r) => !since || r.synced_at! > since)
        .sort((a, b) => a.synced_at!.localeCompare(b.synced_at!));
    },

    async replaceReminders(rows) {
      const state = load();
      state.reminders = rows;
      save(state);
    },

    async savePushSubscription() {
      // Nothing to send to in development.
    },

    async deleteAccount() {
      await delay();
      localStorage.removeItem(KEY);
    },
  };
}
