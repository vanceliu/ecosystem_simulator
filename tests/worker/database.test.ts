import { describe, expect, it } from 'vitest';
import { referenceVersion } from '../../src/persistence/database';
import { MIGRATIONS, REFERENCE_SEEDS } from '../../src/worker/bundledSql';
import { openDatabase } from '../../src/worker/database';
import { migrationFiles, referenceSeeds } from '../../tools/reference-node';
import { params } from '../params';

const byName = <T extends { readonly sql: string }>(
  entries: readonly T[],
  key: (entry: T) => string,
) => Object.fromEntries(entries.map((entry) => [key(entry), entry.sql]));

describe('worker database (docs/10 §1, §5)', () => {
  it('bundles the same migrations and seeds as on disk', () => {
    expect(byName(MIGRATIONS, (entry) => entry.name)).toEqual(
      byName(migrationFiles(), (entry) => entry.name),
    );
    expect(byName(REFERENCE_SEEDS, (entry) => entry.path)).toEqual(
      byName(referenceSeeds(), (entry) => entry.path),
    );
    expect(referenceVersion(REFERENCE_SEEDS)).toBe(referenceVersion(referenceSeeds()));
  });

  it('falls back to memory without OPFS and loads the parameter set', async () => {
    const opened = await openDatabase();
    try {
      expect(opened.storage).toBe('memory');
      expect(opened.referenceImported).toBe(true);
      expect(opened.params).toEqual(params);
    } finally {
      opened.db.close();
    }
  });
});
