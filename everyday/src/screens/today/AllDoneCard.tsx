import { href } from '../../router';
import { SunriseBanner } from '../../ui/Illustration';

/** Shown on Today when every lesson this month is done (and none was finished today). */
export function AllDoneCard({ monthName }: { monthName: string }) {
  return (
    <section className="card lesson-card" aria-labelledby="all-done">
      <SunriseBanner />
      <div className="lesson-card__body">
        <div className="lesson-card__meta">{monthName}</div>
        <h2 id="all-done" className="lesson-card__title">All eight lessons, done</h2>
        <p className="lesson-card__text">
          Every lesson stays open, so you can come back to any of them whenever you like.
        </p>
        <div className="lesson-card__actions">
          <a className="btn btn--outline" href={href('lessons')}>See lessons</a>
        </div>
      </div>
    </section>
  );
}
