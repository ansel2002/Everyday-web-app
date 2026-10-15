import { useState } from 'react';
import type { Habit } from '../../data/types';
import { daysByHabit, useHabitLogs, useHabits } from '../../data/habits';
import { todayKey } from '../../lib/dates';
import { href } from '../../router';
import { Icon } from '../../ui/Icon';
import { PageHeader } from '../../ui/PageHeader';
import { AddHabitScreen } from './AddHabitScreen';
import { HabitCard } from './HabitCard';
import { HabitsEmpty } from './HabitsEmpty';
import { RemoveHabitDialog } from './RemoveHabitDialog';

const FORGIVEN_NOTE = 'A missed day never ends a streak here. One pause is always forgiven.';

export function HabitsScreen({ param }: { param: string }) {
  if (param === 'new' || param.startsWith('new/')) {
    return <AddHabitScreen suggestion={decodeURIComponent(param.slice(4))} />;
  }
  return <HabitList />;
}

/** Encouragement only. Never a count of what is left. */
function summaryNote(done: number, total: number): string {
  if (done === 0) return 'Whenever you are ready. One small thing is plenty.';
  if (done === total) return 'All done for today. Enjoy the rest of it.';
  return 'A good day already. Anything more is a bonus.';
}

function HabitList() {
  const habits = useHabits();
  const logs = useHabitLogs();
  const [removing, setRemoving] = useState<Habit | null>(null);
  const today = todayKey();

  if (!habits || !logs) return <PageHeader title="Habits" subtitle="Small things, kept gently" />;

  if (habits.length === 0) {
    return (
      <>
        <PageHeader title="Habits" subtitle="Small things, kept gently" />
        <HabitsEmpty />
      </>
    );
  }

  const days = daysByHabit(logs);
  const doneCount = habits.filter((h) => days.get(h.id)?.has(today)).length;

  return (
    <>
      <PageHeader
        title="Habits"
        subtitle="Small things, kept gently"
        action={<a className="btn btn--primary btn--wide" href={href('habits', 'new')}>Add a habit</a>}
      />
      <section className="card habits-summary" aria-label="Today">
        <div>
          <div className="habits-summary__count">{doneCount} of {habits.length} done today</div>
          <div className="habits-summary__note">{summaryNote(doneCount, habits.length)}</div>
        </div>
        <span className="habits-summary__forgiven only-wide">{FORGIVEN_NOTE}</span>
      </section>
      <div className="habit-grid">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} days={days.get(habit.id) ?? new Set()} today={today} onRemove={setRemoving} />
        ))}
        <a className="btn btn--dashed add-habit-tile" href={href('habits', 'new')}>
          <Icon name="plus" />
          Add a habit
        </a>
      </div>
      <p className="habits-footnote only-phone">{FORGIVEN_NOTE}</p>
      <RemoveHabitDialog habit={removing} onClose={() => setRemoving(null)} />
    </>
  );
}
