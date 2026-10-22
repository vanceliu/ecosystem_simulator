import { describe, expect, it } from 'vitest';
import type { ArchetypeId } from '../../src/content/archetypeIds';
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
import { params } from '../params';

const SPECIALISED_ALLELE = 3;
/** docs/05 §2.1 warm-water thermal allele (opt 26 °C) */
const WARM_ALLELE = 3;

/** A warm-water genotype of the archetype with the given metabolism allele. */
function strain(id: ArchetypeId, metabolism: number): string {
  const archetype = params.archetypes[id];
  const loci = lociFor(params, archetype);
  const alleles = loci.map((locus) =>
    locus.id === 'metabolism' ? metabolism : locus.id === 'thermal' ? WARM_ALLELE : 0,
  );
  return encodeGenotype(params, archetype, alleles);
}

function runDays(config: TankConfig, seed: string, days: number): SimulationState[] {
  let state = createInitialState(params, config, seed);
  const daily = [state];
  for (let tick = 0; tick < days * 24; tick += 1) {
    state = step(params, state).state;
    if (tick % 24 === 23) daily.push(state);
  }
  return daily;
}

describe('specialised metabolism (docs/05 §2.3)', () => {
  it('applies only to species carrying the specialised allele', () => {
    const archetype = params.archetypes['aob'];
    const plain = phenotypeOf(params, strain('aob', 1));
    const special = phenotypeOf(params, strain('aob', SPECIALISED_ALLELE));
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
      const archetype = params.archetypes[id];
      expect(archetype.kind).toBe('biomass');
      if (archetype.kind === 'biomass')
        expect(Object.keys(archetype.specialised).length).toBeGreaterThan(0);
    }
  });

  it('lets comammox NOB oxidise ammonium straight to nitrate', () => {
    const state = createInitialState(params, CYCLING_TANK, 'comammox');
    state.substances.water_tan = 2 * state.water.volumeL;
    const speciesId = strain('nob', SPECIALISED_ALLELE);
    registerSpecies(state, { id: speciesId, origin: 'release', introduced: false });
    const population = foundBiomass(state, speciesId, 'player_release', 50);
    const context = createBioContext(
      params,
      state,
      toPools(params, state),
      computeGeometry(params, CYCLING_TANK),
      1 / 24,
    );
    const biomass = state.populations.filter(
      (candidate): candidate is BiomassPopulation => candidate.kind === 'biomass',
    );
    const comammox = waterMicrobeProcesses(context, biomass).find(
      (process) => process.name === `comammox:${population.id}`,
    );
    expect(comammox).toBeDefined();
    expect(comammox?.stoichiometry.water_tan ?? 0).toBeLessThan(0);
    expect(comammox?.stoichiometry.water_no3 ?? 0).toBeGreaterThan(0);
    expect(comammox?.stoichiometry.water_no2).toBeUndefined();
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
    expect(createInitialState(params, aquasoil, 'soil').substances.sediment_tan).toBeGreaterThan(0);
    expect(createInitialState(params, aquasoil, 'soil').substances.sediment_po4).toBeGreaterThan(0);
    const sand = createInitialState(params, { ...aquasoil, substrate: 'fine_sand' }, 'sand');
    expect(sand.substances.sediment_tan).toBe(0);
  });

  it('leaches ammonium into the water while conserving N and P', () => {
    const days = runDays(aquasoil, 'leach', 5);
    const first = days[0];
    const last = days.at(-1);
    if (first === undefined || last === undefined) throw new Error('no run');
    expect(last.substances.sediment_tan).toBeLessThan(first.substances.sediment_tan);
    const nExpected = totalNitrogen(params, first) + last.ledger.nIn - last.ledger.nOut;
    const pExpected = totalPhosphorus(params, first) + last.ledger.pIn - last.ledger.pOut;
    expect(Math.abs(totalNitrogen(params, last) - nExpected) / nExpected).toBeLessThan(1e-9);
    expect(Math.abs(totalPhosphorus(params, last) - pExpected) / pExpected).toBeLessThan(1e-9);
  });

  it('draws most uptake through roots when porewater is much richer (Carignan 1982)', () => {
    expect(rootShare(params, 0, 1)).toBe(0);
    expect(rootShare(params, 1, 1)).toBeCloseTo(0.273, 2);
    expect(rootShare(params, 10, 1)).toBeCloseTo(0.72, 1);
    expect(rootShare(params, 1, 0)).toBeCloseTo(0.998, 3);
  });
});
