import type { DateKey } from '../lib/dates';
import { keyOf, store, useStore } from './store';
import { computeStreak } from './streak';
import { newId, type Habit, type HabitLog, type TimeOfDay } from './types';

export const TIMES_OF_DAY: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'anytime', label: 'Anytime' },
];

/** Habits in the order they were added. */
export function useHabits(): Habit[] {
  return useStore(() => store.all('habits').sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
}

/** Every habit check-in. Small enough to keep in memory for one person's history. */
export function useHabitLogs(): HabitLog[] {
  return useStore(() => store.all('habitLogs'));
}

/** Ids of habits done on a given day. */
export function useHabitsDoneOn(date: DateKey): Set<string> {
  return useStore(
    () => new Set(store.all('habitLogs').filter((l) => l.date === date).map((l) => l.habitId)),
    [date],
  );
}

/** Days each habit was done: habitId -> set of date keys. */
export function daysByHabit(logs: HabitLog[]): Map<string, Set<DateKey>> {
  const map = new Map<string, Set<DateKey>>();
  for (const log of logs) {
    if (!map.has(log.habitId)) map.set(log.habitId, new Set());
    map.get(log.habitId)!.add(log.date);
  }
  return map;
}

export function habitStreak(days: Set<DateKey> | undefined, today: DateKey): number {
  return computeStreak(days ?? [], today);
}

export function addHabit(habit: { name: string; timeOfDay: TimeOfDay; reminder: boolean }) {
  store.put('habits', { id: newId(), createdAt: new Date().toISOString(), ...habit });
}

/** Removes the habit and its check-ins. Journal entries are untouched. */
export function removeHabit(id: string) {
  store.batch(() => {
    for (const log of store.all('habitLogs').filter((l) => l.habitId === id)) {
      store.remove('habitLogs', keyOf.habitLogs(log));
    }
    store.remove('habits', id);
  });
}

export function setHabitDone(habitId: string, date: DateKey, done: boolean) {
  if (done) store.put('habitLogs', { habitId, date });
  else store.remove('habitLogs', keyOf.habitLogs({ habitId, date }));
}
