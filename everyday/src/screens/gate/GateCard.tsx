import { useEffect, type ReactNode } from 'react';
import { Icon } from '../../ui/Icon';

/** A calm, centred card for the steps before the app: sign in, passphrase, PIN. */
export function GateCard({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Everyday`;
  }, [title]);

  return (
    <main className="gate">
      <div className="card gate__card">
        <span className="rail__logo gate__logo" aria-hidden="true">
          <Icon name="sun" />
        </span>
        <h1 className="gate__title">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function EncryptedNote() {
  return (
    <p className="privacy-note privacy-note--center">
      <Icon name="lock" size={18} />
      Encrypted on this device. Only you can read it.
    </p>
  );
}
