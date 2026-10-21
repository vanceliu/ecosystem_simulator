import { describe, expect, it } from 'vitest';
import { ARCHETYPE_IDS } from '../../src/content/archetypeIds';
import { getArchetype } from '../../src/content/archetypes/index';
import { createRng } from '../../src/engine/rng';
import {
  BIOMASS_SUFFIXES,
  COHORT_SUFFIXES,
  GENUS_LINKS,
  SIZE_SYLLABLES,
  decodeGenotype,
  derivePhenotype,
  encodeGenotype,
  genotypeFromScientificName,
  gompertzSurvival,
  sampleGenotype,
  scientificName,
  speciesSpaceSize,
} from '../../src/generation/index';

const SAMPLES_PER_ARCHETYPE = 200;
/** docs/05 §2.4 */
const EXPECTED_SPECIES_SPACE = 423_509_264_640;

describe('species space across all archetypes (docs/05 §2.4)', () => {
  it('totals 4.24 × 10¹¹ genotypes', () => {
    const total = ARCHETYPE_IDS.reduce((sum, id) => sum + speciesSpaceSize(getArchetype(id)), 0);
    expect(total).toBe(EXPECTED_SPECIES_SPACE);
  });

  it('never produces the same genus name for two archetypes', () => {
    const genera = new Map<string, string>();
    for (const id of ARCHETYPE_IDS) {
      const archetype = getArchetype(id);
      const suffixes = archetype.kind === 'cohort' ? COHORT_SUFFIXES : BIOMASS_SUFFIXES;
      for (const link of GENUS_LINKS) {
        for (const size of SIZE_SYLLABLES) {
          for (const suffix of suffixes) {
            const genus = `${archetype.latinStem}${link}${size}${suffix}`;
            const owner = genera.get(genus);
            expect(owner === undefined || owner === id, `${genus}: ${owner} vs ${id}`).toBe(true);
            genera.set(genus, id);
          }
        }
      }
    }
  });
});

describe.each(ARCHETYPE_IDS)('generation for %s', (id) => {
  it('round-trips codes and names, and derives bounded phenotypes', () => {
    const archetype = getArchetype(id);
    const rng = createRng(id.length * 7919);
    const cap = archetype.lifeHistory.gameCapDays.value;
    for (let sample = 0; sample < SAMPLES_PER_ARCHETYPE; sample += 1) {
      const code = sampleGenotype(archetype, rng);
      expect(code).not.toBeNull();
      const genotype = decodeGenotype(archetype, code ?? '');
      expect(encodeGenotype(archetype, genotype.alleles)).toBe(code);
      const name = scientificName(archetype, code ?? '');
      expect(genotypeFromScientificName(archetype, name)).toBe(code);
      const phenotype = derivePhenotype(archetype, code ?? '');
      expect(phenotype.lifespan.maxDays).toBeLessThanOrEqual(cap);
      expect(phenotype.lifespan.typicalDays).toBeGreaterThan(0);
      expect(
        gompertzSurvival(phenotype.lifespan.gompertz, phenotype.lifespan.typicalDays),
      ).toBeCloseTo(0.5, 4);
      expect(phenotype.temperatureC.min).toBeLessThanOrEqual(phenotype.temperatureC.max);
      expect(Number.isFinite(phenotype.adultMassMg) && phenotype.adultMassMg > 0).toBe(true);
    }
  });
});
