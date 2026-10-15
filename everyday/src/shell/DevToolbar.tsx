import { clearAllData } from '../data/demo';
import { setThemePreference, useThemePreference, type ThemePreference } from '../theme/useTheme';

const options: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Development only: theme switch and demo data. Never shipped in the production build. */
export function DevToolbar() {
  const current = useThemePreference();
  return (
    <div className="dev-toolbar" aria-label="Developer tools" role="region">
      <div role="group" aria-label="Theme (development only)" className="dev-theme">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={current === o.value} onClick={() => setThemePreference(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      <a className="dev-pill" href={`?demo${window.location.hash}`}>Load demo data</a>
      <button className="dev-pill" type="button" onClick={() => clearAllData()}>Clear data</button>
    </div>
  );
}
