import type { Lesson } from '../../data/lessons';
import type { Progress } from '../../data/progress';
import { href } from '../../router';
import { Icon } from '../../ui/Icon';

type Props = { lessons: Lesson[]; progress: Progress; todayId?: string };

/**
 * The month's lessons. Phone: one list card with rows. Tablet and desktop: a grid of cards.
 * Same markup, restyled by CSS. Status is always a word (Done / Today / Open), plus a shape on phone.
 */
export function LessonList({ lessons, progress, todayId }: Props) {
  return (
    <ul className="lesson-list">
      {lessons.map((lesson) => {
        const done = progress.has(lesson.id);
        const status = done ? 'Done' : lesson.id === todayId ? 'Today' : 'Open';
        return (
          <li key={lesson.id}>
            <a href={href('lessons', lesson.id)} className={`lesson-item lesson-item--${status.toLowerCase()}`}>
              <span className="lesson-item__mark" aria-hidden="true">
                {status === 'Done' && <Icon name="check" size={22} strokeWidth={2.4} />}
                {status === 'Today' && <Icon name="sun" />}
                {status === 'Open' && lesson.order}
              </span>
              <span className="lesson-item__meta">Lesson {lesson.order}</span>
              <span className="lesson-item__title">{lesson.title}</span>
              <span className="lesson-item__status">{status}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
