import { href } from '../../router';
import { Sprout } from '../../ui/Illustration';
import { PrivacyNote } from '../../ui/PrivacyNote';

const IDEAS = ['Drink a glass of water', 'Walk for ten minutes', 'Write one line'];

/** No habits yet: one encouraging card and a few ideas to start from. */
export function HabitsEmpty() {
  return (
    <>
      <section className="card habits-empty" aria-labelledby="habits-empty-title">
        <Sprout />
        <h2 id="habits-empty-title" className="habits-empty__title">Start with one small thing</h2>
        <p className="habits-empty__text">Pick something that takes a few minutes. You can add more later, or never.</p>
        <a className="btn btn--primary habits-empty__action" href={href('habits', 'new')}>
          Add your first habit
        </a>
      </section>
      <section className="habit-ideas" aria-labelledby="habit-ideas-title">
        <div id="habit-ideas-title" className="card-caption">Or start from an idea</div>
        <div className="habit-ideas__list">
          {IDEAS.map((idea) => (
            <a key={idea} className="chip" href={href('habits', `new/${encodeURIComponent(idea)}`)}>
              {idea}
            </a>
          ))}
        </div>
      </section>
      <PrivacyNote className="privacy-note--center" />
    </>
  );
}
