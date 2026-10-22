import init from '@sqlite.org/sqlite-wasm';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ParameterSet } from '../src/content/parameters';
import {
  importReference,
  migrate,
  readParameterSet,
  type Migration,
  type ReferenceSeed,
  type SqlDatabase,
} from '../src/persistence/database';

const ROOT = join(import.meta.dirname, '..');
const MIGRATIONS = join(ROOT, 'src/persistence/migrations');
export const REFERENCE_DIR = join(ROOT, 'db/reference');

function sqlFiles(directory: string): string[] {
  return readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.sql'))
    .map((name) => join(directory, name));
}

export const migrationFiles = (): Migration[] =>
  sqlFiles(MIGRATIONS).map((file) => ({
    name: relative(MIGRATIONS, file),
    sql: readFileSync(file, 'utf8'),
  }));

export const referenceSeeds = (): ReferenceSeed[] =>
  sqlFiles(REFERENCE_DIR).map((file) => ({
    path: relative(REFERENCE_DIR, file).split('\\').join('/'),
    sql: readFileSync(file, 'utf8'),
  }));

/** An in-memory database with all migrations and reference seeds applied. */
export async function openReferenceDatabase(): Promise<SqlDatabase & { close(): void }> {
  const sqlite3 = await init();
  const db = new sqlite3.oo1.DB(':memory:');
  migrate(db, migrationFiles());
  importReference(db, referenceSeeds());
  return db;
}

let cached: Promise<ParameterSet> | null = null;

/** The parameter set read from the SQL seeds through SQLite, as the worker does. */
export function loadParameterSet(): Promise<ParameterSet> {
  cached ??= openReferenceDatabase().then((db) => {
    try {
      return readParameterSet(db);
    } finally {
      db.close();
    }
  });
  return cached;
}
