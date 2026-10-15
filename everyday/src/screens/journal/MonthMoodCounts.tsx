import type { JournalEntry } from '../../data/types';
import { MOODS } from '../../data/moods';
import { todayKey } from '../../lib/dates';
import { Icon } from '../../ui/Icon';
import { PrivacyNote } from '../../ui/PrivacyNote';

/** Wider layouts: how this month's entries felt, as icon + label + count. Brightest first. */
export function MonthMoodCounts({ entries }: { entries: JournalEntry[] }) {
  const month = todayKey().slice(0, 7); // "YYYY-MM"
  const thisMonth = entries.filter((e) => e.date.startsWith(month));

  return (
    <aside className="card mood-counts" aria-labelledby="mood-counts-heading">
      <h2 id="mood-counts-heading" className="card-heading">This month</h2>
      <div className="card-caption">
        {thisMonth.length} {thisMonth.length === 1 ? 'entry' : 'entries'}
      </div>
      <ul className="mood-counts__list">
        {[...MOODS].reverse().map((mood) => (
          <li key={mood.level} className="mood-counts__row">
            <Icon name={mood.icon} />
            <span className="mood-counts__label">{mood.label}</span>
            <span className="mood-counts__value">{thisMonth.filter((e) => e.mood === mood.level).length}</span>
          </li>
        ))}
      </ul>
      <PrivacyNote />
    </aside>
  );
}
