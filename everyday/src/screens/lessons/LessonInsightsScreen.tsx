import { LESSONS_PER_MONTH, getMonth } from '../../data/lessons';
import { doneInMonth, useProgress } from '../../data/progress';
import { BackLink } from '../../ui/BackLink';
import { Card } from '../../ui/Card';
import { PageHeader } from '../../ui/PageHeader';
import { ProgressSegments } from '../../ui/ProgressSegments';
import { MonthChart, YearSummary } from './LessonInsights';

export function LessonInsightsScreen() {
  const progress = useProgress();
  const month = new Date().getMonth() + 1;
  const done = progress ? doneInMonth(month, progress) : 0;

  return (
    <>
      <BackLink to="lessons" label="Lessons" />
      <PageHeader title="Lesson insights" subtitle="Your months at a glance" showStreak={false} />
      {progress && (
        <>
          <Card className="this-month-card" aria-labelledby="this-month-heading">
            <h2 id="this-month-heading" className="card-heading">This month</h2>
            <div className="this-month-card__count">
              {getMonth(month).name}: {done} of {LESSONS_PER_MONTH} done
            </div>
            <ProgressSegments done={done} total={LESSONS_PER_MONTH} label={`${done} of ${LESSONS_PER_MONTH} lessons done`} />
          </Card>
          <MonthChart progress={progress} currentMonth={month} />
          <YearSummary progress={progress} />
        </>
      )}
    </>
  );
}
