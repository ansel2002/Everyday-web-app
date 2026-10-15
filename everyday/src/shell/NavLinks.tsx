import { href, type Tab } from '../router';
import { Icon } from '../ui/Icon';
import { navItems } from './navItems';

type Props = {
  current: Tab | null;
  /** Class for each link: 'tab' (phone), 'rail-tab' (tablet) or 'side-tab' (desktop). */
  linkClass: string;
  className?: string;
};

/** The main navigation links. Each layout styles them through its own class. */
export function NavLinks({ current, linkClass, className }: Props) {
  return (
    <nav aria-label="Main" className={className}>
      {navItems.map((item) => (
        <a
          key={item.route}
          href={href(item.route)}
          className={linkClass}
          aria-current={item.route === current ? 'page' : undefined}
        >
          <Icon name={item.icon} />
          {item.label}
        </a>
      ))}
    </nav>
  );
}
