import type { CSSProperties } from 'react';
import type { MoodLevel } from '../../data/types';
import { useHabits, useHabitLogs } from '../../data/habits';
import { moodInfo, useMoodsByDate } from '../../data/moods';
import { addDays, shortWeekday, todayKey, weekOf } from '../../lib/dates';
import { BackLink } from '../../ui/BackLink';
import { Card } from '../../ui/Card';
import { PageHeader } from '../../ui/PageHeader';

const GOOD: MoodLevel = 3; // Good or Bright
const WINDOW_DAYS = 30;

/** Mood insights: this week's moods, and which habits tend to come with good days. Patterns, not verdicts. */
export function InsightsScreen() {
  const today = todayKey();
  const moods = useMoodsByDate();
  const habits = useHabits();
  const logs = useHabitLogs();

  const week = weekOf(today);
  const since = addDays(today, -WINDOW_DAYS + 1);
  const lifts = habits
    .map((habit) => {
      const days = logs.filter((l) => l.habitId === habit.id && l.date >= since && moods.has(l.date));
      const good = days.filter((l) => moods.get(l.date)! >= GOOD).length;
      return { name: habit.name, good, total: days.length };
    })
    .filter((h) => h.total > 0)
    .sort((a, b) => b.good / b.total - a.good / a.total);

  return (
    <>
      <BackLink to="more" className="not-desktop" />
      <PageHeader title="Mood insights" subtitle="What tends to lift you" showStreak={false} />
      <div className="later-grid">
        <Card className="later-card" aria-labelledby="week-mood-heading">
          <h2 id="week-mood-heading" className="card-heading">This week</h2>
          <div className="mood-week" aria-hidden="true">
            {week.map((day) => {
              const level = moods.get(day);
              return (
                <div key={day} className="mood-week__col">
                  <span className="mood-week__value">{level !== undefined ? moodInfo(level).label : ''}</span>
                  <div
                    className={level !== undefined ? 'mood-week__bar' : 'mood-week__bar mood-week__bar--empty'}
                    style={{ '--level': (level ?? 0) + 1 } as CSSProperties}
                  />
                  <span className={day === today ? 'mood-week__day mood-week__day--today' : 'mood-week__day'}>
                    {shortWeekday(day)}
                  </span>
                </div>
              );
            })}
          </div>
          <ul className="sr-only">
            {week.map((day) => (
              <li key={day}>
                {shortWeekday(day)}: {moods.has(day) ? moodInfo(moods.get(day)!).label : 'no mood logged'}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="later-card" aria-labelledby="lift-heading">
          <h2 id="lift-heading" className="card-heading">Days you did this, you felt good</h2>
          {lifts.length === 0 ? (
            <p className="later-card__muted">
              Log a mood on days you do a habit, and patterns will start to show here.
            </p>
          ) : (
            <ul className="lift-list">
              {lifts.map((h) => (
                <li key={h.name}>
                  <div className="lift-list__top">
                    <span className="lift-list__name">{h.name}</span>
                    <span className="lift-list__count">Good on {h.good} of {h.total} days</span>
                  </div>
                  <div className="lift-list__bar" aria-hidden="true">
                    <div style={{ width: `${(h.good / h.total) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <p className="later-note">Patterns, not verdicts. Built only from what you log, on this device.</p>
      </div>
    </>
  );
}
