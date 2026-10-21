import { describe, expect, it } from 'vitest';
import { ARCHETYPE_IDS, type ArchetypeId } from '../../src/content/archetypeIds';
import { ARCHETYPE_GROUPS } from '../../src/content/archetypes/groups';
import { ARCHETYPE_DATA, getArchetype } from '../../src/content/archetypes/index';
import { ARCHETYPE_SKELETONS } from '../../src/content/archetypes/skeleton';
import { SOURCE_GROUPS, SOURCES } from '../../src/content/sources';
import { archetypeProblems } from './archetypeRules';

describe('archetype groups', () => {
  it('cover every archetype exactly once', () => {
    const grouped = Object.values(ARCHETYPE_GROUPS).flat();
    expect(grouped).toHaveLength(ARCHETYPE_IDS.length);
    expect(new Set(grouped)).toEqual(new Set(ARCHETYPE_IDS));
  });

  it('never reuse a source key across groups', () => {
    const total = SOURCE_GROUPS.reduce((sum, group) => sum + Object.keys(group).length, 0);
    expect(Object.keys(SOURCES)).toHaveLength(total);
  });

  it('have a skeleton for every archetype', () => {
    expect(Object.keys(ARCHETYPE_SKELETONS).sort()).toEqual([...ARCHETYPE_IDS].sort());
  });
});

for (const [group, ids] of Object.entries(ARCHETYPE_GROUPS)) {
  describe(`archetype data: ${group}`, () => {
    it.each(ids as readonly ArchetypeId[])('%s', (id) => {
      expect(ARCHETYPE_DATA[id], `${id} has no data yet`).toBeDefined();
      const archetype = getArchetype(id);
      expect(archetype.kind).toBe(ARCHETYPE_SKELETONS[id].kind);
      expect(archetypeProblems(archetype)).toEqual([]);
    });
  });
}

describe('archetype naming stems', () => {
  it('are unique across archetypes', () => {
    const stems = ARCHETYPE_IDS.filter((id) => ARCHETYPE_DATA[id] !== undefined).map(
      (id) => getArchetype(id).latinStem,
    );
    expect(new Set(stems).size).toBe(stems.length);
  });
});
