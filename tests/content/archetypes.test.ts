import { describe, expect, it } from 'vitest';
import { ARCHETYPE_IDS } from '../../src/content/archetypeIds';
import { params } from '../params';
import { archetypeProblems } from './archetypeRules';

describe('archetype reference data (docs/02, docs/09)', () => {
  it('lists 111 unique archetypes', () => {
    expect(new Set(ARCHETYPE_IDS).size).toBe(111);
    expect(Object.keys(params.archetypes).sort()).toEqual([...ARCHETYPE_IDS].sort());
  });

  it.each(ARCHETYPE_IDS)('%s passes the archetype rules', (id) => {
    expect(archetypeProblems(params.sources, params.archetypes[id])).toEqual([]);
  });

  it('uses unique naming stems', () => {
    const stems = ARCHETYPE_IDS.map((id) => params.archetypes[id].latinStem);
    expect(new Set(stems).size).toBe(stems.length);
  });
});
