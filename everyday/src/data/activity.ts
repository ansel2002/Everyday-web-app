import { toDateKey, type DateKey } from '../lib/dates';
import { store } from './store';

/** Every day with any activity: a mood, a finished lesson, a habit done or a journal entry. */
export function getActiveDays(): Set<DateKey> {
  return new Set<DateKey>([
    ...store.all('moods').map((m) => m.date),
    ...store.all('habitLogs').map((l) => l.date),
    ...store.all('journalEntries').map((j) => j.date),
    ...store.all('lessonProgress').map((p) => toDateKey(new Date(p.completedAt))),
  ]);
}
