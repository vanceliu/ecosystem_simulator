import type { Migration, ReferenceSeed } from '../persistence/database';

const MIGRATION_DIR = '../persistence/migrations/';
const REFERENCE_DIR = '../../db/reference/';

const migrationFiles = import.meta.glob<string>('../persistence/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const referenceFiles = import.meta.glob<string>('../../db/reference/**/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Migration files bundled into the worker, named as on disk. */
export const MIGRATIONS: readonly Migration[] = Object.entries(migrationFiles).map(
  ([path, sql]) => ({ name: path.slice(MIGRATION_DIR.length), sql }),
);

/** Reference seeds bundled into the worker; paths relative to db/reference. */
export const REFERENCE_SEEDS: readonly ReferenceSeed[] = Object.entries(referenceFiles).map(
  ([path, sql]) => ({ path: path.slice(REFERENCE_DIR.length), sql }),
);
