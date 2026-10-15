import type { JournalEntry } from '../../data/types';
import { formatEntryDate } from '../../lib/dates';
import { MoodChip } from '../../ui/MoodChip';

export function EntryCard({ entry }: { entry: JournalEntry }) {
  return (
    <article className="card entry-card" aria-labelledby={`entry-${entry.id}`}>
      <div className="entry-card__top">
        <span className="entry-card__date">{formatEntryDate(entry.date)}</span>
        {entry.mood !== null && <MoodChip level={entry.mood} />}
      </div>
      <h2 id={`entry-${entry.id}`} className="entry-card__prompt">{entry.prompt}</h2>
      <p className="entry-card__text">{entry.text}</p>
    </article>
  );
}
