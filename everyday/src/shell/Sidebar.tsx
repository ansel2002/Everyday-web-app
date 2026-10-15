import { href, type Route, type Tab } from '../router';
import { Icon } from '../ui/Icon';
import { PrivacyNote } from '../ui/PrivacyNote';
import { StreakCount } from '../ui/StreakCount';
import { moreItems } from './navItems';
import { NavLinks } from './NavLinks';

type Props = { current: Tab | null; route: Route; streak: number };

/** Desktop: 260px sidebar with wordmark, tabs, the quieter tools, streak and privacy line. */
export function Sidebar({ current, route, streak }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar__wordmark">Everyday</div>
      <NavLinks current={current} className="sidebar__nav" linkClass="side-tab" />
      <nav aria-label="More" className="sidebar__more">
        {moreItems.map((item) => (
          <a
            key={item.route}
            href={href(item.route)}
            className="side-tab side-tab--small"
            aria-current={item.route === route ? 'page' : undefined}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar__foot">
        <StreakCount value={streak} variant="sidebar" />
        <PrivacyNote />
      </div>
    </div>
  );
}
