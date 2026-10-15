import { useSyncExternalStore } from 'react';

/** 'system' follows the device. 'light' and 'dark' are user overrides (set in Settings later). */
export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'everyday.theme';
const listeners = new Set<() => void>();

function read(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

let current = read();

const BG = { light: '#eef3ef', dark: '#0f2226' };

function apply(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
  // Keep the browser and status bar colour in step: each theme-color meta matches its media
  // query when following the device, or the chosen theme when overridden.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const dark = meta.media.includes('dark');
    meta.content = pref === 'system' ? BG[dark ? 'dark' : 'light'] : BG[pref];
  });
}

// Bring the theme-color metas in line with a saved override on startup.
if (typeof document !== 'undefined') apply(current);

export function setThemePreference(pref: ThemePreference) {
  current = pref;
  try {
    if (pref === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // Storage can be unavailable (private mode). The theme still applies for this visit.
  }
  apply(pref);
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => current);
}
