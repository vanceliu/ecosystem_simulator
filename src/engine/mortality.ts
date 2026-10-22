import type { Archetype } from '../content/archetype';
import type { ParameterSet } from '../content/parameters';
import { DETRITUS, INERT, LITTER } from '../content/substances';
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
import { addTerm, type Process, type Stoichiometry } from './fluxes';
import { cohortKey, populationKey } from './pools';
import type { AgeCohort, BiomassPopulation, CohortPopulation, Population } from './types';

const SOIL_MICROBES = new Set(['soil_bacteria', 'saprotrophic_fungus']);

/** Toxicity, oxygen and tolerance stress per tick (docs/04 §5.8). */
function waterStress(
  context: BioContext,
  archetype: Archetype,
  phenotype: Phenotype,
  w: number,
): number {
  const mortality = context.params.mechanics.mortality;
  if (w <= 0 || !context.media.hasWater) return 0;
  let stress = 0;
  if (phenotype.nh3MaxMgL !== undefined && context.freeAmmoniaMgL > phenotype.nh3MaxMgL)
    stress += mortality.stress.ammonia * (context.freeAmmoniaMgL / phenotype.nh3MaxMgL - 1);
  const volume = context.space.waterVolumeL;
  const no2 = (context.pools.get('water_no2') ?? 0) / volume;
  if (phenotype.no2MaxMgL !== undefined && no2 > phenotype.no2MaxMgL)
    stress += mortality.stress.nitrite * (no2 / phenotype.no2MaxMgL - 1);
  const o2 = (context.pools.get('water_o2') ?? 0) / volume;
  if (
    phenotype.o2MinMgL !== undefined &&
    o2 < phenotype.o2MinMgL &&
    !archetype.flags.includes('air_breather')
  )
    stress += mortality.stress.hypoxia * (1 - o2 / phenotype.o2MinMgL);
  return stress * w;
}

function habitatStress(
  context: BioContext,
  archetype: Archetype,
  phenotype: Phenotype,
  w: number,
  adult: boolean,
): number {
  const mortality = context.params.mechanics.mortality;
  let stress = 0;
  if (archetype.zone === 'W' && !context.media.hasWater) stress += mortality.stress.noWater;
  if (w >= 1 && archetype.zone !== 'W' && !context.media.hasWater)
    stress += mortality.stress.noWater;
  const needsLand = archetype.zone === 'T' || archetype.flags.includes('needs_land');
  if (adult && needsLand && !context.media.hasLand) stress += mortality.stress.noLand;
  const humidityMin = humidityMinOf(archetype, phenotype);
  if (w < 1 && context.media.hasLand && humidityMin !== undefined) {
    const humidity = context.state.land.humidity;
    if (humidity < humidityMin)
      stress +=
        mortality.stress.desiccation *
        effect(specialisedOf(archetype, phenotype).desiccation) *
        (1 - humidity / humidityMin) *
        (1 - w);
  }
  if (
    archetype.flags.includes('needs_uvb') &&
    context.state.tracking.uvbOffDays >= mortality.uvbDeficitDays
  )
    stress += mortality.stress.noUvb;
  return stress;
}

/** Where dead organic matter of an organism with water-time fraction w settles. */
function deathSink(context: BioContext, w: number) {
  if (!context.media.hasLand) return DETRITUS;
  if (!context.media.hasWater) return LITTER;
  return w >= 0.5 ? DETRITUS : LITTER;
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
  return hunger + senescenceLoss(context.params, population, archetype, phenotype);
}

function senescenceLoss(
  params: ParameterSet,
  population: BiomassPopulation,
  archetype: Archetype,
  phenotype: Phenotype,
): number {
  const mortality = params.mechanics.mortality;
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
          ? mortality.clonalCollapseHazard
          : 0;
      return (archetype.kinetics.lossRate?.value ?? 0) + collapse;
    }
    default:
      return 1 / phenotype.lifespan.typicalDays;
  }
}

function biomassDeath(context: BioContext, population: BiomassPopulation): Process | null {
  const mortality = context.params.mechanics.mortality;
  if (population.cod <= 0) return null;
  const { params } = context;
  const archetype = params.archetypes[population.archetypeId];
  const phenotype = phenotypeOf(params, population.speciesId);
  const w = archetype.zone === 'T' ? 0 : 1;
  const temperature = w > 0 ? context.state.water.temperatureC : context.state.land.airTemperatureC;
  let stress =
    waterStress(context, archetype, phenotype, w) +
    habitatStress(context, archetype, phenotype, w, true);
  if (
    environmentFactor(
      params,
      context.state,
      phenotype,
      temperature,
      w,
      humidityMinOf(archetype, phenotype),
    ) <= 0
  )
    stress += mortality.stress.outOfTolerance;
  const perTick =
    biomassDailyLoss(context, population, archetype, phenotype) / TICKS_PER_DAY + stress;
  const rate = population.cod * fractionFor(perTick, context.dtDays);
  if (!(rate > 0)) return null;
  const ratios = bodyRatios(params, archetype);
  const inertFraction = params.stoichiometry.base.inertFractionOfDecay.value;
  const terms: Stoichiometry = {};
  addTerm(terms, populationKey(population.id), -1);
  if (SOIL_MICROBES.has(archetype.id)) {
    addTerm(terms, 'soil_substrate', 1);
    addTerm(terms, 'soil_tan', ratios.n);
    addTerm(terms, 'soil_po4', ratios.p);
  } else if (w > 0 && context.media.hasWater) {
    const inertN = Math.min(ratios.n, params.stoichiometry.base.nPerInertCod.value) * inertFraction;
    addTerm(terms, DETRITUS.cod, 1 - inertFraction);
    addTerm(terms, DETRITUS.n, ratios.n - inertN);
    addTerm(terms, DETRITUS.p, ratios.p);
    addTerm(terms, INERT.cod, inertFraction);
    addTerm(terms, INERT.n, inertN);
  } else {
    addTerm(terms, LITTER.cod, 1);
    addTerm(terms, LITTER.n, ratios.n);
    addTerm(terms, LITTER.p, ratios.p);
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
  params: ParameterSet,
  archetype: Archetype,
  phenotype: Phenotype,
  population: CohortPopulation,
  cohort: AgeCohort,
  tick: number,
): number {
  const mortality = params.mechanics.mortality;
  const age = ageDays(cohort, tick);
  const lifespan = phenotype.lifespan;
  const senescence = archetype.lifeHistory.senescence;
  if (senescence === 'negligible')
    return age >= lifespan.capDays ? Infinity : params.physiology.negligibleSenescenceHazard.value;
  if (age >= lifespan.maxDays) return Infinity;
  let hazard = gompertzHazard(lifespan.gompertz, age);
  if (population.lowSymbiontDays >= mortality.bleachedDays)
    hazard *= mortality.bleachedMortalityFactor;
  if (cohort.spentTick !== null) {
    const remaining = cohort.spentTick + mortality.semelparousDeathDays * TICKS_PER_DAY - tick;
    hazard += remaining <= 1 ? Infinity : TICKS_PER_DAY / remaining;
  }
  return hazard;
}

function cohortDeaths(context: BioContext, population: CohortPopulation): Process[] {
  const mortality = context.params.mechanics.mortality;
  const { params } = context;
  const processes: Process[] = [];
  const archetype = params.archetypes[population.archetypeId];
  const phenotype = phenotypeOf(params, population.speciesId);
  const ratios = bodyRatios(params, archetype);
  const tick = context.state.tick;
  const escapes = archetype.flags.includes('escapes_open_lid') && !context.state.config.lid;
  population.cohorts.forEach((cohort, index) => {
    const cod = cohortCod(params, cohort);
    if (cod <= 0) return;
    const key = cohortKey(population.id, index);
    const w = waterFraction(params, archetype, phenotype, context.media, cohort.aquatic);
    const adult = ageDays(cohort, tick) >= phenotype.maturityDays && !cohort.aquatic;
    const temperature = bodyTemperature(context.state, archetype, w, context.lightsOn);
    let stress =
      waterStress(context, archetype, phenotype, w) +
      habitatStress(context, archetype, phenotype, w, adult);
    if (environmentFactor(params, context.state, phenotype, temperature, w) <= 0)
      stress += mortality.stress.outOfTolerance;
    if (cohort.meanMassMg < mortality.starvationMassShare * cohort.peakMassMg)
      stress += mortality.stress.starvation;
    const hazard = ageHazard(params, archetype, phenotype, population, cohort, tick);
    const fraction =
      hazard === Infinity ? 1 : fractionFor(hazard / TICKS_PER_DAY + stress, context.dtDays);
    const sink = deathSink(context, w);
    if (fraction > 0) {
      const terms: Stoichiometry = {};
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
      const terms: Stoichiometry = {};
      addTerm(terms, key, -1);
      addTerm(terms, 'out_n', ratios.n);
      addTerm(terms, 'out_p', ratios.p);
      processes.push({
        name: `escape:${key}`,
        rate: cod * (1 - fraction) * fractionFor(mortality.stress.escape, context.dtDays),
        stoichiometry: terms,
        speciesId: population.speciesId,
        cohorts: [{ key, effect: 'remove' }],
      });
    }
    const moduleDays = archetype.lifeHistory.moduleLifespanDays?.value;
    if (archetype.lifeHistory.senescence === 'modular' && moduleDays !== undefined) {
      const terms: Stoichiometry = {};
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
