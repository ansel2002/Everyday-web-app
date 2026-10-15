import { MOODS, setMood, useMood } from '../../data/moods';
import { todayKey } from '../../lib/dates';
import { Icon } from '../../ui/Icon';

/** Five moods, each an icon + label. Selecting the chosen mood again clears it. */
export function MoodCheckIn() {
  const today = todayKey();
  const current = useMood(today);

  return (
    <section className="card mood-card" aria-labelledby="mood-heading">
      <h2 id="mood-heading" className="card-heading">How is today feeling?</h2>
      <div role="group" aria-labelledby="mood-heading" className="mood-options">
        {MOODS.map((mood) => {
          const pressed = current === mood.level;
          return (
            <button
              key={mood.level}
              type="button"
              className="mood-option"
              aria-pressed={pressed}
              onClick={() => setMood(today, pressed ? null : mood.level)}
            >
              <Icon name={mood.icon} />
              {mood.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
