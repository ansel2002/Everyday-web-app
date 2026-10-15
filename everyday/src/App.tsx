import { useSession } from './data/session';
import { useLocation, type Location } from './router';
import { AppShell } from './shell/AppShell';
import { CalmScreen } from './screens/calm/CalmScreen';
import { FocusScreen } from './screens/focus/FocusScreen';
import { LoadingScreen, NeedsConnectionScreen, NotConfiguredScreen } from './screens/gate/MessageScreens';
import { PassphraseScreen } from './screens/gate/PassphraseScreen';
import { PinScreen } from './screens/gate/PinScreen';
import { SignInScreen } from './screens/gate/SignInScreen';
import { HabitsScreen } from './screens/habits/HabitsScreen';
import { InsightsScreen } from './screens/insights/InsightsScreen';
import { JournalScreen } from './screens/journal/JournalScreen';
import { LessonsScreen } from './screens/lessons/LessonsScreen';
import { MoreScreen } from './screens/more/MoreScreen';
import { SettingsScreen } from './screens/settings/SettingsScreen';
import { TodayScreen } from './screens/today/TodayScreen';
import { WeeklyScreen } from './screens/weekly/WeeklyScreen';

type Page = {
  title: string;
  screen: JSX.Element;
  /** Focused flows hide the phone tab bar. */
  focused?: boolean;
};

function screenFor({ route, param }: Location): Page {
  switch (route) {
    case 'lessons':
      return { title: 'Lessons', screen: <LessonsScreen param={param} /> };
    case 'habits':
      return { title: param ? 'New habit' : 'Habits', screen: <HabitsScreen param={param} />, focused: param.startsWith('new') };
    case 'journal':
      return { title: 'Journal', screen: <JournalScreen /> };
    case 'more':
      return { title: 'More', screen: <MoreScreen /> };
    case 'insights':
      return { title: 'Mood insights', screen: <InsightsScreen />, focused: true };
    case 'focus':
      return { title: 'Focus', screen: <FocusScreen />, focused: true };
    case 'calm':
      return { title: 'Calm corner', screen: <CalmScreen />, focused: true };
    case 'weekly':
      return { title: 'Weekly review', screen: <WeeklyScreen />, focused: true };
    case 'settings':
      return { title: 'Settings', screen: <SettingsScreen />, focused: true };
    default:
      return { title: 'Today', screen: <TodayScreen /> };
  }
}

export function App() {
  const session = useSession();
  const location = useLocation();

  switch (session.name) {
    case 'loading':
      return <LoadingScreen />;
    case 'not-configured':
      return <NotConfiguredScreen />;
    case 'signed-out':
      return <SignInScreen />;
    case 'create-passphrase':
      return <PassphraseScreen mode="create" email={session.user.email} />;
    case 'enter-passphrase':
      return <PassphraseScreen mode="enter" email={session.user.email} />;
    case 'enter-pin':
      return <PinScreen />;
    case 'needs-connection':
      return <NeedsConnectionScreen />;
  }

  const { title, screen, focused = false } = screenFor(location);
  return (
    <AppShell location={location} title={title} focused={focused}>
      {screen}
    </AppShell>
  );
}
