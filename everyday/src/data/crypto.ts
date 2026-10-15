/**
 * End-to-end encryption, with the browser's own Web Crypto. No libraries.
 *
 * - A random 32-byte master secret belongs to each account.
 * - It is stored in the cloud only wrapped (AES-GCM) by a key derived from the
 *   passphrase (PBKDF2-SHA-256), so the server never sees it.
 * - From the master secret, HKDF derives two keys: AES-GCM to encrypt records,
 *   and HMAC to turn record keys into opaque ids (so the server cannot see dates or names).
 *
 * This file has no imports and no DOM use, so it runs in the app, the service worker and Node tests.
 */

export const PBKDF2_ITERATIONS = 600_000;

export interface Sealed {
  iv: string;
  ct: string;
}

export interface DataKeys {
  aes: CryptoKey;
  hmac: CryptoKey;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toB64(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromB64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** A wrapping key from a passphrase or PIN. Slow on purpose, to resist guessing. */
export async function secretKey(secret: string, salt: Uint8Array<ArrayBuffer>, iterations = PBKDF2_ITERATIONS) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(secret.normalize('NFC')), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function sealBytes(key: CryptoKey, bytes: Uint8Array<ArrayBuffer>): Promise<Sealed> {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
  return { iv: toB64(iv), ct: toB64(ct) };
}

/** Throws if the key is wrong or the data was changed. */
export async function openBytes(key: CryptoKey, sealed: Sealed): Promise<Uint8Array<ArrayBuffer>> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(sealed.iv) }, key, fromB64(sealed.ct));
  return new Uint8Array(plain);
}

export async function deriveDataKeys(master: Uint8Array<ArrayBuffer>): Promise<DataKeys> {
  const base = await crypto.subtle.importKey('raw', master, 'HKDF', false, ['deriveKey']);
  const hkdf = (info: string) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: encoder.encode(info) });
  const [aes, hmac] = await Promise.all([
    crypto.subtle.deriveKey(hkdf('everyday/records/v1'), base, { name: 'AES-GCM', length: 256 }, false, [
      'encrypt',
      'decrypt',
    ]),
    crypto.subtle.deriveKey(hkdf('everyday/ids/v1'), base, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, [
      'sign',
    ]),
  ]);
  return { aes, hmac };
}

export async function encryptJson(key: CryptoKey, value: unknown): Promise<Sealed> {
  return sealBytes(key, encoder.encode(JSON.stringify(value)));
}

export async function decryptJson<T>(key: CryptoKey, sealed: Sealed): Promise<T> {
  return JSON.parse(decoder.decode(await openBytes(key, sealed))) as T;
}

/** The same text always gives the same id, but the id reveals nothing about the text. */
export async function opaqueId(hmac: CryptoKey, text: string): Promise<string> {
  const mac = await crypto.subtle.sign('HMAC', hmac, encoder.encode(text));
  return toB64(new Uint8Array(mac).slice(0, 24));
}
