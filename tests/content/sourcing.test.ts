import { describe, expect, it } from 'vitest';
import { ARCHETYPE_IDS } from '../../src/content/archetypeIds';
import { HABITAT_IDS } from '../../src/content/habitats';
import { SUBSTANCE_IDS } from '../../src/content/substances';
import { params } from '../params';
import { sourcingProblems } from './archetypeRules';

const GROUPS = {
  stoichiometry: params.stoichiometry,
  microbes: params.microbes,
  physiology: params.physiology,
  tankOptions: params.tankOptions,
  waterSources: params.waterSources,
  climate: params.climate,
} as const;

describe('biological and physical parameters carry provenance (CLAUDE.md)', () => {
  it.each(Object.entries(GROUPS))('%s', (name, group) => {
    const problems: string[] = [];
    sourcingProblems(params.sources, group, name, problems);
    expect(problems).toEqual([]);
  });
});

describe('reference data coverage', () => {
  it('defines every substance pool (docs/04 §3)', () => {
    expect(Object.keys(params.substances).sort()).toEqual([...SUBSTANCE_IDS].sort());
  });

  it('gives every archetype a native range with a valid basis (docs/11 §6.3)', () => {
    for (const id of ARCHETYPE_IDS) {
      const range = params.nativeRanges[id];
      expect(range.realms.length + range.oceans.length, id).toBeGreaterThan(0);
      if (range.basis === 'measured') expect(params.sources, id).toHaveProperty(range.source ?? '');
    }
  });

  it('defines 20 selectable climates with provenance (docs/11 §2)', () => {
    const entries = Object.values(params.climate.normals);
    expect(entries).toHaveLength(20);
    for (const normal of entries) {
      if (normal === undefined) continue;
      expect(normal.tWarm).toBeGreaterThan(normal.tCold);
      if (normal.provenance.basis === 'measured') {
        expect(params.sources).toHaveProperty(normal.provenance.source);
      }
    }
  });

  it('defines 15 habitats with consistent ranges (docs/11 §5)', () => {
    expect(Object.keys(params.habitats.specs).sort()).toEqual([...HABITAT_IDS].sort());
    for (const habitat of Object.values(params.habitats.specs)) {
      expect(habitat.landPercent.min, habitat.id).toBeLessThanOrEqual(habitat.landPercent.max);
      expect(habitat.allowedZones.length, habitat.id).toBeGreaterThan(0);
    }
  });
});
