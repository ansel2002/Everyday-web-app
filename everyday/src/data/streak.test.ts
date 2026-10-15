// Run with: npm test (uses Node's built-in test runner, no extra packages).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeStreak } from './streak.ts';

const today = '2026-10-14';

test('no activity is a streak of 0', () => {
  assert.equal(computeStreak([], today), 0);
});

test('activity today only is 1', () => {
  assert.equal(computeStreak([today], today), 1);
});

test('today not done yet still counts from yesterday', () => {
  assert.equal(computeStreak(['2026-10-13', '2026-10-12'], today), 2);
});

test('consecutive days count', () => {
  assert.equal(computeStreak(['2026-10-14', '2026-10-13', '2026-10-12'], today), 3);
});

test('one missed day inside a run is forgiven and not counted', () => {
  // 13 missed
  assert.equal(computeStreak(['2026-10-14', '2026-10-12', '2026-10-11'], today), 3);
});

test('two missed days in a row end the run', () => {
  // 12 and 11 missed, so 10 is a separate, older run
  assert.equal(computeStreak(['2026-10-14', '2026-10-13', '2026-10-10'], today), 2);
});

test('every single gap is forgiven, not only the first', () => {
  assert.equal(computeStreak(['2026-10-14', '2026-10-12', '2026-10-10', '2026-10-08'], today), 4);
});

test('nothing today or yesterday, but the day before: still alive (yesterday is the one forgiven day)', () => {
  assert.equal(computeStreak(['2026-10-12', '2026-10-11'], today), 2);
});

test('nothing for the last three days ends it', () => {
  assert.equal(computeStreak(['2026-10-11', '2026-10-10'], today), 0);
});

test('crosses month and year boundaries', () => {
  assert.equal(computeStreak(['2027-01-01', '2026-12-31', '2026-12-30'], '2027-01-01'), 3);
  assert.equal(computeStreak(['2026-03-01', '2026-02-28'], '2026-03-01'), 2);
});

test('crosses a daylight saving change', () => {
  // Clocks change in late March (EU) and early March (US).
  assert.equal(computeStreak(['2026-03-30', '2026-03-29', '2026-03-28', '2026-03-08', '2026-03-07'], '2026-03-30'), 3);
  assert.equal(computeStreak(['2026-03-09', '2026-03-08', '2026-03-07'], '2026-03-09'), 3);
});

test('future-dated activity is ignored', () => {
  assert.equal(computeStreak(['2026-10-15', today], today), 1);
});

test('duplicate days count once', () => {
  assert.equal(computeStreak([today, today, '2026-10-13'], today), 2);
});

test('the Stretch habit from the Habits board: 4-day streak with Sunday missed, today not done', () => {
  // Tue Oct 13 is "today"; Mon 12 done, Sun 11 missed, Sat 10, Fri 9, Thu 8 done.
  assert.equal(computeStreak(['2026-10-12', '2026-10-10', '2026-10-09', '2026-10-08'], '2026-10-13'), 4);
});
