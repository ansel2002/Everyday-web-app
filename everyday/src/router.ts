import { useSyncExternalStore } from 'react';

/**
 * A tiny hash router. URLs look like #/lessons or #/lessons/m10-l2.
 * Hash URLs work offline and on any static host.
 */
export type Route =
  | 'today'
  | 'lessons'
  | 'habits'
  | 'journal'
  | 'insights'
  | 'focus'
  | 'calm'
  | 'weekly'
  | 'settings'
  | 'more';

export type Tab = 'today' | 'lessons' | 'habits' | 'journal';

const ROUTES: Route[] = ['today', 'lessons', 'habits', 'journal', 'insights', 'focus', 'calm', 'weekly', 'settings', 'more'];

export interface Location {
  route: Route;
  /** The rest of the path, e.g. "m10-l2" in #/lessons/m10-l2, or "" */
  param: string;
  /** The full path, used to tell pages apart. */
  path: string;
}

let cachedHash: string | null = null;
let cached: Location;

function parse(): Location {
  const hash = window.location.hash;
  if (hash === cachedHash) return cached;
  const [name = '', ...rest] = hash.replace(/^#\/?/, '').split('/');
  const route = (ROUTES as string[]).includes(name) ? (name as Route) : 'today';
  const param = route === name ? rest.join('/') : '';
  cachedHash = hash;
  cached = { route, param, path: param ? `${route}/${param}` : route };
  return cached;
}

function subscribe(fn: () => void) {
  window.addEventListener('hashchange', fn);
  return () => window.removeEventListener('hashchange', fn);
}

export function useLocation(): Location {
  return useSyncExternalStore(subscribe, parse);
}

export function href(route: Route, param?: string): string {
  return param ? `#/${route}/${param}` : `#/${route}`;
}

export function navigate(route: Route, param?: string) {
  window.location.hash = href(route, param);
}

/** Which main tab to highlight for a route. Later screens are not tabs. */
export function tabFor(route: Route): Tab | null {
  return route === 'today' || route === 'lessons' || route === 'habits' || route === 'journal' ? route : null;
}
