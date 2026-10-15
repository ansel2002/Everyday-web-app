import type { DateKey } from '../lib/dates';

/** 0 Low · 1 Flat · 2 Okay · 3 Good · 4 Bright */
export type MoodLevel = 0 | 1 | 2 | 3 | 4;

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Mood {
  date: DateKey;
  level: MoodLevel;
}

export interface LessonProgress {
  lessonId: string;
  /** ISO timestamp. */
  completedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  timeOfDay: TimeOfDay;
  reminder: boolean;
  /** ISO timestamp, used to keep habits in the order they were added. */
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: DateKey;
}

export interface JournalEntry {
  id: string;
  date: DateKey;
  mood: MoodLevel | null;
  lessonId: string | null;
  prompt: string;
  text: string;
  /** ISO timestamp, orders entries written on the same day. */
  createdAt: string;
}

export interface WeeklyReview {
  /** Sunday that starts the week. */
  weekStart: DateKey;
  text: string;
  savedAt: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

/** Every kind of record, by table name. */
export interface Tables {
  moods: Mood;
  lessonProgress: LessonProgress;
  habits: Habit;
  habitLogs: HabitLog;
  journalEntries: JournalEntry;
  weeklyReviews: WeeklyReview;
  settings: Setting;
}

export type TableName = keyof Tables;

export function newId(): string {
  return crypto.randomUUID();
}
