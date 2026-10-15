import { useState } from 'react';
import { exportAllData } from '../../data/exportImport';
import { deleteEverything } from '../../data/session';
import { Dialog } from '../../ui/Dialog';
import { Icon } from '../../ui/Icon';

/** Delete everything. Keeping is the primary, focused action; no red. */
export function DeleteAllDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [message, setMessage] = useState('');

  async function remove() {
    try {
      await deleteEverything();
    } catch {
      setMessage(navigator.onLine ? 'That did not work just now. Please try again.' : 'Deleting needs a connection, so the cloud copy goes too.');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy="delete-title" describedBy="delete-text">
      <h2 id="delete-title" className="dialog__title">Delete everything?</h2>
      <p id="delete-text" className="dialog__text">
        Your account, journal, moods, habits and lesson progress will be removed from this device and the cloud. This cannot be undone.
        You might like to export a copy first.
      </p>
      <button type="button" className="btn btn--primary" autoFocus onClick={onClose}>
        Keep my data
      </button>
      <button type="button" className="btn btn--outline btn--tall" onClick={() => exportAllData()}>
        <Icon name="download" size={20} />
        Export a copy
      </button>
      <button type="button" className="btn btn--outline btn--tall" onClick={remove}>
        <Icon name="trash" size={20} />
        Delete everything
      </button>
      <p role="status" className="setting-note">{message}</p>
    </Dialog>
  );
}
