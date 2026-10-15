/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { decryptJson, deriveDataKeys, openBytes, type Sealed } from '../data/crypto';

/**
 * The service worker:
 * - caches the app's own files so Everyday opens offline;
 * - shows gentle reminders sent by Web Push, even when the app is closed.
 *   A habit's name arrives encrypted; it is decrypted here with this device's key
 *   when no PIN lock is on. Otherwise the nudge stays generic.
 */
declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

interface PushPayload {
  kind: 'daily' | 'habit';
  tag: string;
  label?: Sealed | null;
}

/** Read the device key straight from IndexedDB (the same store the app uses). */
function readDeviceKeys(): Promise<{ mode: string; deviceKey?: CryptoKey; wrapped?: Sealed } | undefined> {
  return new Promise((resolve) => {
    const request = indexedDB.open('everyday-cache');
    request.onerror = () => resolve(undefined);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('meta')) {
        db.close();
        return resolve(undefined);
      }
      const get = db.transaction('meta', 'readonly').objectStore('meta').get('keys');
      get.onsuccess = () => {
        resolve(get.result?.value);
        db.close();
      };
      get.onerror = () => {
        resolve(undefined);
        db.close();
      };
    };
  });
}

async function habitName(label: Sealed): Promise<string | null> {
  try {
    const local = await readDeviceKeys();
    if (local?.mode !== 'device' || !local.deviceKey || !local.wrapped) return null;
    const { aes } = await deriveDataKeys(await openBytes(local.deviceKey, local.wrapped));
    return await decryptJson<string>(aes, label);
  } catch {
    return null;
  }
}

self.addEventListener('push', (event) => {
  const payload: PushPayload = event.data?.json() ?? { kind: 'daily', tag: 'daily' };
  event.waitUntil(
    (async () => {
      let body = 'A quiet moment for yourself, whenever you are ready.';
      if (payload.kind === 'habit') {
        const name = payload.label ? await habitName(payload.label) : null;
        body = name ? `A gentle nudge: ${name}` : 'A gentle nudge for one of your habits.';
      }
      await self.registration.showNotification('Everyday', {
        body,
        tag: payload.tag,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        silent: true,
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = targetFor(event.notification.tag);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows[0];
      if (open) {
        await open.focus();
        return void open.navigate(target).catch(() => {});
      }
      await self.clients.openWindow(target);
    })(),
  );
});

/** Daily nudge opens Today; a habit nudge opens Habits. */
function targetFor(tag: string) {
  return new URL(tag === 'daily' ? './#/today' : './#/habits', self.registration.scope).href;
}
