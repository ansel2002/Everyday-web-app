import { useState, type FormEvent } from 'react';
import { isValidPin, setPinLock } from '../../data/keys';
import { Dialog } from '../../ui/Dialog';

/** Choose a PIN (typed twice). */
export function SetPinDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [message, setMessage] = useState('');

  function close() {
    setFirst('');
    setSecond('');
    setMessage('');
    onClose();
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!isValidPin(first)) return setMessage('Use 4 to 8 digits.');
    if (first !== second) return setMessage('The two PINs do not match yet. Try once more.');
    await setPinLock(first);
    close();
  }

  return (
    <Dialog open={open} onClose={close} labelledBy="pin-title" describedBy="pin-text">
      <form className="dialog__form" onSubmit={save} noValidate>
        <h2 id="pin-title" className="dialog__title">Choose a PIN</h2>
        <p id="pin-text" className="dialog__text">
          Everyday will ask for it when opening. Until then, your data on this device stays encrypted. If you forget it, your passphrase still works.
        </p>
        <label className="field-label" htmlFor="pin-first">PIN, 4 to 8 digits</label>
        <input
          id="pin-first"
          className="field pin-field"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={8}
          value={first}
          onChange={(e) => setFirst(e.target.value.replace(/\D/g, ''))}
        />
        <label className="field-label" htmlFor="pin-second">Type it again</label>
        <input
          id="pin-second"
          className="field pin-field"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={8}
          value={second}
          onChange={(e) => setSecond(e.target.value.replace(/\D/g, ''))}
        />
        <p role="status" className="setting-note">{message}</p>
        <button type="submit" className="btn btn--primary">Save PIN</button>
        <button type="button" className="btn btn--outline btn--tall" onClick={close}>Not now</button>
      </form>
    </Dialog>
  );
}
