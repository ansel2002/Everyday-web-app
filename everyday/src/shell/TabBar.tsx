import type { Tab } from '../router';
import { NavLinks } from './NavLinks';

/** Phone: bottom tab bar. */
export function TabBar({ current }: { current: Tab | null }) {
  return <NavLinks current={current} className="tabbar" linkClass="tab" />;
}
