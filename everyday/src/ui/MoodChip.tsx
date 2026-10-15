import type { MoodLevel } from '../data/types';
import { moodInfo } from '../data/moods';
import { Icon } from './Icon';

export function MoodChip({ level }: { level: MoodLevel }) {
  const mood = moodInfo(level);
  return (
    <span className="mood-chip">
      <Icon name={mood.icon} size={18} />
      <span>
        <span className="sr-only">Mood: </span>
        {mood.label}
      </span>
    </span>
  );
}
