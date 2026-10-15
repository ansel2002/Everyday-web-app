import { useHabits, useHabitsDoneOn } from '../../data/habits';
import { todayKey } from '../../lib/dates';
import { href } from '../../router';
import { Icon } from '../../ui/Icon';

const MAX_DOTS = 7;

/** "2 of 3 done today" with a dot per habit. Hidden when there are no habits. */
export function HabitSummary() {
  const habits = useHabits();
  const done = useHabitsDoneOn(todayKey());
  if (!habits?.length || !done) return null;

  const doneCount = habits.filter((h) => done.has(h.id)).length;
  const label = `${doneCount} of ${habits.length} done today`;

  return (
    <section className="habit-summary" aria-label="Habits today">
      {habits.length <= MAX_DOTS && (
        <span className="habit-dots" aria-hidden="true">
          {habits.map((h) => (
            <span key={h.id} className={done.has(h.id) ? 'habit-dot habit-dot--done' : 'habit-dot'}>
              {done.has(h.id) && <Icon name="check" size={16} strokeWidth={2.4} />}
            </span>
          ))}
        </span>
      )}
      <span className="habit-summary__text">{label}</span>
      <a className="link-btn" href={href('habits')}>Habits</a>
    </section>
  );
}
