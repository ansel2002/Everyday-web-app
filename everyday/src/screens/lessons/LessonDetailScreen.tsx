import type { Lesson } from '../../data/lessons';
import { useProgress } from '../../data/progress';
import { BackLink } from '../../ui/BackLink';
import { LessonCard } from '../today/LessonCard';

/** One lesson, opened from the list. Any lesson can be read or replayed at any time. */
export function LessonDetailScreen({ lesson }: { lesson: Lesson }) {
  const progress = useProgress();
  return (
    <>
      <BackLink to="lessons" label="Lessons" />
      <div className="lesson-detail">
        {progress && <LessonCard lesson={lesson} done={progress.has(lesson.id)} showMonth headingLevel="h1" />}
      </div>
    </>
  );
}
