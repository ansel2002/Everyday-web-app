import { getMonth } from '../../data/lessons';
import { pickTodayLesson, useProgress } from '../../data/progress';
import { formatLongDate, todayKey } from '../../lib/dates';
import { href } from '../../router';
import { PageHeader } from '../../ui/PageHeader';
import { AllDoneCard } from './AllDoneCard';
import { HabitSummary } from './HabitSummary';
import { LessonCard } from './LessonCard';
import { MoodCheckIn } from './MoodCheckIn';

export function TodayScreen() {
  const progress = useProgress();
  const now = new Date();
  const month = now.getMonth() + 1;
  const lesson = progress && pickTodayLesson(month, progress, todayKey());

  return (
    <>
      <PageHeader title="Today" phoneTitle="Everyday" subtitle={formatLongDate(now)} />
      <div className="today-grid">
        {progress &&
          (lesson ? (
            <LessonCard lesson={lesson} done={progress.has(lesson.id)} />
          ) : (
            <AllDoneCard monthName={getMonth(month).name} />
          ))}
        <div className="today-side">
          <MoodCheckIn />
          <HabitSummary />
        </div>
      </div>
      <a className="link-btn today-more only-phone" href={href('more')}>
        Calm, focus and more
      </a>
    </>
  );
}
