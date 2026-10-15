import seed from '../../../data/lessons.seed.json';

/**
 * The single source of lesson content is data/lessons.seed.json (12 months x 8 lessons).
 * Edit the JSON to change content; no code changes needed.
 */
export interface Lesson {
  id: string;
  month: number;
  order: number;
  title: string;
  body: string;
  tryThis: string;
  journalPrompt: string;
}

export interface LessonMonth {
  month: number;
  name: string;
  theme: string;
  lessons: Lesson[];
}

export const LESSONS_PER_MONTH = 8;

export const months: LessonMonth[] = (seed.months as LessonMonth[])
  .map((m) => ({ ...m, lessons: [...m.lessons].sort((a, b) => a.order - b.order) }))
  .sort((a, b) => a.month - b.month);

const byId = new Map(months.flatMap((m) => m.lessons).map((l) => [l.id, l]));

/** month is 1-12. */
export function getMonth(month: number): LessonMonth {
  return months[month - 1];
}

export function getLesson(id: string): Lesson | undefined {
  return byId.get(id);
}

/** Today's lesson: the first lesson this month that is not done yet. Undefined when all are done. */
export function nextOpenLesson(month: number, doneIds: Set<string>): Lesson | undefined {
  return getMonth(month).lessons.find((l) => !doneIds.has(l.id));
}

if (import.meta.env.DEV) {
  const problems = months.flatMap((m, i) =>
    m.month !== i + 1 || m.lessons.length !== LESSONS_PER_MONTH ? [`${m.name}: ${m.lessons.length} lessons`] : [],
  );
  if (months.length !== 12 || problems.length) console.warn('lessons.seed.json looks off:', months.length, problems);
}
