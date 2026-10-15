import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VaultRow } from './keys';

/**
 * Everything the app asks of the cloud, in one small interface.
 * The real one is Supabase. In development without Supabase settings, a fake
 * cloud in localStorage stands in (see fakeCloud.ts), so every flow can be tried.
 *
 * Only ciphertext and opaque ids are sent. Reminder rows carry an hour and time zone
 * (the server needs them to know when to nudge), and an encrypted label.
 */
export interface CloudUser {
  id: string;
  email: string | null;
}

export interface RemoteRecord {
  id: string;
  iv: string;
  ct: string;
  updated_at: string;
  deleted: boolean;
  /** Set by the server when it stores the row; the pull cursor. */
  synced_at?: string;
}

export interface ReminderRow {
  id: string;
  local_hour: number;
  timezone: string;
  /** Skip this local date (already done today). */
  skip_on: string | null;
  label_iv: string | null;
  label_ct: string | null;
}

export interface Cloud {
  kind: 'supabase' | 'fake';
  getUser(): Promise<CloudUser | null>;
  onAuthChange(callback: () => void): () => void;
  sendMagicLink(email: string): Promise<void>;
  signOut(): Promise<void>;
  getVault(): Promise<VaultRow | null>;
  saveVault(vault: VaultRow): Promise<void>;
  pushRecords(rows: RemoteRecord[]): Promise<void>;
  /** Rows stored since the cursor (exclusive), oldest first. */
  pullRecords(since: string | null): Promise<RemoteRecord[]>;
  replaceReminders(rows: ReminderRow[]): Promise<void>;
  savePushSubscription(subscription: PushSubscriptionJSON): Promise<void>;
  /** Removes the account and everything stored for it. */
  deleteAccount(): Promise<void>;
}

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const cloudConfigured = Boolean(URL && KEY);

function supabaseCloud(client: SupabaseClient): Cloud {
  async function userId() {
    const { data } = await client.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new Error('Not signed in');
    return id;
  }
  const check = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  };

  return {
    kind: 'supabase',

    async getUser() {
      // getSession reads the saved session, so this works offline too.
      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      return user ? { id: user.id, email: user.email ?? null } : null;
    },

    onAuthChange(callback) {
      const { data } = client.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(callback, 0);
      });
      return () => data.subscription.unsubscribe();
    },

    async sendMagicLink(email) {
      const redirect = `${window.location.origin}${window.location.pathname}`;
      const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
      if (error) throw new Error(error.message);
    },

    async signOut() {
      await client.auth.signOut({ scope: 'local' });
    },

    async getVault() {
      return check(await client.from('vaults').select('salt, iterations, iv, wrapped').maybeSingle()) as VaultRow | null;
    },

    async saveVault(vault) {
      check(await client.from('vaults').insert({ user_id: await userId(), ...vault }));
    },

    async pushRecords(rows) {
      if (!rows.length) return;
      const user_id = await userId();
      check(
        await client.from('records').upsert(
          rows.map(({ synced_at: _ignored, ...row }) => ({ user_id, ...row })),
          { onConflict: 'user_id,id' },
        ),
      );
    },

    async pullRecords(since) {
      const all: RemoteRecord[] = [];
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        let query = client.from('records').select('id, iv, ct, updated_at, deleted, synced_at').order('synced_at');
        if (since) query = query.gt('synced_at', since);
        const page = check(await query.range(from, from + PAGE - 1)) as RemoteRecord[];
        all.push(...page);
        if (page.length < PAGE) return all;
      }
    },

    async replaceReminders(rows) {
      const user_id = await userId();
      const keep = rows.map((r) => r.id);
      // Keep the server's last_sent_on for reminders that already exist, so nothing repeats.
      if (rows.length) {
        check(await client.from('reminders').upsert(rows.map((r) => ({ user_id, ...r })), { onConflict: 'user_id,id' }));
      }
      let remove = client.from('reminders').delete().eq('user_id', user_id);
      if (keep.length) remove = remove.not('id', 'in', `(${keep.map((id) => `"${id}"`).join(',')})`);
      check(await remove);
    },

    async savePushSubscription(subscription) {
      check(
        await client.from('push_subscriptions').upsert(
          {
            user_id: await userId(),
            endpoint: subscription.endpoint,
            p256dh: subscription.keys?.p256dh,
            auth: subscription.keys?.auth,
          },
          { onConflict: 'endpoint' },
        ),
      );
    },

    async deleteAccount() {
      const { error } = await client.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw new Error(error.message);
      await client.auth.signOut({ scope: 'local' });
    },
  };
}

// One shared promise, so callers at start-up all get the same instance.
let instance: Promise<Cloud | null> | null = null;

/** The cloud for this build, or null when it is not set up (production without settings). */
export function getCloud(): Promise<Cloud | null> {
  instance ??= (async () => {
    if (cloudConfigured) {
      return supabaseCloud(
        createClient(URL!, KEY!, {
          auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        }),
      );
    }
    if (import.meta.env.DEV) {
      const { fakeCloud } = await import('./fakeCloud');
      return fakeCloud();
    }
    return null;
  })();
  return instance;
}
