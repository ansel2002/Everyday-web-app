import { useSyncExternalStore } from 'react';
import { getMeta, setMeta } from './cache';
import {
  PBKDF2_ITERATIONS,
  deriveDataKeys,
  fromB64,
  openBytes,
  randomBytes,
  sealBytes,
  secretKey,
  toB64,
  type DataKeys,
  type Sealed,
} from './crypto';

/**
 * Who holds the keys.
 *
 * Cloud (the "vault"): the master secret wrapped by the passphrase. Needed to set up a new device.
 * This device: the master secret wrapped by either
 *   - a device key that cannot be exported from the browser (no PIN: opens straight away), or
 *   - a key derived from the PIN (PIN lock on: the data stays encrypted until the PIN is entered).
 * Forgotten PIN: unlock with the passphrase instead. Forgotten passphrase: no one can recover the data.
 */
export interface VaultRow {
  salt: string;
  iterations: number;
  iv: string;
  wrapped: string;
}

export type LocalKeys =
  | { mode: 'device'; deviceKey: CryptoKey; wrapped: Sealed }
  | { mode: 'pin'; salt: string; iterations: number; wrapped: Sealed };

const LOCAL_KEYS = 'keys';

let master: Uint8Array<ArrayBuffer> | null = null;
let keys: DataKeys | null = null;
let pinEnabled = false;
const listeners = new Set<() => void>();

function changed() {
  listeners.forEach((fn) => fn());
}

/** The keys for this session. Only available after unlocking. */
export function dataKeys(): DataKeys {
  if (!keys) throw new Error('Everyday is locked');
  return keys;
}

export function isUnlocked(): boolean {
  return keys !== null;
}

async function open(secret: Uint8Array<ArrayBuffer>) {
  master = secret;
  keys = await deriveDataKeys(secret);
}

export function lock() {
  master = null;
  keys = null;
}

export async function loadLocalKeys(): Promise<LocalKeys | undefined> {
  const local = await getMeta<LocalKeys>(LOCAL_KEYS);
  pinEnabled = local?.mode === 'pin';
  changed();
  return local;
}

async function saveWithDeviceKey(secret: Uint8Array<ArrayBuffer>) {
  const deviceKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await setMeta(LOCAL_KEYS, { mode: 'device', deviceKey, wrapped: await sealBytes(deviceKey, secret) } satisfies LocalKeys);
  pinEnabled = false;
  changed();
}

/** A brand-new account: make the master secret and its passphrase-wrapped copy for the cloud. */
export async function createVault(passphrase: string): Promise<VaultRow> {
  const secret = randomBytes(32);
  const salt = randomBytes(16);
  const sealed = await sealBytes(await secretKey(passphrase, salt), secret);
  await open(secret);
  await saveWithDeviceKey(secret);
  return { salt: toB64(salt), iterations: PBKDF2_ITERATIONS, iv: sealed.iv, wrapped: sealed.ct };
}

/** Unlock with the passphrase (new device, or forgotten PIN). Throws if the passphrase is wrong. */
export async function unlockWithPassphrase(vault: VaultRow, passphrase: string) {
  const key = await secretKey(passphrase, fromB64(vault.salt), vault.iterations);
  const secret = await openBytes(key, { iv: vault.iv, ct: vault.wrapped });
  await open(secret);
  await saveWithDeviceKey(secret); // a forgotten PIN is cleared by this too
}

export async function unlockWithDevice(local: Extract<LocalKeys, { mode: 'device' }>) {
  await open(await openBytes(local.deviceKey, local.wrapped));
}

/** Throws if the PIN is wrong. */
export async function unlockWithPin(pin: string) {
  const local = await getMeta<LocalKeys>(LOCAL_KEYS);
  if (local?.mode !== 'pin') throw new Error('No PIN set');
  const key = await secretKey(pin, fromB64(local.salt), local.iterations);
  await open(await openBytes(key, local.wrapped));
}

/** PIN lock on: the master secret on this device is now wrapped by the PIN. */
export async function setPinLock(pin: string) {
  if (!master) throw new Error('Everyday is locked');
  const salt = randomBytes(16);
  const wrapped = await sealBytes(await secretKey(pin, salt), master);
  await setMeta(LOCAL_KEYS, { mode: 'pin', salt: toB64(salt), iterations: PBKDF2_ITERATIONS, wrapped } satisfies LocalKeys);
  pinEnabled = true;
  changed();
}

export async function removePinLock() {
  if (!master) throw new Error('Everyday is locked');
  await saveWithDeviceKey(master);
}

export function usePinEnabled(): boolean {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => pinEnabled,
  );
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

/** At least 10 characters; a few unusual words are easier to remember than symbols. */
export function isValidPassphrase(passphrase: string): boolean {
  return passphrase.trim().length >= 10;
}
