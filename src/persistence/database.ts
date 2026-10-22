import { buildParameterSet, type ParameterSet } from '../content/parameters';
import { readReferenceRows } from './reference';

/** The SQLite operations persistence needs; implemented by sqlite-wasm's oo1.DB. */
export interface SqlDatabase {
  exec(sql: string): unknown;
  selectObjects(sql: string): Record<string, unknown>[];
}

/** A migration file `NNNN_描述.sql`. */
export interface Migration {
  readonly name: string;
  readonly sql: string;
}

/** A reference seed file under db/reference. */
export interface ReferenceSeed {
  readonly path: string;
  readonly sql: string;
}

const REFERENCE_TABLES = [
  'ref_archetype_tag',
  'ref_archetype_param',
  'ref_archetype',
  'ref_param',
  'ref_substance',
  'ref_source',
] as const;

const MIGRATION_NAME = /^(\d{4})_.+\.sql$/;

function migrationVersion(name: string): number {
  const base = name.slice(name.lastIndexOf('/') + 1);
  const match = MIGRATION_NAME.exec(base);
  if (match?.[1] === undefined) throw new Error(`Invalid migration file name: ${name}`);
  return Number(match[1]);
}

function scalar(db: SqlDatabase, sql: string): unknown {
  const row = db.selectObjects(sql)[0];
  return row === undefined ? undefined : Object.values(row)[0];
}

function inTransaction(db: SqlDatabase, body: () => void): void {
  db.exec('BEGIN');
  try {
    body();
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/** docs/10 §5: applies migrations above `user_version`, one transaction each. */
export function migrate(db: SqlDatabase, migrations: readonly Migration[]): void {
  db.exec('PRAGMA foreign_keys = ON');
  const current = Number(scalar(db, 'PRAGMA user_version') ?? 0);
  const pending = migrations
    .map((migration) => ({ ...migration, version: migrationVersion(migration.name) }))
    .filter((migration) => migration.version > current)
    .sort((a, b) => a.version - b.version);
  for (const migration of pending) {
    inTransaction(db, () => {
      db.exec(migration.sql);
      db.exec(`PRAGMA user_version = ${migration.version}`);
    });
  }
}

/** FNV-1a 32-bit over the seed paths and contents, as 8 hex digits. */
export function referenceVersion(seeds: readonly ReferenceSeed[]): string {
  let hash = 0x811c9dc5;
  for (const seed of orderedSeeds(seeds)) {
    const text = `${seed.path}\n${seed.sql}\n`;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const orderedSeeds = (seeds: readonly ReferenceSeed[]): ReferenceSeed[] =>
  [...seeds].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

/** docs/10 §2.1: replaces every ref_ table when `meta.reference_version` differs; true when imported. */
export function importReference(db: SqlDatabase, seeds: readonly ReferenceSeed[]): boolean {
  const version = referenceVersion(seeds);
  const stored = scalar(db, "SELECT value FROM meta WHERE key = 'reference_version'");
  if (stored === version) return false;
  inTransaction(db, () => {
    db.exec('PRAGMA defer_foreign_keys = ON');
    for (const table of REFERENCE_TABLES) db.exec(`DELETE FROM ${table}`);
    for (const seed of orderedSeeds(seeds)) if (seed.sql.trim() !== '') db.exec(seed.sql);
    db.exec(
      `INSERT INTO meta (key, value) VALUES ('reference_version', '${version}') ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    );
  });
  return true;
}

/** The typed parameter set read from the ref_ tables. */
export function readParameterSet(db: SqlDatabase): ParameterSet {
  return buildParameterSet(readReferenceRows((sql) => db.selectObjects(sql)));
}
