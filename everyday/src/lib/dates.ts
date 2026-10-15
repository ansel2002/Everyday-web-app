/**
 * Dates are stored as local calendar days, "YYYY-MM-DD", so a day means the
 * person's own day, not UTC. Keys sort correctly as plain strings.
 */
export type DateKey = string;

export function toDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

/** Parse a key back to a local Date at midnight. */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** "Tuesday, October 13" */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** Journal entry date: "Tuesday, Oct 13", with the year when it is not this year. */
export function formatEntryDate(key: DateKey): string {
  const date = fromDateKey(key);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** The current week, Sunday to Saturday, as date keys. */
export function weekOf(key: DateKey): DateKey[] {
  const sunday = addDays(key, -fromDateKey(key).getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

/** "Sun", "Mon", ... */
export function shortWeekday(key: DateKey): string {
  return fromDateKey(key).toLocaleDateString('en-US', { weekday: 'short' });
}
