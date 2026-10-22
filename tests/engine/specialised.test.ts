import { describe, expect, it } from 'vitest';
import type { ArchetypeId } from '../../src/content/archetypeIds';
import { getArchetype } from '../../src/content/archetypes/index';
import { createBioContext } from '../../src/engine/bioContext';
import { phenotypeOf, specialisedOf } from '../../src/engine/biota';
import { foundBiomass, registerSpecies } from '../../src/engine/founding';
import {
  computeGeometry,
  createInitialState,
  step,
  totalNitrogen,
  totalPhosphorus,
} from '../../src/engine/index';
import { waterMicrobeProcesses } from '../../src/engine/microbes';
import { toPools } from '../../src/engine/pools';
import { rootShare } from '../../src/engine/sediment';
import type { BiomassPopulation, SimulationState, TankConfig } from '../../src/engine/types';
import { encodeGenotype, lociFor } from '../../src/generation/index';
import { CYCLING_TANK } from './fixtures';

const SPECIALISED_ALLELE = 3;
/** docs/05 §2.1 warm-water thermal allele (opt 26 °C) */
const WARM_ALLELE = 3;

/** A warm-water genotype of the archetype with the given metabolism allele. */
function strain(id: ArchetypeId, metabolism: number): string {
  const archetype = getArchetype(id);
  const loci = lociFor(archetype);
  const alleles = loci.map((locus) =>
    locus.id === 'metabolism' ? metabolism : locus.id === 'thermal' ? WARM_ALLELE : 0,
  );
  return encodeGenotype(archetype, alleles);
}

function runDays(config: TankConfig, seed: string, days: number): SimulationState[] {
  let state = createInitialState(config, seed);
  const daily = [state];
  for (let tick = 0; tick < days * 24; tick += 1) {
    state = step(state).state;
    if (tick % 24 === 23) daily.push(state);
  }
  return daily;
}

describe('specialised metabolism (docs/05 §2.3)', () => {
  it('applies only to species carrying the specialised allele', () => {
    const archetype = getArchetype('aob');
    const plain = phenotypeOf(strain('aob', 1));
    const special = phenotypeOf(strain('aob', SPECIALISED_ALLELE));
    expect(specialisedOf(archetype, plain)).toEqual({});
    expect(specialisedOf(archetype, special).o2HalfSat?.value).toBeLessThan(1);
  });

  it('defines an effect for every biomass archetype', () => {
    for (const id of [
      'aob',
      'nob',
      'heterotroph',
      'denitrifier',
      'water_mold',
      'biofilm',
      'diatom',
      'green_algae',
      'cyanobacteria',
      'phytoplankton',
      'aquatic_plant',
      'macroalgae',
      'zooxanthellae',
      'ciliate',
      'moss_liverwort',
      'terrestrial_plant',
      'bromeliad_epiphyte',
      'saprotrophic_fungus',
      'soil_bacteria',
    ] as const) {
      const archetype = getArchetype(id);
      expect(archetype.kind).toBe('biomass');
      if (archetype.kind === 'biomass')
        expect(Object.keys(archetype.specialised).length).toBeGreaterThan(0);
    }
  });

  it('lets comammox NOB oxidise ammonium straight to nitrate', () => {
    const state = createInitialState(CYCLING_TANK, 'comammox');
    state.water.tan = 2 * state.water.volumeL;
    const speciesId = strain('nob', SPECIALISED_ALLELE);
    registerSpecies(state, { id: speciesId, origin: 'release', introduced: false });
    const population = foundBiomass(state, speciesId, 'player_release', 50);
    const context = createBioContext(state, toPools(state), computeGeometry(CYCLING_TANK), 1 / 24);
    const biomass = state.populations.filter(
      (candidate): candidate is BiomassPopulation => candidate.kind === 'biomass',
    );
    const comammox = waterMicrobeProcesses(context, biomass).find(
      (process) => process.name === `comammox:${population.id}`,
    );
    expect(comammox).toBeDefined();
    expect(comammox?.stoichiometry['w.tan'] ?? 0).toBeLessThan(0);
    expect(comammox?.stoichiometry['w.no3'] ?? 0).toBeGreaterThan(0);
    expect(comammox?.stoichiometry['w.no2']).toBeUndefined();
  });
});

describe('substrate nutrients (docs/04 §3.3, §5.3)', () => {
  const aquasoil: TankConfig = {
    ...CYCLING_TANK,
    waterSource: 'ro',
    substrate: 'aquasoil',
    substrateDepthCm: 5,
  };

  it('loads aquasoil with exchangeable ammonium and phosphate; inert sand has none', () => {
    expect(createInitialState(aquasoil, 'soil').water.sedimentTan).toBeGreaterThan(0);
    expect(createInitialState(aquasoil, 'soil').water.sedimentPo4).toBeGreaterThan(0);
    const sand = createInitialState({ ...aquasoil, substrate: 'fine_sand' }, 'sand');
    expect(sand.water.sedimentTan).toBe(0);
  });

  it('leaches ammonium into the water while conserving N and P', () => {
    const days = runDays(aquasoil, 'leach', 5);
    const first = days[0];
    const last = days.at(-1);
    if (first === undefined || last === undefined) throw new Error('no run');
    expect(last.water.sedimentTan).toBeLessThan(first.water.sedimentTan);
    const nExpected = totalNitrogen(first) + last.ledger.nIn - last.ledger.nOut;
    const pExpected = totalPhosphorus(first) + last.ledger.pIn - last.ledger.pOut;
    expect(Math.abs(totalNitrogen(last) - nExpected) / nExpected).toBeLessThan(1e-9);
    expect(Math.abs(totalPhosphorus(last) - pExpected) / pExpected).toBeLessThan(1e-9);
  });

  it('draws most uptake through roots when porewater is much richer (Carignan 1982)', () => {
    expect(rootShare(0, 1)).toBe(0);
    expect(rootShare(1, 1)).toBeCloseTo(0.273, 2);
    expect(rootShare(10, 1)).toBeCloseTo(0.72, 1);
    expect(rootShare(1, 0)).toBeCloseTo(0.998, 3);
  });
});
