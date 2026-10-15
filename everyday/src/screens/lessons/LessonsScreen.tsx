import { useState } from 'react';
import { getLesson, getMonth } from '../../data/lessons';
import { doneInMonth, pickTodayLesson, useProgress } from '../../data/progress';
import { todayKey } from '../../lib/dates';
import { href } from '../../router';
import { PageHeader } from '../../ui/PageHeader';
import { LessonDetailScreen } from './LessonDetailScreen';
import { MonthChart, YearSummary } from './LessonInsights';
import { LessonInsightsScreen } from './LessonInsightsScreen';
import { LessonList } from './LessonList';
import { MonthCard } from './MonthCard';
import { MonthPicker } from './MonthPicker';

// Remember the chosen month while the app is open, so going back from a lesson keeps it.
let rememberedMonth: number | null = null;

export function LessonsScreen({ param }: { param: string }) {
  if (param === 'insights') return <LessonInsightsScreen />;
  const lesson = param ? getLesson(param) : undefined;
  if (lesson) return <LessonDetailScreen lesson={lesson} />;
  return <MonthLessons />;
}

function MonthLessons() {
  const currentMonth = new Date().getMonth() + 1;
  const [month, setMonthState] = useState(rememberedMonth ?? currentMonth);
  const progress = useProgress();

  function setMonth(m: number) {
    rememberedMonth = m;
    setMonthState(m);
  }

  const todayId = progress && month === currentMonth ? pickTodayLesson(month, progress, todayKey())?.id : undefined;

  return (
    <>
      <PageHeader title="Lessons" subtitle="Eight new lessons every month" />
      <MonthPicker value={month} onChange={setMonth} />
      {progress && (
        <>
          <MonthCard month={month} done={doneInMonth(month, progress)} />
          <div className="lessons-layout">
            <LessonList lessons={getMonth(month).lessons} progress={progress} todayId={todayId} />
            <div className="lessons-insights only-wide">
              <MonthChart progress={progress} currentMonth={currentMonth} />
              <YearSummary progress={progress} />
            </div>
          </div>
          <a className="btn btn--outline only-phone" href={href('lessons', 'insights')}>
            See lesson insights
          </a>
        </>
      )}
    </>
  );
}
