import Dexie from 'dexie';
import { store, TABLE_NAMES } from './store';
import type { TableName, Tables } from './types';

/**
 * The first version of Everyday kept data unencrypted in a local database called
 * "everyday". When an account is set up on that device, bring the data across
 * (it is then encrypted and synced like everything else) and delete the old copy.
 */
export async function importLegacyData(): Promise<number> {
  if (!(await Dexie.exists('everyday'))) return 0;
  const old = new Dexie('everyday');
  let count = 0;
  try {
    await old.open();
    const names = old.tables.map((t) => t.name).filter((n): n is TableName => (TABLE_NAMES as string[]).includes(n));
    const rows: { table: TableName; row: Tables[TableName] }[] = [];
    for (const name of names) {
      // The old PIN setting is replaced by the new PIN lock, so it is not copied.
      for (const row of await old.table(name).toArray()) {
        if (name === 'settings' && (row as { key: string }).key === 'pin') continue;
        rows.push({ table: name, row });
      }
    }
    store.batch(() => {
      for (const { table, row } of rows) store.put(table, row as never);
    });
    count = rows.length;
  } finally {
    old.close();
  }
  await Dexie.delete('everyday');
  return count;
}
