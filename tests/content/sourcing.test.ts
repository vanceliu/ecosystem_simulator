import { describe, expect, it } from 'vitest';
import { ARCHETYPE_IDS } from '../../src/content/archetypeIds';
import * as climate from '../../src/content/climate';
import { HABITATS, HABITAT_IDS } from '../../src/content/habitats';
import * as microbes from '../../src/content/microbes';
import { NATIVE_RANGES } from '../../src/content/realms';
import { isSourced, type Sourced } from '../../src/content/sourced';
import { SOURCES } from '../../src/content/sources';
import * as stoichiometry from '../../src/content/stoichiometry';
import * as tankOptions from '../../src/content/tankOptions';
import * as waterSources from '../../src/content/waterSources';

function collectSourced(value: unknown, path: string, found: [string, Sourced][]): void {
  if (isSourced(value)) {
    found.push([path, value]);
    return;
  }
  if (typeof value !== 'object' || value === null) return;
  for (const [key, child] of Object.entries(value)) collectSourced(child, `${path}.${key}`, found);
}

const MODULES = { climate, microbes, stoichiometry, tankOptions, waterSources };
const sourcedValues: [string, Sourced][] = [];
for (const [name, module] of Object.entries(MODULES)) collectSourced(module, name, sourcedValues);

describe('biological and physical parameters carry provenance (CLAUDE.md)', () => {
  it('finds sourced parameters', () => {
    expect(sourcedValues.length).toBeGreaterThan(50);
  });

  it.each(sourcedValues)('%s', (_path, sourced) => {
    expect(Number.isFinite(sourced.value)).toBe(true);
    switch (sourced.basis) {
      case 'measured':
        expect(SOURCES).toHaveProperty(sourced.source);
        break;
      case 'derived':
        expect(SOURCES).toHaveProperty(sourced.source);
        expect(sourced.derivation.length).toBeGreaterThan(0);
        break;
      case 'estimated':
        expect(sourced.note.length).toBeGreaterThan(0);
        if (sourced.source !== undefined) expect(SOURCES).toHaveProperty(sourced.source);
        break;
    }
  });
});

describe('reference data coverage', () => {
  it('lists 111 unique archetypes (docs/02)', () => {
    expect(new Set(ARCHETYPE_IDS).size).toBe(111);
  });

  it('gives every archetype a native range with a valid basis (docs/11 §6.3)', () => {
    for (const id of ARCHETYPE_IDS) {
      const range = NATIVE_RANGES[id];
      expect(range.realms.length + range.oceans.length, id).toBeGreaterThan(0);
      if (range.basis === 'measured') expect(SOURCES, id).toHaveProperty(range.source ?? '');
    }
  });

  it('defines 20 selectable climates with provenance (docs/11 §2)', () => {
    const entries = Object.values(climate.CLIMATES);
    expect(entries).toHaveLength(20);
    for (const normal of entries) {
      expect(normal.tWarm).toBeGreaterThan(normal.tCold);
      if (normal.provenance.basis === 'measured') {
        expect(SOURCES).toHaveProperty(normal.provenance.source);
      }
    }
  });

  it('defines 15 habitats with consistent ranges (docs/11 §5)', () => {
    expect(HABITAT_IDS).toHaveLength(15);
    for (const habitat of Object.values(HABITATS)) {
      expect(habitat.landPercent.min, habitat.id).toBeLessThanOrEqual(habitat.landPercent.max);
      expect(habitat.allowedZones.length, habitat.id).toBeGreaterThan(0);
    }
  });
});
