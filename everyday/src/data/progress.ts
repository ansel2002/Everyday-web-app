import { toDateKey, type DateKey } from '../lib/dates';
import { getMonth, months, type Lesson } from './lessons';
import { store, useStore } from './store';

/**
 * Lesson progress. A lesson counts as done when it was finished in the current
 * calendar year, so each year the 96 lessons are fresh to do again.
 * Map of lessonId -> completedAt (ISO).
 */
export type Progress = Map<string, string>;

export function useProgress(): Progress {
  const year = new Date().getFullYear();
  return useStore(
    () =>
      new Map(
        store
          .all('lessonProgress')
          .filter((r) => new Date(r.completedAt).getFullYear() === year)
          .map((r) => [r.lessonId, r.completedAt]),
      ),
    [year],
  );
}

export function setLessonDone(lessonId: string, done: boolean) {
  if (done) store.put('lessonProgress', { lessonId, completedAt: new Date().toISOString() });
  else store.remove('lessonProgress', lessonId);
}

/**
 * Today's lesson for a month: a lesson finished today stays as today's lesson
 * for the rest of the day; otherwise the first open lesson. Undefined when all are done.
 */
export function pickTodayLesson(month: number, progress: Progress, today: DateKey): Lesson | undefined {
  const lessons = getMonth(month).lessons;
  const doneToday = lessons
    .filter((l) => progress.has(l.id) && toDateKey(new Date(progress.get(l.id)!)) === today)
    .sort((a, b) => progress.get(a.id)!.localeCompare(progress.get(b.id)!));
  return doneToday.at(-1) ?? lessons.find((l) => !progress.has(l.id));
}

export function doneInMonth(month: number, progress: Progress): number {
  return getMonth(month).lessons.filter((l) => progress.has(l.id)).length;
}

/** Lessons finished this year, grouped by the lesson's month (index 0 = January). */
export function doneByMonth(progress: Progress): number[] {
  return months.map((m) => doneInMonth(m.month, progress));
}
