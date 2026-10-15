import { useRef, useState, type FormEvent } from 'react';
import { isValidPassphrase } from '../../data/keys';
import { choosePassphrase, deleteEverything, enterPassphrase, signOut } from '../../data/session';
import { Dialog } from '../../ui/Dialog';
import { Icon } from '../../ui/Icon';
import { EncryptedNote, GateCard } from './GateCard';

/** First time: choose a passphrase. On a new device (or after a forgotten PIN): enter it. */
export function PassphraseScreen({ mode, email }: { mode: 'create' | 'enter'; email: string | null }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    if (mode === 'create') {
      if (!isValidPassphrase(first)) return setMessage('Use at least 10 characters. A few unusual words work well.');
      if (first !== second) return setMessage('The two passphrases do not match yet. Try once more.');
    }
    setBusy(true);
    try {
      if (mode === 'create') await choosePassphrase(first);
      else await enterPassphrase(first);
    } catch {
      setBusy(false);
      setFirst('');
      setMessage(
        mode === 'enter'
          ? 'That passphrase does not open your journal. Take your time and try again.'
          : 'Your passphrase could not be saved. Check your connection and try again.',
      );
      firstRef.current?.focus();
    }
  }

  return (
    <GateCard title={mode === 'create' ? 'Choose a passphrase' : 'Enter your passphrase'}>
      <p className="gate__text">
        {mode === 'create'
          ? 'Everything you write is encrypted with this passphrase before it leaves your device. No one else can read it, including us.'
          : `Signed in as ${email ?? 'you'}. Your passphrase unlocks your journal on this device.`}
      </p>
      {mode === 'create' && (
        <p className="gate__warning">
          <Icon name="sun" size={18} />
          Write it down somewhere safe. If it is lost, your data cannot be recovered.
        </p>
      )}
      <form className="gate__form" onSubmit={submit} noValidate>
        <label htmlFor="passphrase" className="field-label">Passphrase</label>
        <input
          id="passphrase"
          ref={firstRef}
          className="field add-habit__input"
          type="password"
          autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        />
        {mode === 'create' && (
          <>
            <label htmlFor="passphrase-again" className="field-label">Type it again</label>
            <input
              id="passphrase-again"
              className="field add-habit__input"
              type="password"
              autoComplete="new-password"
              value={second}
              onChange={(e) => setSecond(e.target.value)}
            />
          </>
        )}
        <p role="status" className="setting-note">{message}</p>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? (mode === 'create' ? 'Setting up…' : 'Unlocking…') : mode === 'create' ? 'Save passphrase' : 'Unlock'}
        </button>
      </form>
      {mode === 'enter' && (
        <button type="button" className="link-btn gate__center" onClick={() => setForgot(true)}>
          Forgot your passphrase?
        </button>
      )}
      <button type="button" className="link-btn gate__center" onClick={() => signOut()}>
        Sign out
      </button>
      <EncryptedNote />
      <Dialog open={forgot} onClose={() => setForgot(false)} labelledBy="forgot-title" describedBy="forgot-text">
        <h2 id="forgot-title" className="dialog__title">Start over?</h2>
        <p id="forgot-text" className="dialog__text">
          Your passphrase is the only key to your journal, so it cannot be reset. You can start over with a new
          passphrase, but everything saved so far will be deleted.
        </p>
        <button type="button" className="btn btn--primary" autoFocus onClick={() => setForgot(false)}>
          Keep trying
        </button>
        <button type="button" className="btn btn--outline btn--tall" onClick={() => deleteEverything()}>
          <Icon name="trash" size={20} />
          Delete and start over
        </button>
      </Dialog>
    </GateCard>
  );
}
