import { useEffect, useRef, useState, type FormEvent } from 'react';
import { enterPin, switchToPassphrase } from '../../data/session';
import { EncryptedNote, GateCard } from './GateCard';

/** PIN lock is on for this device: the data stays encrypted until the PIN is entered. */
export function PinScreen() {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await enterPin(pin);
    } catch {
      setBusy(false);
      setPin('');
      setMessage('That PIN does not match. Take your time and try again.');
      inputRef.current?.focus();
    }
  }

  return (
    <GateCard title="Welcome back">
      <form className="gate__form" onSubmit={submit} noValidate>
        <label htmlFor="unlock-pin" className="field-label">Enter your PIN</label>
        <input
          id="unlock-pin"
          ref={inputRef}
          className="field pin-field"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={8}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''));
            setMessage('');
          }}
        />
        <p role="status" className="setting-note">{message}</p>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
      <button type="button" className="link-btn gate__center" onClick={() => switchToPassphrase()}>
        Forgot your PIN? Use your passphrase
      </button>
      <EncryptedNote />
    </GateCard>
  );
}
