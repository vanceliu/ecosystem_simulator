import init from '@sqlite.org/sqlite-wasm';
import { describe, expect, it } from 'vitest';

describe('sqlite-wasm on Node', () => {
  it('runs an in-memory database round trip', async () => {
    const sqlite3 = await init();
    const db = new sqlite3.oo1.DB(':memory:');
    try {
      db.exec('CREATE TABLE codex_species (species_id TEXT PRIMARY KEY, common_name TEXT)');
      db.exec({
        sql: 'INSERT INTO codex_species (species_id, common_name) VALUES (?, ?)',
        bind: ['copepod:3f9k2a', '赤斑劍水蚤'],
      });
      const rows = db.selectObjects('SELECT species_id, common_name FROM codex_species');
      expect(rows).toEqual([{ species_id: 'copepod:3f9k2a', common_name: '赤斑劍水蚤' }]);
    } finally {
      db.close();
    }
  });
});
