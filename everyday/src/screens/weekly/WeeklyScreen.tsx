import { useEffect, useState } from 'react';
import { daysByHabit, useHabitLogs, useHabits } from '../../data/habits';
import { getLesson } from '../../data/lessons';
import { pickTodayLesson, useProgress } from '../../data/progress';
import { store, useStore } from '../../data/store';
import { fromDateKey, todayKey, toDateKey, weekOf } from '../../lib/dates';
import { href } from '../../router';
import { BackLink } from '../../ui/BackLink';
import { Icon } from '../../ui/Icon';
import { PageHeader } from '../../ui/PageHeader';

const shortDate = (key: string) => fromDateKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Weekly review: wins only, the lesson to carry forward, and what matters next. */
export function WeeklyScreen() {
  const today = todayKey();
  const week = weekOf(today);
  const weekStart = week[0];
  const habits = useHabits();
  const logs = useHabitLogs();
  const progress = useProgress();
  const saved = useStore(() => store.get('weeklyReviews', weekStart), [weekStart]);

  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  // Fill the box with this week's saved review (it may also arrive from another device).
  useEffect(() => {
    if (saved) setText(saved.text);
  }, [saved?.savedAt]);

  const daysSoFar = week.filter((d) => d <= today).length;
  const days = daysByHabit(logs);
  const habitWins = habits
    .map((h) => ({ name: h.name, count: week.filter((d) => d <= today && days.get(h.id)?.has(d)).length }))
    .filter((h) => h.count > 0)
    .map((h) => `${h.name}, ${h.count} of ${daysSoFar} ${daysSoFar === 1 ? 'day' : 'days'} so far`);
  const lessonWins = [...progress]
    .filter(([, at]) => week.includes(toDateKey(new Date(at))))
    .map(([id]) => getLesson(id))
    .filter((l) => l !== undefined)
    .map((l) => `Finished Lesson ${l.order}`);
  const wins = [...habitWins, ...lessonWins];
  const carry = pickTodayLesson(new Date().getMonth() + 1, progress, today);

  function save() {
    store.put('weeklyReviews', { weekStart, text: text.trim(), savedAt: new Date().toISOString() });
    setStatus('Saved. Encrypted on this device.');
  }

  return (
    <>
      <BackLink to="more" className="not-desktop" />
      <PageHeader
        title="Weekly review"
        subtitle={`${shortDate(weekStart)} to ${shortDate(week[6])}`}
        showStreak={false}
      />
      <div className="later-grid">
        <div className="later-stack">
          <section className="card later-card" aria-labelledby="wins-heading">
            <h2 id="wins-heading" className="card-heading">Your wins</h2>
            {wins.length ? (
              <ul className="win-list">
                {wins.map((win) => (
                  <li key={win}>
                    <Icon name="check" size={20} strokeWidth={2.4} />
                    {win}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="later-card__text">A quiet week so far. That counts too.</p>
            )}
          </section>
          <section className="card later-card" aria-labelledby="carry-heading">
            <h2 id="carry-heading" className="card-heading">A lesson to carry forward</h2>
            {carry ? (
              <a className="later-card__link" href={href('lessons', carry.id)}>
                Lesson {carry.order}: {carry.title}
              </a>
            ) : (
              <p className="later-card__text">Every lesson this month is done. Any of them is worth a second look.</p>
            )}
          </section>
        </div>
        <div className="later-stack">
          <section className="card later-card">
            <label htmlFor="weekly-text" className="card-heading">What matters most next week?</label>
            <textarea
              id="weekly-text"
              className="field weekly-text"
              placeholder="Up to three things, in your own words"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setStatus('');
              }}
            />
          </section>
          <button type="button" className="btn btn--primary" onClick={save}>Save review</button>
          <p role="status" className="later-note later-note--center">{status}</p>
        </div>
      </div>
    </>
  );
}
