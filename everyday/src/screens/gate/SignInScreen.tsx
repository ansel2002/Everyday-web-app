import { useRef, useState, type FormEvent } from 'react';
import { sendMagicLink } from '../../data/session';
import { EncryptedNote, GateCard } from './GateCard';

/** Sign in with an emailed link. No password. */
export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setMessage('That email address does not look complete yet.');
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await sendMagicLink(address);
      setSentTo(address);
    } catch (error) {
      setMessage(
        navigator.onLine
          ? `The link could not be sent just now (${(error as Error).message}). Try again in a minute.`
          : 'You are offline. Connect to the internet to sign in.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <GateCard title="Check your email">
        <p className="gate__text" role="status">
          We sent a sign-in link to <strong>{sentTo}</strong>. Open it on this device to continue.
        </p>
        <button type="button" className="link-btn gate__center" onClick={() => setSentTo('')}>
          Use a different email
        </button>
        <EncryptedNote />
      </GateCard>
    );
  }

  return (
    <GateCard title="Welcome to Everyday">
      <p className="gate__text">A few quiet minutes a day: small lessons, a short journal and gentle habits.</p>
      <form className="gate__form" onSubmit={submit} noValidate>
        <label htmlFor="email" className="field-label">Your email</label>
        <input
          id="email"
          ref={inputRef}
          className="field add-habit__input"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          aria-describedby="email-message"
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage('');
          }}
        />
        <p id="email-message" role="status" className="setting-note">{message}</p>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>
      <EncryptedNote />
    </GateCard>
  );
}
