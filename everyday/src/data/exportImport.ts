import { todayKey } from '../lib/dates';
import { store, TABLE_NAMES } from './store';

/** Everything, decrypted, as one JSON file saved to this device. Only you can read it. */
export function buildExport(): string {
  const tables = Object.fromEntries(TABLE_NAMES.map((name) => [name, store.all(name)]));
  return JSON.stringify({ app: 'Everyday', format: 2, exportedAt: new Date().toISOString(), ...tables }, null, 2);
}

export function exportAllData() {
  const blob = new Blob([buildExport()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `everyday-export-${todayKey()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
