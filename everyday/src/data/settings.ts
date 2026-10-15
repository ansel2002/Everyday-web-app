import { store, useStore } from './store';

/**
 * Settings that travel with the account (encrypted like everything else).
 * The theme lives in localStorage so it can apply before first paint, and the PIN
 * is per device (see keys.ts).
 */
export interface SettingsShape {
  /** One quiet nudge a day. */
  reminder: boolean;
}

const DEFAULTS: SettingsShape = { reminder: false };

export function getSetting<K extends keyof SettingsShape>(key: K): SettingsShape[K] {
  const row = store.get('settings', key);
  return row ? (row.value as SettingsShape[K]) : DEFAULTS[key];
}

export function setSetting<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) {
  store.put('settings', { key, value });
}

export function useSetting<K extends keyof SettingsShape>(key: K): SettingsShape[K] {
  return useStore(() => getSetting(key), [key]);
}
