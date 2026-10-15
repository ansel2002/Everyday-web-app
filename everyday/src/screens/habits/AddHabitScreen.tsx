import { useRef, useState, type FormEvent } from 'react';
import type { TimeOfDay } from '../../data/types';
import { TIMES_OF_DAY, addHabit } from '../../data/habits';
import { PUSH_NOTES, enablePush } from '../../data/reminders';
import { href, navigate } from '../../router';
import { BackLink } from '../../ui/BackLink';
import { Icon } from '../../ui/Icon';
import { Switch } from '../../ui/Switch';

/** New habit: a name, a time of day and an optional gentle reminder. */
export function AddHabitScreen({ suggestion }: { suggestion: string }) {
  const [name, setName] = useState(suggestion);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [reminder, setReminder] = useState(false);
  const [error, setError] = useState('');
  const [pushNote, setPushNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function save(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give it a short name first.');
      inputRef.current?.focus();
      return;
    }
    addHabit({ name: trimmed, timeOfDay, reminder });
    navigate('habits');
  }

  return (
    <>
      <BackLink to="habits" />
      <h1 className="page-header__title" tabIndex={-1}>New habit</h1>
      <form className="add-habit" onSubmit={save} noValidate>
        <section className="card add-habit__card">
          <label htmlFor="habit-name" className="add-habit__question">What would you like to do each day?</label>
          <input
            id="habit-name"
            ref={inputRef}
            className="field add-habit__input"
            placeholder="e.g. Read ten pages"
            maxLength={60}
            autoComplete="off"
            value={name}
            aria-describedby="habit-name-hint habit-name-error"
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
          />
          <div id="habit-name-hint" className="card-caption">Keep it small enough for your hardest day.</div>
          <p id="habit-name-error" className="add-habit__error" role="status">{error}</p>
        </section>

        <section className="card add-habit__card">
          <h2 id="time-heading" className="add-habit__question">When might you do it?</h2>
          <div role="group" aria-labelledby="time-heading" className="pill-row">
            {TIMES_OF_DAY.map((t) => (
              <button
                key={t.value}
                type="button"
                className="chip chip--pill"
                aria-pressed={timeOfDay === t.value}
                onClick={() => setTimeOfDay(t.value)}
              >
                {timeOfDay === t.value && <Icon name="check" size={18} strokeWidth={2.4} />}
                {t.label}
              </button>
            ))}
          </div>
          <div className="setting-row">
            <div className="setting-row__text">
              <div id="reminder-label" className="setting-row__label">Gentle reminder</div>
              <div id="reminder-hint" className="card-caption">A quiet nudge, never a nag.</div>
            </div>
            <Switch
              checked={reminder}
              onChange={(on) => {
                setReminder(on);
                if (on) void enablePush().then((result) => setPushNote(PUSH_NOTES[result]));
                else setPushNote('');
              }}
              labelledBy="reminder-label"
              describedBy="reminder-hint"
            />
          </div>
          <p role="status" className="setting-note">{pushNote}</p>
        </section>

        <button type="submit" className="btn btn--primary">Save habit</button>
        <a className="link-btn add-habit__cancel" href={href('habits')}>Cancel</a>
        <p className="privacy-note privacy-note--center">
          <Icon name="sun" size={18} />
          One missed day is always forgiven.
        </p>
      </form>
    </>
  );
}
