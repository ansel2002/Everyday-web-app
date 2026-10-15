import { addDays, todayKey } from '../lib/dates';
import { store, TABLE_NAMES, keyOf } from './store';
import type { Habit, HabitLog, JournalEntry, MoodLevel } from './types';
import { getMonth } from './lessons';

/**
 * Development only: the sample data shown on the design boards, placed around today's date.
 * Open the app with ?demo to load it. It replaces everything in this account (and syncs).
 */
export function loadDemoData() {
  const t = todayKey();
  const month = getMonth(new Date().getMonth() + 1);
  const [lesson1, lesson2] = month.lessons;
  const at = (day: string, time: string) => new Date(`${day}T${time}`).toISOString();

  const habits: Habit[] = [
    { id: 'demo-walk', name: 'Evening walk', timeOfDay: 'evening', reminder: false, createdAt: at(addDays(t, -30), '09:00') },
    { id: 'demo-read', name: 'Read ten pages', timeOfDay: 'evening', reminder: false, createdAt: at(addDays(t, -30), '09:01') },
    { id: 'demo-stretch', name: 'Stretch for five minutes', timeOfDay: 'morning', reminder: false, createdAt: at(addDays(t, -30), '09:02') },
  ];

  // Board streaks: walk 6 (done today), read 5 (done today), stretch 4 (one forgiven gap, not done today).
  const logs: HabitLog[] = [
    ...[0, -1, -2, -3, -4, -5].map((d) => ({ habitId: 'demo-walk', date: addDays(t, d) })),
    ...[0, -1, -2, -3, -4].map((d) => ({ habitId: 'demo-read', date: addDays(t, d) })),
    ...[-1, -3, -4, -5].map((d) => ({ habitId: 'demo-stretch', date: addDays(t, d) })),
  ];

  const entry = (offset: number, mood: MoodLevel, prompt: string, text: string, lessonId: string | null): JournalEntry => {
    const date = addDays(t, offset);
    return { id: `demo-j${-offset}`, date, mood, lessonId, prompt, text, createdAt: at(date, '07:45') };
  };
  const journal: JournalEntry[] = [
    entry(0, 3, lesson2.journalPrompt, 'The first sip of tea on the balcony before work. It was quieter than I expected.', lesson2.id),
    entry(-4, 2, 'What is one thing you are grateful for today?', 'A kind message from an old friend that arrived at exactly the right moment.', lesson1.id),
    entry(-8, 0, 'What felt heavy today, and what helped even a little?', 'Tired all day. A short walk after dinner helped more than I thought it would.', null),
  ];

  store.batch(() => {
    clearAll();
    store.put('lessonProgress', { lessonId: lesson1.id, completedAt: at(addDays(t, -4), '08:15') });
    for (const j of journal) store.put('moods', { date: j.date, level: j.mood as MoodLevel });
    habits.forEach((h) => store.put('habits', h));
    logs.forEach((l) => store.put('habitLogs', l));
    journal.forEach((j) => store.put('journalEntries', j));
  });
}

function clearAll() {
  for (const table of TABLE_NAMES) {
    for (const row of store.all(table)) store.remove(table, (keyOf[table] as (r: unknown) => string)(row));
  }
}

/** Development only: empty every table in this account. */
export function clearAllData() {
  store.batch(clearAll);
}
