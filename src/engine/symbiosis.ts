import { getArchetype } from '../content/archetypes/index';
import { CORAL_SYMBIOSIS } from '../content/physiology';
import { waterConcentration, type BioContext } from './bioContext';
import { bodyRatios, cohortCod, effect, phenotypeOf, specialisedOf } from './biota';
import { sampleGenotype } from '../generation/index';
import { createRng, hashSeed } from './rng';
import { addTerm, type Process } from './fluxes';
import { POOL, gainKey } from './pools';
import { lightFactor } from './producers';
import type { CohortPopulation, Population } from './types';

const CO2_PER_O2 = 44 / 32;
/** docs/04 §5.5 symbiont density change per tick */
export const BLEACHING_LOSS_PER_TICK = 0.02;
export const RECOVERY_PER_TICK = 0.005;
/** docs/04 §5.5: bleaching above the species' temperature optimum by this much */
export const BLEACHING_EXCESS_C = 2;
/** docs/04 §5.5: calcification is limited below this calcium concentration */
export const CALCIUM_SUFFICIENT_MG_L = 350;
export const CALCIUM_LIMITED_FACTOR = 0.2;
/** CaCO3 deposition lowers alkalinity (as CaCO3) by this much per mg Ca */
const ALKALINITY_PER_CA = 100.09 / 40.08;

const symbiontCache = new Map<string, string>();

/** Symbiont genotype carried by a coral species; fixed per coral species. */
export function symbiontOf(coralSpeciesId: string): string | null {
  const cached = symbiontCache.get(coralSpeciesId);
  if (cached !== undefined) return cached;
  const symbiont = sampleGenotype(
    getArchetype('zooxanthellae'),
    createRng(hashSeed(coralSpeciesId)),
  );
  if (symbiont !== null) symbiontCache.set(coralSpeciesId, symbiont);
  return symbiont;
}

function symbiontEffects(coralSpeciesId: string) {
  const symbiont = symbiontOf(coralSpeciesId);
  const archetype = getArchetype('zooxanthellae');
  return symbiont === null ? {} : specialisedOf(archetype, phenotypeOf(symbiont));
}

export const isSymbiontHost = (population: Population): population is CohortPopulation =>
  population.kind === 'cohort' &&
  getArchetype(population.archetypeId).flags.includes('symbiont_host');

const monod = (concentration: number, halfSat: number): number =>
  concentration > 0 ? concentration / (halfSat + concentration) : 0;

/** Photosynthate the symbionts pass to their host, docs/04 §5.5; mg COD per dtDays. */
export function symbiosisProcesses(
  context: BioContext,
  populations: readonly Population[],
): Process[] {
  if (!context.media.hasWater) return [];
  const symbiont = getArchetype('zooxanthellae');
  if (symbiont.kind !== 'biomass' || symbiont.light === undefined) return [];
  const fLight = lightFactor(
    context.ppfd,
    symbiont.light.halfSaturation.value,
    symbiont.light.optimum.value,
  );
  if (fLight <= 0) return [];
  const nitrogen = waterConcentration(context, POOL.tan) + waterConcentration(context, POOL.no3);
  const fNutrient = Math.min(
    monod(nitrogen, symbiont.kinetics.halfSat.nitrogen?.value ?? 0),
    monod(waterConcentration(context, POOL.po4), symbiont.kinetics.halfSat.phosphorus?.value ?? 0),
  );
  const calcium =
    waterConcentration(context, POOL.ca) >= CALCIUM_SUFFICIENT_MG_L ? 1 : CALCIUM_LIMITED_FACTOR;
  const processes: Process[] = [];
  for (const population of populations) {
    if (!isSymbiontHost(population) || population.symbiontDensity === null) continue;
    const host = getArchetype(population.archetypeId);
    const ratios = bodyRatios(host);
    const biomass = population.cohorts.reduce((sum, cohort) => sum + cohortCod(cohort), 0);
    const rate =
      population.symbiontDensity *
      fLight *
      fNutrient *
      calcium *
      CORAL_SYMBIOSIS.photosynthatePerHostCod.value *
      effect(symbiontEffects(population.speciesId).photosynthate) *
      biomass *
      context.dtDays;
    if (!(rate > 0)) continue;
    const tan = waterConcentration(context, POOL.tan);
    const tanShare = nitrogen > 0 ? tan / nitrogen : 1;
    const terms: Record<string, number> = {};
    addTerm(terms, gainKey(population.id), 1);
    addTerm(terms, POOL.co2, -CO2_PER_O2);
    addTerm(terms, POOL.o2, 1);
    addTerm(terms, POOL.tan, -ratios.n * tanShare);
    addTerm(terms, POOL.no3, -ratios.n * (1 - tanShare));
    addTerm(terms, POOL.po4, -ratios.p);
    if (host.flags.includes('calcifier')) {
      const ca = CORAL_SYMBIOSIS.calciumPerHostCod.value;
      addTerm(terms, POOL.ca, -ca);
      addTerm(terms, POOL.alkalinity, -ca * ALKALINITY_PER_CA);
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
  populations: readonly Population[],
  ppfd: number,
  waterTemperatureC: number,
): CohortPopulation[] {
  const bleached: CohortPopulation[] = [];
  const bleachingLight = CORAL_SYMBIOSIS.bleachingPpfd.value;
  for (const population of populations) {
    if (!isSymbiontHost(population) || population.symbiontDensity === null) continue;
    const optimum = phenotypeOf(population.speciesId).temperatureC.opt;
    const shift = symbiontEffects(population.speciesId).bleachingShiftC?.value ?? 0;
    const stressed =
      ppfd > bleachingLight || waterTemperatureC > optimum + BLEACHING_EXCESS_C + shift;
    const before = population.symbiontDensity;
    population.symbiontDensity = stressed
      ? before * (1 - BLEACHING_LOSS_PER_TICK)
      : Math.min(1, before + RECOVERY_PER_TICK);
    if (before >= 0.5 && population.symbiontDensity < 0.5) bleached.push(population);
  }
  return bleached;
}
