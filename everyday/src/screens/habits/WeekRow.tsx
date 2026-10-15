import { shortWeekday, weekOf, type DateKey } from '../../lib/dates';
import { Icon } from '../../ui/Icon';

type Props = { days: Set<DateKey>; today: DateKey; justDone: boolean };

/**
 * Sunday to Saturday of this week. Done: filled with a check. A past day not done: a quiet outline.
 * Today not done yet: dashed. Future days: faint. Today's label is bold.
 */
export function WeekRow({ days, today, justDone }: Props) {
  const week = weekOf(today);
  const doneSoFar = week.filter((d) => d <= today && days.has(d)).length;

  return (
    <div role="img" aria-label={`This week so far: ${doneSoFar} done`} className="week-row">
      {week.map((day) => {
        const done = days.has(day);
        const state = done ? 'done' : day === today ? 'today' : day < today ? 'past' : 'future';
        return (
          <div key={day} className="week-day">
            <span className={`day-dot day-dot--${state}${done && day === today && justDone ? ' day-dot--pop' : ''}`}>
              {done && <Icon name="check" size={18} strokeWidth={2.4} className="draw-check" />}
            </span>
            <span className={day === today ? 'week-day__label week-day__label--today' : 'week-day__label'}>
              {shortWeekday(day)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
