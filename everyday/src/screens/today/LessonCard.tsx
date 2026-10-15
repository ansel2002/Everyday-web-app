import { useState } from 'react';
import { LESSONS_PER_MONTH, getMonth, type Lesson } from '../../data/lessons';
import { setLessonDone } from '../../data/progress';
import { Icon } from '../../ui/Icon';
import { SunriseBanner } from '../../ui/Illustration';

type Props = {
  lesson: Lesson;
  done: boolean;
  /** Add the month name to the "Lesson n of 8" line (used outside Today). */
  showMonth?: boolean;
  headingLevel?: 'h1' | 'h2';
};

/** A lesson: illustration, "Lesson n of 8", title, body, "Try this" and one action. */
export function LessonCard({ lesson, done, showMonth, headingLevel = 'h2' }: Props) {
  const [announcement, setAnnouncement] = useState('');
  const Heading = headingLevel;

  async function toggle() {
    await setLessonDone(lesson.id, !done);
    setAnnouncement(done ? 'Lesson marked as open.' : 'Lesson done.');
  }

  return (
    <section className="card lesson-card" aria-labelledby={`lesson-${lesson.id}`}>
      <SunriseBanner />
      <div className="lesson-card__body">
        <div className="lesson-card__meta">
          Lesson {lesson.order} of {LESSONS_PER_MONTH}
          {showMonth && ` · ${getMonth(lesson.month).name}`}
        </div>
        <Heading id={`lesson-${lesson.id}`} className="lesson-card__title" tabIndex={headingLevel === 'h1' ? -1 : undefined}>
          {lesson.title}
        </Heading>
        <p className="lesson-card__text">{lesson.body}</p>
        <div className="try-this">
          <Icon name="sun" />
          <div>
            <div className="try-this__label">Try this</div>
            <div className="try-this__text">{lesson.tryThis}</div>
          </div>
        </div>
        <div className="lesson-card__actions">
          {done ? (
            <button type="button" className="btn btn--sun" onClick={toggle}>
              <Icon name="check" size={20} strokeWidth={2.4} />
              Lesson done
              <span className="sr-only">. Select to mark it open again.</span>
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={toggle}>
              Mark lesson done
            </button>
          )}
        </div>
        <p role="status" className="sr-only">{announcement}</p>
      </div>
    </section>
  );
}
