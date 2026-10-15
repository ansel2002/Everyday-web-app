import { useState } from 'react';
import { addJournalEntry } from '../../data/journal';

export const WIND_DOWN_STEPS = ['Put the day down: write one line', 'Dim the screen and the room', 'Five slow breaths'];

/** The evening wind-down, one step at a time. The line written in step one is kept in the journal. */
export function WindDown({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [line, setLine] = useState('');

  async function next() {
    if (step === 0 && line.trim()) {
      await addJournalEntry({ prompt: WIND_DOWN_STEPS[0], text: line.trim(), lessonId: null });
    }
    setStep(step + 1);
  }

  if (step >= WIND_DOWN_STEPS.length) {
    return (
      <div className="wind-down">
        <p role="status" className="later-message">That is the day put down. Rest well.</p>
        <button type="button" className="btn btn--outline btn--tall" onClick={onDone}>Finish</button>
      </div>
    );
  }

  return (
    <div className="wind-down">
      <p className="card-caption" aria-live="polite">Step {step + 1} of {WIND_DOWN_STEPS.length}</p>
      <p className="wind-down__step">{WIND_DOWN_STEPS[step]}</p>
      {step === 0 && (
        <>
          <label htmlFor="wind-down-line" className="sr-only">One line about today</label>
          <input
            id="wind-down-line"
            className="field add-habit__input"
            placeholder="One line is plenty"
            maxLength={200}
            autoComplete="off"
            value={line}
            onChange={(e) => setLine(e.target.value)}
          />
          <p className="card-caption">Saved to your journal, on this device.</p>
        </>
      )}
      <button type="button" className="btn btn--outline btn--tall" onClick={next}>
        {step === WIND_DOWN_STEPS.length - 1 ? 'Done' : 'Next'}
      </button>
    </div>
  );
}
