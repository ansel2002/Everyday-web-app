import { useEffect, useState } from 'react';

const IN = 4;
const OUT = 6;
const CYCLE = IN + OUT;
const TOTAL = 180; // three minutes

/**
 * In for four, out for six, for three minutes. The circle grows and shrinks with the breath;
 * with reduced motion it stays still and the words and count lead instead.
 */
export function Breathing({ onDone }: { onDone: () => void }) {
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 250);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const finished = elapsed >= TOTAL;
  const inCycle = elapsed % CYCLE;
  const breathingIn = inCycle < IN;
  const count = breathingIn ? Math.ceil(IN - inCycle) : Math.ceil(CYCLE - inCycle);
  const left = Math.max(0, Math.ceil(TOTAL - elapsed));

  if (finished) {
    return (
      <div className="breathing">
        <p role="status" className="later-message">Three slow minutes. Well done.</p>
        <button type="button" className="btn btn--primary" onClick={onDone}>Finish</button>
      </div>
    );
  }

  return (
    <div className="breathing">
      <div
        className={breathingIn ? 'breath-circle breath-circle--in' : 'breath-circle'}
        style={{ transitionDuration: `${breathingIn ? IN : OUT}s` }}
        aria-hidden="true"
      />
      <p className="breathing__phase" role="status">{breathingIn ? 'Breathe in' : 'Breathe out'}</p>
      <p className="breathing__count" aria-hidden="true">{count}</p>
      <p className="card-caption">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} left
      </p>
      <button type="button" className="btn btn--outline btn--tall" onClick={onDone}>Stop</button>
    </div>
  );
}
