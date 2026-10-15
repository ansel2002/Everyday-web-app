import { boot, signOut } from '../../data/session';
import { GateCard } from './GateCard';

/** A new device needs the cloud once, to fetch the encrypted key. */
export function NeedsConnectionScreen() {
  return (
    <GateCard title="Almost there">
      <p className="gate__text">
        To open your journal on this device for the first time, Everyday needs a connection once. After that it works
        offline too.
      </p>
      <button type="button" className="btn btn--primary" onClick={() => boot()}>Try again</button>
      <button type="button" className="link-btn gate__center" onClick={() => signOut()}>Sign out</button>
    </GateCard>
  );
}

/** Production build without Supabase settings. */
export function NotConfiguredScreen() {
  return (
    <GateCard title="Not set up yet">
      <p className="gate__text">
        This copy of Everyday has no cloud settings. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then build
        again.
      </p>
    </GateCard>
  );
}

export function LoadingScreen() {
  return (
    <main className="gate" aria-busy="true">
      <span className="rail__logo gate__logo" aria-hidden="true" />
      <span className="sr-only" role="status">Opening Everyday</span>
    </main>
  );
}
