import { useEffect, useRef, type ReactNode } from 'react';
import { useDayStreak } from '../data/useDayStreak';
import { tabFor, type Location } from '../router';
import { DevToolbar } from './DevToolbar';
import { Rail } from './Rail';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';

type Props = {
  location: Location;
  title: string;
  /** Focused flows (add habit, later screens) hide the phone tab bar, as on the boards. */
  focused: boolean;
  children: ReactNode;
};

/**
 * One layout for every size. CSS shows the tab bar (phone), the rail (tablet)
 * or the sidebar (desktop); the hidden ones are display:none, so they are not read out.
 */
export function AppShell({ location, title, focused, children }: Props) {
  const streak = useDayStreak();
  const tab = tabFor(location.route);
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(location.path);

  useEffect(() => {
    document.title = `${title} · Everyday`;
  }, [title]);

  useEffect(() => {
    // After moving to another page (not on first load), put focus on the new page heading
    // so keyboard and screen reader users land there.
    if (previousPath.current === location.path) return;
    previousPath.current = location.path;
    window.scrollTo(0, 0);
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [location.path]);

  return (
    <div className={focused ? 'shell shell--focused' : 'shell'}>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          // The hash is used for routing, so focus the content directly instead.
          e.preventDefault();
          mainRef.current?.querySelector<HTMLElement>('h1')?.focus();
        }}
      >
        Skip to content
      </a>
      <Rail current={tab} route={location.route} streak={streak} />
      <Sidebar current={tab} route={location.route} streak={streak} />
      <main id="main" ref={mainRef} key={location.path} className="page">
        {children}
        {import.meta.env.DEV && <DevToolbar />}
      </main>
      {!focused && <TabBar current={tab} />}
    </div>
  );
}
