import init from '@sqlite.org/sqlite-wasm';
import { describe, expect, it } from 'vitest';
import {
  importReference,
  migrate,
  readParameterSet,
  referenceVersion,
} from '../../src/persistence/database';
import { migrationFiles, openReferenceDatabase, referenceSeeds } from '../../tools/reference-node';

const LEAF_TABLES = ['ref_param', 'ref_archetype_param'] as const;

describe('reference seeds (docs/10 §2.1)', async () => {
  const db = await openReferenceDatabase();
  const count = (sql: string): number => Number(Object.values(db.selectObjects(sql)[0] ?? {})[0]);

  it('satisfy every foreign key', () => {
    expect(db.selectObjects('PRAGMA foreign_key_check')).toEqual([]);
  });

  it.each(LEAF_TABLES)('%s: measured and derived values cite a source', (table) => {
    expect(
      count(
        `SELECT COUNT(*) FROM ${table} WHERE basis IN ('measured', 'derived') AND source_id IS NULL`,
      ),
    ).toBe(0);
  });

  it.each(LEAF_TABLES)('%s: derived values state their derivation', (table) => {
    expect(
      count(
        `SELECT COUNT(*) FROM ${table} WHERE basis = 'derived' AND COALESCE(derivation, '') = ''`,
      ),
    ).toBe(0);
  });

  it.each(LEAF_TABLES)('%s: estimated values carry a note', (table) => {
    expect(
      count(`SELECT COUNT(*) FROM ${table} WHERE basis = 'estimated' AND COALESCE(note, '') = ''`),
    ).toBe(0);
  });

  it.each(LEAF_TABLES)('%s: provenance only on numbers', (table) => {
    expect(
      count(`SELECT COUNT(*) FROM ${table} WHERE basis IS NOT NULL AND kind <> 'number'`),
    ).toBe(0);
  });

  it('build a parameter set', () => {
    expect(Object.keys(readParameterSet(db).archetypes)).toHaveLength(111);
  });
});

describe('migrations and reference import (docs/10 §5)', () => {
  it('migrate once, import once, and re-import when the seeds change', async () => {
    const sqlite3 = await init();
    const db = new sqlite3.oo1.DB(':memory:');
    try {
      const migrations = migrationFiles();
      migrate(db, migrations);
      const version = Number(Object.values(db.selectObjects('PRAGMA user_version')[0] ?? {})[0]);
      expect(version).toBe(migrations.length);
      migrate(db, migrations);
      const seeds = referenceSeeds();
      expect(importReference(db, seeds)).toBe(true);
      expect(importReference(db, seeds)).toBe(false);
      const changed = [...seeds, { path: 'zz-extra.sql', sql: '' }];
      expect(referenceVersion(changed)).not.toBe(referenceVersion(seeds));
      expect(importReference(db, changed)).toBe(true);
      expect(Object.keys(readParameterSet(db).archetypes)).toHaveLength(111);
    } finally {
      db.close();
    }
  });
});
