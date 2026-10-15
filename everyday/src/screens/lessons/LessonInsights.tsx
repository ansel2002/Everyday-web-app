import type { CSSProperties } from 'react';
import { LESSONS_PER_MONTH, months } from '../../data/lessons';
import { doneByMonth, type Progress } from '../../data/progress';
import { Card } from '../../ui/Card';

/** Bar chart of lessons finished per month this year, out of 8. Bars carry their numbers. */
export function MonthChart({ progress, currentMonth }: { progress: Progress; currentMonth: number }) {
  const counts = doneByMonth(progress);
  return (
    <Card className="chart-card" aria-labelledby="chart-heading">
      <h2 id="chart-heading" className="card-heading">Lessons finished each month</h2>
      <div className="card-caption">Out of {LESSONS_PER_MONTH}.</div>
      <div className="bar-chart" aria-hidden="true">
        {months.map((m, i) => (
          <div key={m.month} className="bar-chart__col">
            <span className="bar-chart__value">{counts[i] > 0 ? counts[i] : ''}</span>
            <div
              className={counts[i] > 0 ? 'bar-chart__bar' : 'bar-chart__bar bar-chart__bar--empty'}
              style={{ '--fill': counts[i] / LESSONS_PER_MONTH } as CSSProperties}
            />
            <span className={m.month === currentMonth ? 'bar-chart__label bar-chart__label--current' : 'bar-chart__label'}>
              {m.name.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {months.map((m, i) => (
          <li key={m.month}>
            {m.name}: {counts[i]} of {LESSONS_PER_MONTH}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** "47 of 96 lessons finished this year" and the best month. Patterns, not verdicts. */
export function YearSummary({ progress }: { progress: Progress }) {
  const counts = doneByMonth(progress);
  const total = counts.reduce((a, b) => a + b, 0);
  const best = Math.max(...counts);
  const bestMonth = months[counts.indexOf(best)];
  return (
    <Card className="year-card">
      <div className="year-card__total">
        {total} of {months.length * LESSONS_PER_MONTH}
      </div>
      <div className="year-card__caption">lessons finished this year</div>
      <p className="year-card__note">
        {best > 0 && `Best month: ${bestMonth.name}, ${best} of ${LESSONS_PER_MONTH}. `}
        Every lesson stays open, so any month can be picked up again.
      </p>
    </Card>
  );
}
