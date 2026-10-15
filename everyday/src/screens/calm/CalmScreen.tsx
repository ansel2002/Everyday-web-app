import { useState } from 'react';
import { BackLink } from '../../ui/BackLink';
import { Icon } from '../../ui/Icon';
import { Rings } from '../../ui/Illustration';
import { PageHeader } from '../../ui/PageHeader';
import { Breathing } from './Breathing';
import { WIND_DOWN_STEPS, WindDown } from './WindDown';

/** Calm corner: a breathing exercise and an evening wind-down. */
export function CalmScreen() {
  const [breathing, setBreathing] = useState(false);
  const [windingDown, setWindingDown] = useState(false);

  return (
    <>
      <BackLink to="more" className="not-desktop" />
      <PageHeader title="Calm corner" subtitle="A few quiet minutes" showStreak={false} />
      <div className="later-grid">
        <section className="card later-card" aria-labelledby="breathe-heading">
          {!breathing && <Rings />}
          <h2 id="breathe-heading" className="card-heading">Breathe</h2>
          {breathing ? (
            <Breathing onDone={() => setBreathing(false)} />
          ) : (
            <>
              <p className="later-card__text">In for four, out for six. Three minutes, at your own pace.</p>
              <button type="button" className="btn btn--primary" onClick={() => setBreathing(true)}>
                Begin breathing
              </button>
            </>
          )}
        </section>

        <section className="card later-card" aria-labelledby="wind-down-heading">
          <div className="later-card__title-row">
            <Icon name="moon" />
            <h2 id="wind-down-heading" className="card-heading">Evening wind-down</h2>
          </div>
          {windingDown ? (
            <WindDown onDone={() => setWindingDown(false)} />
          ) : (
            <>
              <ol className="step-list">
                {WIND_DOWN_STEPS.map((step, i) => (
                  <li key={step}>
                    <span className="step-list__number" aria-hidden="true">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <button type="button" className="btn btn--outline" onClick={() => setWindingDown(true)}>
                Start wind-down
              </button>
            </>
          )}
        </section>
      </div>
    </>
  );
}
