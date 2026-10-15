import { LESSONS_PER_MONTH, getMonth } from '../../data/lessons';
import { Card } from '../../ui/Card';
import { ProgressSegments } from '../../ui/ProgressSegments';

export function MonthCard({ month, done }: { month: number; done: number }) {
  const info = getMonth(month);
  return (
    <Card className="month-card" aria-label={`${info.name}: ${info.theme}`}>
      <div className="month-card__top">
        <span className="month-card__name">{info.name}</span>
        <span className="month-card__count">{done} of {LESSONS_PER_MONTH} done</span>
      </div>
      <div className="month-card__theme">{info.theme}</div>
      <ProgressSegments done={done} total={LESSONS_PER_MONTH} label={`${done} of ${LESSONS_PER_MONTH} lessons done`} />
      <div className="month-card__note">No deadline. Do them in any order, or skip any.</div>
    </Card>
  );
}
