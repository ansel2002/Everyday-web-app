import { useEffect } from 'react';
import { BackLink } from '../../ui/BackLink';
import { Icon } from '../../ui/Icon';
import { PageHeader } from '../../ui/PageHeader';
import { formatClock, useFocusTimer } from './useFocusTimer';

const LENGTHS = [15, 25, 45];
const R = 104;
const CIRCUMFERENCE = 2 * Math.PI * R;

const CAPTION = {
  idle: 'ready when you are',
  running: 'focusing',
  paused: 'paused',
  done: 'time is up',
};

/** A focus timer. Pause or stop any time. No score, no streak. */
export function FocusScreen() {
  const timer = useFocusTimer();
  const clock = formatClock(timer.remaining);
  const locked = timer.status === 'running' || timer.status === 'paused';

  // Show the time left in the browser tab while focusing.
  useEffect(() => {
    if (timer.status !== 'running') return;
    const previous = document.title;
    document.title = `${clock} · Focus`;
    return () => {
      document.title = previous;
    };
  }, [clock, timer.status]);

  return (
    <>
      <BackLink to="more" className="not-desktop" />
      <PageHeader title="Focus" subtitle="One thing, for a little while" showStreak={false} />
      <div className="later-grid">
        <section className="card later-card focus-card" aria-label="Timer">
          <svg
            className="focus-ring"
            width="240"
            height="240"
            viewBox="0 0 240 240"
            role="img"
            aria-label={`${clock} left, ${CAPTION[timer.status]}`}
          >
            <circle cx="120" cy="120" r={R} fill="none" stroke="var(--line)" strokeWidth="12" />
            <circle
              cx="120"
              cy="120"
              r={R}
              fill="none"
              stroke="var(--sun)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - Math.max(timer.progress, 0.04))}
              transform="rotate(-90 120 120)"
            />
            <text x="120" y="130" textAnchor="middle" className="focus-ring__time">{clock}</text>
            <text x="120" y="158" textAnchor="middle" className="focus-ring__caption">{CAPTION[timer.status]}</text>
          </svg>
          <div role="group" aria-label="Length" className="pill-row pill-row--center">
            {LENGTHS.map((m) => (
              <button
                key={m}
                type="button"
                className="chip chip--pill"
                aria-pressed={timer.minutes === m}
                disabled={locked}
                onClick={() => timer.setMinutes(m)}
              >
                {timer.minutes === m && <Icon name="check" size={18} strokeWidth={2.4} />}
                {m} min
              </button>
            ))}
          </div>
        </section>

        <div className="later-stack">
          <section className="card later-card">
            <label htmlFor="focus-label" className="add-habit__question">What are you focusing on?</label>
            <input
              id="focus-label"
              className="field add-habit__input"
              placeholder="e.g. Chapter three notes"
              maxLength={80}
              autoComplete="off"
              value={timer.label}
              onChange={(e) => timer.setLabel(e.target.value)}
            />
          </section>
          {timer.status === 'idle' && (
            <button type="button" className="btn btn--primary" onClick={timer.start}>Start focus</button>
          )}
          {timer.status === 'running' && (
            <div className="button-pair">
              <button type="button" className="btn btn--primary" onClick={timer.pause}>Pause</button>
              <button type="button" className="btn btn--outline btn--tall" onClick={timer.stop}>Stop</button>
            </div>
          )}
          {timer.status === 'paused' && (
            <div className="button-pair">
              <button type="button" className="btn btn--primary" onClick={timer.resume}>Resume</button>
              <button type="button" className="btn btn--outline btn--tall" onClick={timer.stop}>Stop</button>
            </div>
          )}
          {timer.status === 'done' && (
            <>
              <p role="status" className="later-message">That was {timer.minutes} quiet minutes. Nicely done.</p>
              <button type="button" className="btn btn--primary" onClick={timer.stop}>Start again</button>
            </>
          )}
          <p className="later-note later-note--center">Pause or stop any time. No score, no streak.</p>
        </div>
      </div>
    </>
  );
}
