import type { ParameterSet } from '../content/parameters';
import { waterConcentration, type BioContext } from './bioContext';
import { bodyRatios, cohortCod, effect, phenotypeOf, specialisedOf } from './biota';
import { sampleGenotype } from '../generation/index';
import { createRng, hashSeed } from './rng';
import { addTerm, type Process, type Stoichiometry } from './fluxes';
import { gainKey } from './pools';
import { lightFactor } from './producers';
import type { CohortPopulation, Population } from './types';

const symbiontCaches = new WeakMap<ParameterSet, Map<string, string>>();

/** Symbiont genotype carried by a coral species; fixed per coral species. */
export function symbiontOf(params: ParameterSet, coralSpeciesId: string): string | null {
  let cache = symbiontCaches.get(params);
  if (cache === undefined) {
    cache = new Map();
    symbiontCaches.set(params, cache);
  }
  const cached = cache.get(coralSpeciesId);
  if (cached !== undefined) return cached;
  const symbiont = sampleGenotype(
    params,
    params.archetypes.zooxanthellae,
    createRng(hashSeed(coralSpeciesId)),
  );
  if (symbiont !== null) cache.set(coralSpeciesId, symbiont);
  return symbiont;
}

function symbiontEffects(params: ParameterSet, coralSpeciesId: string) {
  const symbiont = symbiontOf(params, coralSpeciesId);
  return symbiont === null
    ? {}
    : specialisedOf(params.archetypes.zooxanthellae, phenotypeOf(params, symbiont));
}

export const isSymbiontHost = (
  params: ParameterSet,
  population: Population,
): population is CohortPopulation =>
  population.kind === 'cohort' &&
  params.archetypes[population.archetypeId].flags.includes('symbiont_host');

const monod = (concentration: number, halfSat: number): number =>
  concentration > 0 ? concentration / (halfSat + concentration) : 0;

/** Photosynthate the symbionts pass to their host, docs/04 §5.5; mg COD per dtDays. */
export function symbiosisProcesses(
  context: BioContext,
  populations: readonly Population[],
): Process[] {
  if (!context.media.hasWater) return [];
  const { params } = context;
  const coral = params.physiology.coralSymbiosis;
  const mechanics = params.mechanics.symbiosis;
  const symbiont = params.archetypes.zooxanthellae;
  if (symbiont.kind !== 'biomass' || symbiont.light === undefined) return [];
  const fLight = lightFactor(
    context.ppfd,
    symbiont.light.halfSaturation.value,
    symbiont.light.optimum.value,
  );
  if (fLight <= 0) return [];
  const nitrogen =
    waterConcentration(context, 'water_tan') + waterConcentration(context, 'water_no3');
  const fNutrient = Math.min(
    monod(nitrogen, symbiont.kinetics.halfSat.nitrogen?.value ?? 0),
    monod(
      waterConcentration(context, 'water_po4'),
      symbiont.kinetics.halfSat.phosphorus?.value ?? 0,
    ),
  );
  const calcium =
    waterConcentration(context, 'water_ca') >= mechanics.calciumSufficientMgL
      ? 1
      : mechanics.calciumLimitedFactor;
  const processes: Process[] = [];
  for (const population of populations) {
    if (!isSymbiontHost(params, population) || population.symbiontDensity === null) continue;
    const host = params.archetypes[population.archetypeId];
    const ratios = bodyRatios(params, host);
    const biomass = population.cohorts.reduce((sum, cohort) => sum + cohortCod(params, cohort), 0);
    const rate =
      population.symbiontDensity *
      fLight *
      fNutrient *
      calcium *
      coral.photosynthatePerHostCod.value *
      effect(symbiontEffects(params, population.speciesId).photosynthate) *
      biomass *
      context.dtDays;
    if (!(rate > 0)) continue;
    const tan = waterConcentration(context, 'water_tan');
    const tanShare = nitrogen > 0 ? tan / nitrogen : 1;
    const terms: Stoichiometry = {};
    addTerm(terms, gainKey(population.id), 1);
    addTerm(terms, 'water_co2', -params.physics.co2PerO2.value);
    addTerm(terms, 'water_o2', 1);
    addTerm(terms, 'water_tan', -ratios.n * tanShare);
    addTerm(terms, 'water_no3', -ratios.n * (1 - tanShare));
    addTerm(terms, 'water_po4', -ratios.p);
    if (host.flags.includes('calcifier')) {
      const ca = coral.calciumPerHostCod.value;
      addTerm(terms, 'water_ca', -ca);
      addTerm(terms, 'water_alkalinity', -ca * params.physics.alkalinityPerCa.value);
    }
    processes.push({
      name: `symbiosis:${population.id}`,
      rate,
      stoichiometry: terms,
      speciesId: population.speciesId,
    });
  }
  return processes;
}

/** Bleaching and recovery of symbiont density Z per tick, docs/04 §5.5. */
export function updateSymbionts(
  params: ParameterSet,
  populations: readonly Population[],
  ppfd: number,
  waterTemperatureC: number,
): CohortPopulation[] {
  const bleached: CohortPopulation[] = [];
  const bleachingLight = params.physiology.coralSymbiosis.bleachingPpfd.value;
  const mechanics = params.mechanics.symbiosis;
  for (const population of populations) {
    if (!isSymbiontHost(params, population) || population.symbiontDensity === null) continue;
    const optimum = phenotypeOf(params, population.speciesId).temperatureC.opt;
    const shift = symbiontEffects(params, population.speciesId).bleachingShiftC?.value ?? 0;
    const stressed =
      ppfd > bleachingLight || waterTemperatureC > optimum + mechanics.bleachingExcessC + shift;
    const before = population.symbiontDensity;
    population.symbiontDensity = stressed
      ? before * (1 - mechanics.bleachingLossPerTick)
      : Math.min(1, before + mechanics.recoveryPerTick);
    if (before >= 0.5 && population.symbiontDensity < 0.5) bleached.push(population);
  }
  return bleached;
}
