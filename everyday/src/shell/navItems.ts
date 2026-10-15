import type { Route, Tab } from '../router';
import type { IconName } from '../ui/Icon';

/** The four main tabs, shared by the tab bar, rail and sidebar. */
export const navItems: { route: Tab; label: string; icon: IconName }[] = [
  { route: 'today', label: 'Today', icon: 'sun' },
  { route: 'lessons', label: 'Lessons', icon: 'book' },
  { route: 'habits', label: 'Habits', icon: 'habit' },
  { route: 'journal', label: 'Journal', icon: 'journal' },
];

/** Quieter tools. Listed in the desktop sidebar, and on the More page (phone and tablet). */
export const moreItems: { route: Route; label: string; description: string; icon: IconName }[] = [
  { route: 'calm', label: 'Calm corner', description: 'A few quiet minutes', icon: 'rings' },
  { route: 'focus', label: 'Focus', description: 'One thing, for a little while', icon: 'timer' },
  { route: 'weekly', label: 'Weekly review', description: 'Wins, and what matters next', icon: 'calendar' },
  { route: 'insights', label: 'Mood insights', description: 'What tends to lift you', icon: 'bars' },
  { route: 'settings', label: 'Settings', description: 'Theme, reminders, your data', icon: 'sliders' },
];
