import { describe, expect, it } from 'vitest';
import { params } from '../params';
import { createRng } from '../../src/engine/rng';
import {
  decodeGenotype,
  derivePhenotype,
  encodeGenotype,
  fitGompertz,
  genotypeFromScientificName,
  gompertzSurvival,
  lociFor,
  mutateGenotype,
  rarityScore,
  rarityTier,
  sampleGenotype,
  scientificName,
  commonName,
  speciesSpaceSize,
} from '../../src/generation/index';
import { TEST_BIOMASS, TEST_COHORT, TEST_LAND } from './fixtures';

const SAMPLES = 2000;

describe('genotype encoding (docs/05 §1, §2.4)', () => {
  it('has the documented species space per archetype kind', () => {
    expect(speciesSpaceSize(params, TEST_COHORT)).toBe(4_598_415_360);
    expect(speciesSpaceSize(params, TEST_LAND)).toBe(4_598_415_360);
    expect(speciesSpaceSize(params, TEST_BIOMASS)).toBe(23_950_080);
  });

  it('round-trips genotypes through codes', () => {
    const rng = createRng(1);
    for (const archetype of [TEST_COHORT, TEST_BIOMASS, TEST_LAND]) {
      for (let sample = 0; sample < SAMPLES; sample += 1) {
        const code = sampleGenotype(params, archetype, rng);
        expect(code).not.toBeNull();
        const decoded = decodeGenotype(params, archetype, code ?? '');
        expect(encodeGenotype(params, archetype, decoded.alleles)).toBe(code);
      }
    }
  });

  it('uses humidity instead of salinity on land', () => {
    const ids = lociFor(params, TEST_LAND).map((locus) => locus.id);
    expect(ids).toContain('humidity');
    expect(ids).not.toContain('salinity');
  });
});

describe('scientific names (docs/05 §4.1)', () => {
  it('are bijective with genotypes', () => {
    const rng = createRng(2);
    for (const archetype of [TEST_COHORT, TEST_BIOMASS]) {
      const names = new Map<string, string>();
      for (let sample = 0; sample < SAMPLES; sample += 1) {
        const code = sampleGenotype(params, archetype, rng) ?? '';
        const name = scientificName(params, archetype, code);
        expect(genotypeFromScientificName(params, archetype, name)).toBe(code);
        const previous = names.get(name);
        if (previous !== undefined) expect(previous).toBe(code);
        names.set(name, code);
      }
    }
  });

  it('adds a variety name for mutants', () => {
    const loci = lociFor(params, TEST_COHORT);
    const alleles = loci.map(() => 0);
    alleles[loci.findIndex((locus) => locus.id === 'mutation')] = 1;
    const name = scientificName(params, TEST_COHORT, encodeGenotype(params, TEST_COHORT, alleles));
    expect(name).toMatch(/^Cyclo\w+ \w+ var\. albina$/);
    expect(commonName(params, TEST_COHORT, encodeGenotype(params, TEST_COHORT, alleles))).toMatch(
      /^白化.*劍水蚤$/,
    );
  });
});

describe('Gompertz ageing (docs/04 §5.7)', () => {
  it.each([
    [30, 75],
    [365, 730],
    [3650, 20000],
    [1, 17],
  ])('calibrates S(typical)=0.5 and S(max)≤0.01 for %i / %i days', (typical, max) => {
    const fit = fitGompertz(params, typical, max);
    expect(gompertzSurvival(fit, typical)).toBeCloseTo(0.5, 6);
    expect(gompertzSurvival(fit, max)).toBeLessThanOrEqual(0.0100001);
  });
});

describe('phenotypes (docs/05 §2)', () => {
  it('stay within archetype ranges', () => {
    const rng = createRng(3);
    for (let sample = 0; sample < SAMPLES; sample += 1) {
      const code = sampleGenotype(params, TEST_COHORT, rng) ?? '';
      const phenotype = derivePhenotype(params, TEST_COHORT, code);
      const tolerance = TEST_COHORT.tolerance;
      expect(phenotype.temperatureC.min).toBeGreaterThanOrEqual(tolerance.temperatureC.min.value);
      expect(phenotype.temperatureC.max).toBeLessThanOrEqual(tolerance.temperatureC.max.value);
      expect(phenotype.lifespan.maxDays).toBeLessThanOrEqual(
        TEST_COHORT.lifeHistory.gameCapDays.value,
      );
      expect(phenotype.lifespan.typicalDays).toBeLessThan(phenotype.lifespan.maxDays);
      expect((phenotype.clutch ?? 0) * (phenotype.eggMassMg ?? 0)).toBeLessThanOrEqual(
        phenotype.adultMassMg * 0.3 + 1e-12,
      );
      if (phenotype.mutation === 'none') {
        expect(phenotype.adultMassMg).toBeGreaterThanOrEqual(TEST_COHORT.massMg.min.value * 0.95);
        expect(phenotype.adultMassMg).toBeLessThanOrEqual(TEST_COHORT.massMg.max.value * 1.05);
      }
    }
  });

  it('is deterministic per genotype', () => {
    const code = sampleGenotype(params, TEST_BIOMASS, createRng(4)) ?? '';
    expect(derivePhenotype(params, TEST_BIOMASS, code)).toEqual(
      derivePhenotype(params, TEST_BIOMASS, code),
    );
  });
});

describe('sampling (docs/05 §3)', () => {
  it('reproduces draws for the same seed', () => {
    const draw = (seed: number) => {
      const rng = createRng(seed);
      return Array.from({ length: 50 }, () => sampleGenotype(params, TEST_COHORT, rng));
    };
    expect(draw(9)).toEqual(draw(9));
  });

  it('favours warm-adapted genotypes in warm water', () => {
    const thermal = lociFor(params, TEST_COHORT).findIndex((locus) => locus.id === 'thermal');
    const count = (temperatureC: number) => {
      const rng = createRng(5);
      let tropical = 0;
      for (let sample = 0; sample < SAMPLES; sample += 1) {
        const code = sampleGenotype(params, TEST_COHORT, rng, {
          temperatureC,
          salinityPpt: 0,
          ph: 7.5,
        });
        if (code !== null && decodeGenotype(params, TEST_COHORT, code).alleles[thermal] === 4)
          tropical += 1;
      }
      return tropical;
    };
    expect(count(29)).toBeGreaterThan(count(12) * 3);
  });

  it('never exceeds the enclosure size limit', () => {
    const rng = createRng(6);
    const limit = 0.9;
    for (let sample = 0; sample < SAMPLES; sample += 1) {
      const code = sampleGenotype(params, TEST_COHORT, rng, {
        temperatureC: 20,
        salinityPpt: 0,
        ph: 7.5,
        maxLengthMm: limit,
      });
      if (code !== null)
        expect(derivePhenotype(params, TEST_COHORT, code).lengthMm).toBeLessThanOrEqual(limit);
    }
  });
});

describe('mutation (docs/05 §5)', () => {
  it('changes one or two loci', () => {
    const rng = createRng(7);
    for (let sample = 0; sample < SAMPLES; sample += 1) {
      const parent = sampleGenotype(params, TEST_COHORT, rng) ?? '';
      const child = mutateGenotype(params, TEST_COHORT, parent, rng);
      const a = decodeGenotype(params, TEST_COHORT, parent).alleles;
      const b = decodeGenotype(params, TEST_COHORT, child).alleles;
      const differences = a.filter((allele, index) => allele !== b[index]).length;
      expect(differences).toBeGreaterThanOrEqual(1);
      expect(differences).toBeLessThanOrEqual(2);
    }
  });
});

describe('rarity (docs/05 §6)', () => {
  it('scores the modal genotype as common and mutants as rare or rarer', () => {
    const loci = lociFor(params, TEST_COHORT);
    const modal = loci.map((locus) => locus.baseWeights.indexOf(Math.max(...locus.baseWeights)));
    expect(rarityScore(params, TEST_COHORT, encodeGenotype(params, TEST_COHORT, modal))).toBe(0);
    const mutant = [...modal];
    mutant[loci.findIndex((locus) => locus.id === 'mutation')] = 3;
    expect(['rare', 'legendary']).toContain(
      rarityTier(
        params,
        rarityScore(params, TEST_COHORT, encodeGenotype(params, TEST_COHORT, mutant)),
      ),
    );
  });
});
