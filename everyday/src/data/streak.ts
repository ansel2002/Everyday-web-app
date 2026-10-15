/**
 * The one place for streak logic. Used for the day streak (any activity)
 * and for each habit's streak (days that habit was done).
 *
 * Rules:
 * - A streak counts active days, walking back from today.
 * - One missed day between two active days is forgiven: it does not break the
 *   run, and it does not add to the count.
 * - Two missed days in a row end the run.
 * - Today is never counted as missed: the day is not over yet. If today has no
 *   activity, counting starts from yesterday.
 *
 * Dates are local "YYYY-MM-DD" keys. This file has no imports, so it can be tested on its own.
 */

/** Day before a "YYYY-MM-DD" key. Uses UTC maths so daylight saving changes cannot skip a day. */
function previousDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

export function computeStreak(activeDays: Iterable<string>, today: string): number {
  const active = new Set(activeDays);
  let day = active.has(today) ? today : previousDay(today);
  let count = 0;
  let missesInARow = 0;

  // Stop once two days in a row are missed (this always happens past the oldest active day).
  while (missesInARow < 2) {
    if (active.has(day)) {
      count += 1;
      missesInARow = 0;
    } else {
      missesInARow += 1;
    }
    day = previousDay(day);
  }
  return count;
}
