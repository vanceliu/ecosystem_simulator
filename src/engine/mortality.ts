import type { Archetype } from '../content/archetype';
import { getArchetype } from '../content/archetypes/index';
import { NEGLIGIBLE_SENESCENCE_HAZARD } from '../content/physiology';
import { STOICHIOMETRY } from '../content/stoichiometry';
import { gompertzHazard, type Phenotype } from '../generation/index';
import type { BioContext } from './bioContext';
import {
  ageDays,
  bodyRatios,
  bodyTemperature,
  cohortCod,
  effect,
  environmentFactor,
  humidityMinOf,
  phenotypeOf,
  specialisedOf,
  TICKS_PER_DAY,
  waterFraction,
} from './biota';
import { addTerm, type Process } from './fluxes';
import { cohortKey, LAND_LITTER, POOL, populationKey, WATER_DETRITUS, WATER_INERT } from './pools';
import type { AgeCohort, BiomassPopulation, CohortPopulation, Population } from './types';

/** docs/04 §5.8 additional mortality per tick */
export const STRESS = {
  ammonia: 0.02,
  nitrite: 0.01,
  hypoxia: 0.05,
  outOfTolerance: 0.05,
  starvation: 0.03,
  desiccation: 0.02,
  noLand: 0.2,
  noWater: 1,
  noUvb: 0.002,
  escape: 0.05,
} as const;
/** docs/04 §5.8: starvation below this share of the cohort's peak body mass */
export const STARVATION_MASS_SHARE = 0.5;
/** docs/04 §5.8: reptiles without UVB for this many game days */
export const UVB_DEFICIT_DAYS = 30;
/** docs/04 §5.7: semelparous parents die within this many game days of breeding */
export const SEMELPAROUS_DEATH_DAYS = 3;
/** docs/04 §5.7: clonal collapse mortality, d⁻¹ */
export const CLONAL_COLLAPSE_HAZARD = 0.2;
/** docs/04 §5.5: coral mortality multiplier after 14 days with Z < 0.2 */
export const BLEACHED_MORTALITY_FACTOR = 5;
export const BLEACHED_DAYS = 14;

const INERT_FRACTION = STOICHIOMETRY.inertFractionOfDecay.value;
const N_INERT = STOICHIOMETRY.nPerInertCod.value;
const SOIL_MICROBES = new Set(['soil_bacteria', 'saprotrophic_fungus']);

/** Toxicity, oxygen and tolerance stress per tick (docs/04 §5.8). */
function waterStress(
  context: BioContext,
  archetype: Archetype,
  phenotype: Phenotype,
  w: number,
): number {
  if (w <= 0 || !context.media.hasWater) return 0;
  let stress = 0;
  if (phenotype.nh3MaxMgL !== undefined && context.freeAmmoniaMgL > phenotype.nh3MaxMgL)
    stress += STRESS.ammonia * (context.freeAmmoniaMgL / phenotype.nh3MaxMgL - 1);
  const volume = context.space.waterVolumeL;
  const no2 = (context.pools.get(POOL.no2) ?? 0) / volume;
  if (phenotype.no2MaxMgL !== undefined && no2 > phenotype.no2MaxMgL)
    stress += STRESS.nitrite * (no2 / phenotype.no2MaxMgL - 1);
  const o2 = (context.pools.get(POOL.o2) ?? 0) / volume;
  if (
    phenotype.o2MinMgL !== undefined &&
    o2 < phenotype.o2MinMgL &&
    !archetype.flags.includes('air_breather')
  )
    stress += STRESS.hypoxia * (1 - o2 / phenotype.o2MinMgL);
  return stress * w;
}

function habitatStress(
  context: BioContext,
  archetype: Archetype,
  phenotype: Phenotype,
  w: number,
  adult: boolean,
): number {
  let stress = 0;
  if (archetype.zone === 'W' && !context.media.hasWater) stress += STRESS.noWater;
  if (w >= 1 && archetype.zone !== 'W' && !context.media.hasWater) stress += STRESS.noWater;
  const needsLand = archetype.zone === 'T' || archetype.flags.includes('needs_land');
  if (adult && needsLand && !context.media.hasLand) stress += STRESS.noLand;
  const humidityMin = humidityMinOf(archetype, phenotype);
  if (w < 1 && context.media.hasLand && humidityMin !== undefined) {
    const humidity = context.state.land.humidity;
    if (humidity < humidityMin)
      stress +=
        STRESS.desiccation *
        effect(specialisedOf(archetype, phenotype).desiccation) *
        (1 - humidity / humidityMin) *
        (1 - w);
  }
  if (
    archetype.flags.includes('needs_uvb') &&
    context.state.tracking.uvbOffDays >= UVB_DEFICIT_DAYS
  )
    stress += STRESS.noUvb;
  return stress;
}

/** Where dead organic matter of an organism with water-time fraction w settles. */
function deathSink(context: BioContext, w: number) {
  if (!context.media.hasLand) return WATER_DETRITUS;
  if (!context.media.hasWater) return LAND_LITTER;
  return w >= 0.5 ? WATER_DETRITUS : LAND_LITTER;
}

/** Fraction dying within a substep from a per-tick rate. */
const fractionFor = (perTick: number, dtDays: number): number =>
  1 - Math.exp(-Math.max(0, perTick) * dtDays * TICKS_PER_DAY);

function biomassDailyLoss(
  context: BioContext,
  population: BiomassPopulation,
  archetype: Archetype,
  phenotype: Phenotype,
): number {
  if (archetype.kind !== 'biomass') return 0;
  const starvation = archetype.kinetics.starvationLoss;
  const hunger =
    starvation === undefined
      ? 0
      : starvation.value * (1 - (context.satiation.get(population.id) ?? 0));
  return hunger + senescenceLoss(population, archetype, phenotype);
}

function senescenceLoss(
  population: BiomassPopulation,
  archetype: Archetype,
  phenotype: Phenotype,
): number {
  if (archetype.kind !== 'biomass') return 0;
  const lifeHistory = archetype.lifeHistory;
  switch (lifeHistory.senescence) {
    case 'cell_turnover':
    case 'semelparous':
      return 1 / phenotype.lifespan.typicalDays;
    case 'modular':
      return 1 / (lifeHistory.moduleLifespanDays?.value ?? phenotype.lifespan.typicalDays);
    case 'clonal_aging': {
      const collapse =
        lifeHistory.clonalMaxGenerations !== undefined &&
        population.clonalGenerations >= lifeHistory.clonalMaxGenerations.max.value
          ? CLONAL_COLLAPSE_HAZARD
          : 0;
      return (archetype.kinetics.lossRate?.value ?? 0) + collapse;
    }
    default:
      return 1 / phenotype.lifespan.typicalDays;
  }
}

function biomassDeath(context: BioContext, population: BiomassPopulation): Process | null {
  if (population.cod <= 0) return null;
  const archetype = getArchetype(population.archetypeId);
  const phenotype = phenotypeOf(population.speciesId);
  const w = archetype.zone === 'T' ? 0 : 1;
  const temperature = w > 0 ? context.state.water.temperatureC : context.state.land.airTemperatureC;
  let stress =
    waterStress(context, archetype, phenotype, w) +
    habitatStress(context, archetype, phenotype, w, true);
  if (
    environmentFactor(
      context.state,
      phenotype,
      temperature,
      w,
      humidityMinOf(archetype, phenotype),
    ) <= 0
  )
    stress += STRESS.outOfTolerance;
  const perTick =
    biomassDailyLoss(context, population, archetype, phenotype) / TICKS_PER_DAY + stress;
  const rate = population.cod * fractionFor(perTick, context.dtDays);
  if (!(rate > 0)) return null;
  const ratios = bodyRatios(archetype);
  const terms: Record<string, number> = {};
  addTerm(terms, populationKey(population.id), -1);
  if (SOIL_MICROBES.has(archetype.id)) {
    addTerm(terms, POOL.soilSubstrate, 1);
    addTerm(terms, POOL.soilTan, ratios.n);
    addTerm(terms, POOL.soilPo4, ratios.p);
  } else if (w > 0 && context.media.hasWater) {
    const inertN = Math.min(ratios.n, N_INERT) * INERT_FRACTION;
    addTerm(terms, WATER_DETRITUS.cod, 1 - INERT_FRACTION);
    addTerm(terms, WATER_DETRITUS.n, ratios.n - inertN);
    addTerm(terms, WATER_DETRITUS.p, ratios.p);
    addTerm(terms, WATER_INERT.cod, INERT_FRACTION);
    addTerm(terms, WATER_INERT.n, inertN);
  } else {
    addTerm(terms, LAND_LITTER.cod, 1);
    addTerm(terms, LAND_LITTER.n, ratios.n);
    addTerm(terms, LAND_LITTER.p, ratios.p);
  }
  return {
    name: `death:${population.id}`,
    rate,
    stoichiometry: terms,
    speciesId: population.speciesId,
  };
}

/** docs/04 §5.7 age hazard, d⁻¹; Infinity at or beyond the maximum lifespan. */
function ageHazard(
  archetype: Archetype,
  phenotype: Phenotype,
  population: CohortPopulation,
  cohort: AgeCohort,
  tick: number,
): number {
  const age = ageDays(cohort, tick);
  const lifespan = phenotype.lifespan;
  const senescence = archetype.lifeHistory.senescence;
  if (senescence === 'negligible')
    return age >= lifespan.capDays ? Infinity : NEGLIGIBLE_SENESCENCE_HAZARD.value;
  if (age >= lifespan.maxDays) return Infinity;
  let hazard = gompertzHazard(lifespan.gompertz, age);
  if (population.lowSymbiontDays >= BLEACHED_DAYS) hazard *= BLEACHED_MORTALITY_FACTOR;
  if (cohort.spentTick !== null) {
    const remaining = cohort.spentTick + SEMELPAROUS_DEATH_DAYS * TICKS_PER_DAY - tick;
    hazard += remaining <= 1 ? Infinity : TICKS_PER_DAY / remaining;
  }
  return hazard;
}

function cohortDeaths(context: BioContext, population: CohortPopulation): Process[] {
  const processes: Process[] = [];
  const archetype = getArchetype(population.archetypeId);
  const phenotype = phenotypeOf(population.speciesId);
  const ratios = bodyRatios(archetype);
  const tick = context.state.tick;
  const escapes = archetype.flags.includes('escapes_open_lid') && !context.state.config.lid;
  population.cohorts.forEach((cohort, index) => {
    const cod = cohortCod(cohort);
    if (cod <= 0) return;
    const key = cohortKey(population.id, index);
    const w = waterFraction(archetype, phenotype, context.media, cohort.aquatic);
    const adult = ageDays(cohort, tick) >= phenotype.maturityDays && !cohort.aquatic;
    const temperature = bodyTemperature(context.state, archetype, w, context.lightsOn);
    let stress =
      waterStress(context, archetype, phenotype, w) +
      habitatStress(context, archetype, phenotype, w, adult);
    if (environmentFactor(context.state, phenotype, temperature, w) <= 0)
      stress += STRESS.outOfTolerance;
    if (cohort.meanMassMg < STARVATION_MASS_SHARE * cohort.peakMassMg) stress += STRESS.starvation;
    const hazard = ageHazard(archetype, phenotype, population, cohort, tick);
    const fraction =
      hazard === Infinity ? 1 : fractionFor(hazard / TICKS_PER_DAY + stress, context.dtDays);
    const sink = deathSink(context, w);
    if (fraction > 0) {
      const terms: Record<string, number> = {};
      addTerm(terms, key, -1);
      addTerm(terms, sink.cod, 1);
      addTerm(terms, sink.n, ratios.n);
      addTerm(terms, sink.p, ratios.p);
      processes.push({
        name: `death:${key}`,
        rate: cod * fraction,
        stoichiometry: terms,
        speciesId: population.speciesId,
        cohorts: [{ key, effect: 'remove' }],
      });
    }
    if (escapes && adult && fraction < 1) {
      const terms: Record<string, number> = {};
      addTerm(terms, key, -1);
      addTerm(terms, POOL.exportN, ratios.n);
      addTerm(terms, POOL.exportP, ratios.p);
      processes.push({
        name: `escape:${key}`,
        rate: cod * (1 - fraction) * fractionFor(STRESS.escape, context.dtDays),
        stoichiometry: terms,
        speciesId: population.speciesId,
        cohorts: [{ key, effect: 'remove' }],
      });
    }
    const moduleDays = archetype.lifeHistory.moduleLifespanDays?.value;
    if (archetype.lifeHistory.senescence === 'modular' && moduleDays !== undefined) {
      const terms: Record<string, number> = {};
      addTerm(terms, key, -1);
      addTerm(terms, sink.cod, 1);
      addTerm(terms, sink.n, ratios.n);
      addTerm(terms, sink.p, ratios.p);
      processes.push({
        name: `module_turnover:${key}`,
        rate: (cod * (1 - fraction) * context.dtDays) / moduleDays,
        stoichiometry: terms,
        speciesId: population.speciesId,
        cohorts: [{ key, effect: 'shrink' }],
      });
    }
  });
  return processes;
}

/** Senescence and stress mortality of every population, docs/04 §5.7–5.8. */
export function mortalityProcesses(
  context: BioContext,
  populations: readonly Population[],
): Process[] {
  const processes: Process[] = [];
  for (const population of populations) {
    if (population.kind === 'biomass') {
      const process = biomassDeath(context, population);
      if (process !== null) processes.push(process);
    } else {
      processes.push(...cohortDeaths(context, population));
    }
  }
  return processes;
}
