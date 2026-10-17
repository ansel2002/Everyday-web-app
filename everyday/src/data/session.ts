import { useSyncExternalStore } from 'react';
import { getMeta, setMeta, wipeCache } from './cache';
import { getCloud, type Cloud, type CloudUser } from './cloud';
import {
  createVault,
  loadLocalKeys,
  lock,
  unlockWithDevice,
  unlockWithPassphrase,
  unlockWithPin,
  type VaultRow,
} from './keys';
import { importLegacyData } from './legacy';
import { startReminderSync, stopReminderSync } from './reminders';
import { store } from './store';
import { loadFromCache, startSync, stopSync } from './sync';

/**
 * The steps between opening the app and using it:
 *   signed-out        -> email magic link
 *   create-passphrase -> first time on this account: choose the passphrase
 *   enter-passphrase  -> this account on a new device (or a forgotten PIN)
 *   enter-pin         -> PIN lock is on for this device
 *   ready             -> unlocked, synced in the background
 */
export type Phase =
  | { name: 'loading' }
  | { name: 'not-configured' }
  | { name: 'signed-out' }
  | { name: 'create-passphrase'; user: CloudUser; imported?: number }
  | { name: 'enter-passphrase'; user: CloudUser; vault: VaultRow }
  | { name: 'enter-pin'; user: CloudUser }
  | { name: 'needs-connection'; user: CloudUser }
  | { name: 'ready'; user: CloudUser };

let phase: Phase = { name: 'loading' };
let cloud: Cloud | null = null;
const listeners = new Set<() => void>();

function setPhase(next: Phase) {
  phase = next;
  listeners.forEach((fn) => fn());
}

export function useSession(): Phase {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => phase,
  );
}

export function currentCloud(): Cloud {
  if (!cloud) throw new Error('No cloud');
  return cloud;
}

/** Work out where we are. Runs on start and after signing in. */
export async function boot() {
  cloud = await getCloud();
  if (!cloud) return setPhase({ name: 'not-configured' });

  const user = await cloud.getUser();
  if (!user) return setPhase({ name: 'signed-out' });

  // A different account was used on this device before: start clean.
  const cachedUser = await getMeta<string>('userId');
  if (cachedUser && cachedUser !== user.id) await wipeLocal();
  await setMeta('userId', user.id);

  const local = await loadLocalKeys();
  if (local?.mode === 'device') {
    await unlockWithDevice(local);
    return enterApp(user);
  }
  if (local?.mode === 'pin') return setPhase({ name: 'enter-pin', user });

  if (!navigator.onLine) return setPhase({ name: 'needs-connection', user });
  try {
    const vault = await cloud.getVault();
    setPhase(vault ? { name: 'enter-passphrase', user, vault } : { name: 'create-passphrase', user });
  } catch {
    setPhase({ name: 'needs-connection', user });
  }
}

async function enterApp(user: CloudUser) {
  await loadFromCache();
  startSync(cloud!);
  startReminderSync(cloud!);
  setPhase({ name: 'ready', user });

  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo')) {
    const { loadDemoData } = await import('./demo');
    loadDemoData();
    window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  }
}

export async function sendMagicLink(email: string) {
  await currentCloud().sendMagicLink(email);
}

export async function signInWithGoogle() {
  await currentCloud().signInWithGoogle();
}

export async function choosePassphrase(passphrase: string) {
  if (phase.name !== 'create-passphrase') return;
  const user = phase.user;
  const vault = await createVault(passphrase);
  await currentCloud().saveVault(vault);
  await enterApp(user);
  await importLegacyData();
}

/** Throws when the passphrase does not open the vault. */
export async function enterPassphrase(passphrase: string) {
  if (phase.name !== 'enter-passphrase') return;
  await unlockWithPassphrase(phase.vault, passphrase);
  await enterApp(phase.user);
}

/** Throws when the PIN is wrong. */
export async function enterPin(pin: string) {
  if (phase.name !== 'enter-pin') return;
  await unlockWithPin(pin);
  await enterApp(phase.user);
}

/** Forgot the PIN: unlock with the passphrase instead (needs a connection to fetch the vault). */
export async function switchToPassphrase() {
  if (phase.name !== 'enter-pin') return;
  const user = phase.user;
  try {
    const vault = await currentCloud().getVault();
    if (vault) setPhase({ name: 'enter-passphrase', user, vault });
  } catch {
    setPhase({ name: 'needs-connection', user });
  }
}

async function wipeLocal() {
  await stopSync();
  stopReminderSync();
  lock();
  store.reset();
  await wipeCache();
  for (const storage of [localStorage, sessionStorage]) {
    try {
      Object.keys(storage)
        .filter((key) => key.startsWith('everyday.') && key !== 'everyday.theme' && key !== 'everyday.fakeCloud')
        .forEach((key) => storage.removeItem(key));
    } catch {
      // storage unavailable
    }
  }
}

/** Sign out: everything on this device is removed. The encrypted cloud copy stays. */
export async function signOut() {
  await wipeLocal();
  await currentCloud().signOut();
  setPhase({ name: 'signed-out' });
}

/** Delete the account and every record, in the cloud and on this device. Needs a connection. */
export async function deleteEverything() {
  await currentCloud().deleteAccount();
  await wipeLocal();
  setPhase({ name: 'signed-out' });
}

/** Sign-in can finish in another way (magic link opened, session restored): look again. */
export async function watchAuth() {
  const target = await getCloud();
  target?.onAuthChange(() => {
    if (phase.name === 'signed-out' || phase.name === 'loading') void boot();
  });
}
