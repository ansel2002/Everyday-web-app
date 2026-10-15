import { todayKey } from '../lib/dates';
import { store, useStore } from './store';
import { newId, type JournalEntry } from './types';

/** All entries, newest first. */
export function useJournalEntries(): JournalEntry[] {
  return useStore(() => store.all('journalEntries').sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function addJournalEntry(entry: { prompt: string; text: string; lessonId: string | null }) {
  const date = todayKey();
  const mood = store.get('moods', date)?.level ?? null;
  store.put('journalEntries', { id: newId(), date, mood, createdAt: new Date().toISOString(), ...entry });
}
