import { todayKey } from '../lib/dates';
import { getActiveDays } from './activity';
import { useStore } from './store';
import { computeStreak } from './streak';

/** The app-wide day streak. Updates live as activity is recorded. */
export function useDayStreak(): number {
  return useStore(() => computeStreak(getActiveDays(), todayKey()));
}
