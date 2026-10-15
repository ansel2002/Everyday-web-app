import type { DateKey } from '../lib/dates';
import type { IconName } from '../ui/Icon';
import { store, useStore } from './store';
import type { MoodLevel } from './types';

/** Mood is always shown as icon + label, never colour alone. */
export const MOODS: { level: MoodLevel; label: string; icon: IconName }[] = [
  { level: 0, label: 'Low', icon: 'moodLow' },
  { level: 1, label: 'Flat', icon: 'moodFlat' },
  { level: 2, label: 'Okay', icon: 'moodOkay' },
  { level: 3, label: 'Good', icon: 'moodGood' },
  { level: 4, label: 'Bright', icon: 'sun' },
];

export function moodInfo(level: MoodLevel) {
  return MOODS[level];
}

export function useMood(date: DateKey): MoodLevel | null {
  return useStore(() => store.get('moods', date)?.level ?? null, [date]);
}

/** Every logged mood: date -> level. */
export function useMoodsByDate(): Map<DateKey, MoodLevel> {
  return useStore(() => new Map(store.all('moods').map((m) => [m.date, m.level])));
}

/** Set the mood for a day, or clear it with null. */
export function setMood(date: DateKey, level: MoodLevel | null) {
  if (level === null) store.remove('moods', date);
  else store.put('moods', { date, level });
}
