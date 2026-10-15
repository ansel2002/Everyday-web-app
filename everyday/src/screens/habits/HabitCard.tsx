import { useEffect, useState } from 'react';
import type { Habit } from '../../data/types';
import { habitStreak, setHabitDone } from '../../data/habits';
import type { DateKey } from '../../lib/dates';
import { Icon } from '../../ui/Icon';
import { WeekRow } from './WeekRow';

type Props = {
  habit: Habit;
  days: Set<DateKey>;
  today: DateKey;
  onRemove: (habit: Habit) => void;
};

/** One habit: name, streak, this week, and one action. */
export function HabitCard({ habit, days, today, onRemove }: Props) {
  const done = days.has(today);
  const streak = habitStreak(days, today);
  const [justDone, setJustDone] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // The "just done" animation plays once, then the class is removed.
  useEffect(() => {
    if (!justDone) return;
    const timer = window.setTimeout(() => setJustDone(false), 600);
    return () => window.clearTimeout(timer);
  }, [justDone]);

  async function toggle() {
    await setHabitDone(habit.id, today, !done);
    setJustDone(!done);
    setAnnouncement(done ? `${habit.name} marked as not done today.` : `${habit.name} done today.`);
  }

  return (
    <section className="card habit-card" aria-labelledby={`habit-${habit.id}`}>
      <div className="habit-card__top">
        <div className="habit-card__heading">
          <h2 id={`habit-${habit.id}`} className="habit-card__name">{habit.name}</h2>
          <span className="habit-card__streak">{streak > 0 ? `${streak}-day streak` : 'Ready when you are'}</span>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Remove ${habit.name}`}
          onClick={() => onRemove(habit)}
        >
          <Icon name="trash" size={20} />
        </button>
      </div>
      <WeekRow days={days} today={today} justDone={justDone} />
      {done ? (
        <button type="button" className={`btn btn--sun habit-card__action${justDone ? ' is-just-done' : ''}`} onClick={toggle}>
          <Icon name="check" size={20} strokeWidth={2.4} className="draw-check" />
          Done today
          <span className="sr-only">: {habit.name}. Select to undo.</span>
        </button>
      ) : (
        <button type="button" className="btn btn--outline habit-card__action" onClick={toggle}>
          Mark done
          <span className="sr-only">: {habit.name}</span>
        </button>
      )}
      <p role="status" className="sr-only">{announcement}</p>
    </section>
  );
}
