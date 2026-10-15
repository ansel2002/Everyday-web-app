import { href, type Route, type Tab } from '../router';
import { Icon } from '../ui/Icon';
import { StreakCount } from '../ui/StreakCount';
import { moreItems } from './navItems';
import { NavLinks } from './NavLinks';

type Props = { current: Tab | null; route: Route; streak: number };

/** Tablet: narrow icon rail on the left. The quieter tools sit behind "More". */
export function Rail({ current, route, streak }: Props) {
  const inMore = route === 'more' || moreItems.some((m) => m.route === route);
  return (
    <div className="rail">
      <span className="rail__logo">
        <Icon name="sun" />
        <span className="sr-only">Everyday</span>
      </span>
      <NavLinks current={current} className="rail__nav" linkClass="rail-tab" />
      <nav aria-label="More" className="rail__nav">
        <a href={href('more')} className="rail-tab" aria-current={inMore ? 'page' : undefined}>
          <Icon name="more" />
          More
        </a>
      </nav>
      <div className="rail__foot">
        <StreakCount value={streak} variant="rail" />
      </div>
    </div>
  );
}
