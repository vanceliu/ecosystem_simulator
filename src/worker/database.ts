import init from '@sqlite.org/sqlite-wasm';
import type { ParameterSet } from '../content/parameters';
import {
  importReference,
  migrate,
  readParameterSet,
  type SqlDatabase,
} from '../persistence/database';
import { MIGRATIONS, REFERENCE_SEEDS } from './bundledSql';

/** docs/10 §1 */
export const DATABASE_FILE = '/ecosim.sqlite3';

/** opfs = persisted in OPFS; memory = lost on reload (docs/10 §1). */
export type Storage = 'opfs' | 'memory';

export interface OpenDatabase {
  readonly db: SqlDatabase & { close(): void };
  readonly storage: Storage;
  readonly params: ParameterSet;
  /** reference data was (re)imported during this open */
  readonly referenceImported: boolean;
}

/** Opens the database, applies migrations and reference data, and reads the parameter set. */
export async function openDatabase(): Promise<OpenDatabase> {
  const sqlite3 = await init();
  let db: SqlDatabase & { close(): void };
  let storage: Storage;
  try {
    const pool = await sqlite3.installOpfsSAHPoolVfs({});
    db = new pool.OpfsSAHPoolDb(DATABASE_FILE);
    storage = 'opfs';
  } catch {
    db = new sqlite3.oo1.DB(':memory:');
    storage = 'memory';
  }
  migrate(db, MIGRATIONS);
  const referenceImported = importReference(db, REFERENCE_SEEDS);
  return { db, storage, params: readParameterSet(db), referenceImported };
}
