// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  decryptJson,
  deriveDataKeys,
  encryptJson,
  fromB64,
  openBytes,
  opaqueId,
  randomBytes,
  sealBytes,
  secretKey,
  toB64,
} from './crypto.ts';

const FAST = 1000; // fewer PBKDF2 rounds keep the tests quick; the app uses 600,000

test('base64url round trip', () => {
  const bytes = randomBytes(33);
  assert.deepEqual(fromB64(toB64(bytes)), bytes);
});

test('the master secret opens with the right passphrase only', async () => {
  const master = randomBytes(32);
  const salt = randomBytes(16);
  const wrapped = await sealBytes(await secretKey('quiet morning tea', salt, FAST), master);
  assert.deepEqual(await openBytes(await secretKey('quiet morning tea', salt, FAST), wrapped), master);
  await assert.rejects(openBytes(await secretKey('quiet morning coffee', salt, FAST), wrapped));
});

test('records encrypt and decrypt; ciphertext hides the text', async () => {
  const { aes } = await deriveDataKeys(randomBytes(32));
  const row = { id: 'j1', text: 'The first sip of tea on the balcony.' };
  const sealed = await encryptJson(aes, row);
  assert.ok(!sealed.ct.includes('balcony'));
  assert.deepEqual(await decryptJson(aes, sealed), row);
});

test('a record from another account cannot be read', async () => {
  const mine = await deriveDataKeys(randomBytes(32));
  const theirs = await deriveDataKeys(randomBytes(32));
  await assert.rejects(decryptJson(theirs.aes, await encryptJson(mine.aes, { a: 1 })));
});

test('opaque ids are stable per account and differ between accounts', async () => {
  const master = randomBytes(32);
  const a = await deriveDataKeys(master);
  const b = await deriveDataKeys(master);
  const other = await deriveDataKeys(randomBytes(32));
  assert.equal(await opaqueId(a.hmac, 'moods:2026-10-14'), await opaqueId(b.hmac, 'moods:2026-10-14'));
  assert.notEqual(await opaqueId(a.hmac, 'moods:2026-10-14'), await opaqueId(other.hmac, 'moods:2026-10-14'));
  assert.notEqual(await opaqueId(a.hmac, 'moods:2026-10-14'), await opaqueId(a.hmac, 'moods:2026-10-15'));
});
