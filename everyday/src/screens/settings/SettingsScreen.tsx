import { useState } from 'react';
import { exportAllData } from '../../data/exportImport';
import { removePinLock, usePinEnabled } from '../../data/keys';
import { PUSH_NOTES, enablePush } from '../../data/reminders';
import { signOut, useSession } from '../../data/session';
import { setSetting, useSetting } from '../../data/settings';
import { syncNow, useSyncState, type SyncState } from '../../data/sync';
import { setThemePreference, useThemePreference, type ThemePreference } from '../../theme/useTheme';
import { BackLink } from '../../ui/BackLink';
import { Icon } from '../../ui/Icon';
import { PageHeader } from '../../ui/PageHeader';
import { Switch } from '../../ui/Switch';
import { DeleteAllDialog } from './DeleteAllDialog';
import { SetPinDialog } from './SetPinDialog';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Match device' },
];

const SYNC_TEXT: Record<SyncState, string> = {
  synced: 'Saved and synced',
  syncing: 'Syncing…',
  offline: 'Offline. Changes are kept on this device and sync when you are back online.',
  error: 'Sync is paused for now. Your changes are safe on this device.',
};

export function SettingsScreen() {
  const session = useSession();
  const theme = useThemePreference();
  const reminder = useSetting('reminder');
  const pinEnabled = usePinEnabled();
  const sync = useSyncState();
  const [choosingPin, setChoosingPin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reminderNote, setReminderNote] = useState('');
  const email = session.name === 'ready' ? session.user.email : null;

  async function toggleReminder(on: boolean) {
    setSetting('reminder', on);
    setReminderNote(on ? PUSH_NOTES[await enablePush()] : '');
  }

  return (
    <>
      <BackLink to="more" className="not-desktop" />
      <PageHeader title="Settings" subtitle="Yours alone" showStreak={false} />
      <div className="later-grid">
        <section className="card later-card" aria-labelledby="theme-heading">
          <h2 id="theme-heading" className="card-heading">Theme</h2>
          <div role="group" aria-labelledby="theme-heading" className="pill-row">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                className="chip chip--pill"
                aria-pressed={theme === t.value}
                onClick={() => setThemePreference(t.value)}
              >
                {theme === t.value && <Icon name="check" size={18} strokeWidth={2.4} />}
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className="card later-card later-card--rows" aria-label="Reminders and lock">
          <div className="setting-row setting-row--tall">
            <div className="setting-row__text">
              <div id="reminder-setting" className="setting-row__label">Gentle reminder</div>
              <div id="reminder-setting-hint" className="card-caption">One quiet nudge a day</div>
            </div>
            <Switch checked={reminder} onChange={toggleReminder} labelledBy="reminder-setting" describedBy="reminder-setting-hint" />
          </div>
          <p role="status" className="setting-note">{reminderNote}</p>
          <div className="divider" />
          <div className="setting-row setting-row--tall">
            <div className="setting-row__text">
              <div id="pin-setting" className="setting-row__label">PIN lock</div>
              <div id="pin-setting-hint" className="card-caption">Ask for a PIN when opening</div>
            </div>
            <Switch
              checked={pinEnabled}
              onChange={(on) => (on ? setChoosingPin(true) : void removePinLock())}
              labelledBy="pin-setting"
              describedBy="pin-setting-hint"
            />
          </div>
        </section>

        <section className="card later-card" aria-labelledby="account-heading">
          <h2 id="account-heading" className="card-heading">Account</h2>
          <p className="later-card__text">Signed in as {email ?? 'you'}</p>
          <p className="later-card__muted" role="status">
            {SYNC_TEXT[sync.state]}
            {sync.state === 'synced' && sync.lastSynced &&
              `, ${new Date(sync.lastSynced).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
          </p>
          {sync.state === 'error' && (
            <button type="button" className="btn btn--outline" onClick={() => syncNow()}>Try syncing again</button>
          )}
          <button type="button" className="btn btn--outline" onClick={() => signOut()}>Sign out</button>
          <p className="card-caption">Signing out removes your data from this device. Your encrypted copy stays safe.</p>
        </section>

        <section className="card later-card" aria-labelledby="data-heading">
          <h2 id="data-heading" className="card-heading">Your data</h2>
          <p className="later-card__muted">
            Encrypted on this device with your passphrase before it is saved. Only you can read it.
          </p>
          <button type="button" className="btn btn--outline" onClick={() => exportAllData()}>
            Export my data
          </button>
          <button type="button" className="btn btn--outline" onClick={() => setDeleting(true)}>
            Delete all data
          </button>
        </section>
      </div>
      <SetPinDialog open={choosingPin} onClose={() => setChoosingPin(false)} />
      <DeleteAllDialog open={deleting} onClose={() => setDeleting(false)} />
    </>
  );
}
