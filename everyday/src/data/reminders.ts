import { todayKey } from '../lib/dates';
import { getActiveDays } from './activity';
import type { Cloud, ReminderRow } from './cloud';
import { encryptJson, opaqueId } from './crypto';
import { dataKeys } from './keys';
import { getSetting } from './settings';
import { store, subscribeStore } from './store';
import type { TimeOfDay } from './types';

/**
 * Gentle reminders by Web Push, sent by a scheduled Supabase function, so they arrive
 * even when Everyday is closed.
 *
 * The server only knows an hour, a time zone, and whether today is already done.
 * A habit's name travels encrypted: the service worker decrypts it on this device
 * (when no PIN lock is on), otherwise the nudge stays generic.
 */
const HOUR: Record<TimeOfDay, number> = { morning: 8, afternoon: 13, evening: 19, anytime: 12 };
const DAILY_HOUR = 19;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

let cloud: Cloud | null = null;
let lastSent = '';
let timer: number | undefined;
let unsubscribe: (() => void) | null = null;

/** What to tell someone after they turn a reminder on. */
export const PUSH_NOTES = {
  on: 'Nudges arrive even when Everyday is closed.',
  blocked: 'Notifications are turned off for Everyday in this browser, so nudges cannot arrive yet.',
  unsupported: 'This browser cannot receive nudges. On iPhone, add Everyday to the Home Screen first.',
};

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function vapidKey(): Uint8Array<ArrayBuffer> {
  const b64 = VAPID_PUBLIC_KEY!.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/**
 * Ask once, when someone turns a reminder on, and register this device for push.
 * 'on' | 'blocked' (permission denied) | 'unsupported' (browser or app not set up for push).
 */
export async function enablePush(): Promise<'on' | 'blocked' | 'unsupported'> {
  if (!pushSupported() || !VAPID_PUBLIC_KEY || !cloud) return 'unsupported';
  const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (permission !== 'granted') return 'blocked';
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey() }));
    await cloud.savePushSubscription(subscription.toJSON());
    return 'on';
  } catch (error) {
    console.warn('Push registration failed', error);
    return 'unsupported';
  }
}

async function buildRows(): Promise<ReminderRow[]> {
  const { aes, hmac } = dataKeys();
  const today = todayKey();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const rows: ReminderRow[] = [];

  if (getSetting('reminder')) {
    rows.push({
      id: 'daily',
      local_hour: DAILY_HOUR,
      timezone,
      skip_on: getActiveDays().has(today) ? today : null,
      label_iv: null,
      label_ct: null,
    });
  }
  const doneToday = new Set(store.all('habitLogs').filter((l) => l.date === today).map((l) => l.habitId));
  for (const habit of store.all('habits').filter((h) => h.reminder)) {
    const label = await encryptJson(aes, habit.name);
    rows.push({
      id: await opaqueId(hmac, `reminder:${habit.id}`),
      local_hour: HOUR[habit.timeOfDay],
      timezone,
      skip_on: doneToday.has(habit.id) ? today : null,
      label_iv: label.iv,
      label_ct: label.ct,
    });
  }
  return rows;
}

/** Tell the server what to nudge about. Only when something relevant changed. */
async function sendReminders() {
  if (!cloud || !navigator.onLine) return;
  const rows = await buildRows();
  // Labels are re-encrypted each time (new IV), so compare without them.
  const signature = JSON.stringify(rows.map(({ label_iv: _i, label_ct: _c, ...rest }) => rest));
  if (signature === lastSent) return;
  try {
    await cloud.replaceReminders(rows);
    lastSent = signature;
  } catch (error) {
    console.warn('Could not update reminders', error);
  }
}

export function startReminderSync(target: Cloud) {
  cloud = target;
  lastSent = '';
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void sendReminders(), 3000);
  };
  const onOnline = () => schedule();
  window.addEventListener('online', onOnline);
  // Re-check whenever the data changes (a habit done, a mood logged) and at least hourly (new day).
  const unwatch = subscribeStore(schedule);
  const hourly = window.setInterval(schedule, 60 * 60 * 1000);
  schedule();
  unsubscribe = () => {
    unwatch();
    window.removeEventListener('online', onOnline);
    window.clearInterval(hourly);
    window.clearTimeout(timer);
  };
}

export function stopReminderSync() {
  unsubscribe?.();
  unsubscribe = null;
  cloud = null;
}

