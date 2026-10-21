import { FOOD_COMPOSITION, STOICHIOMETRY } from '../content/stoichiometry';
import {
  dailyClimate,
  dayOfYearAt,
  drawRainfall,
  hourlyAmbientTemperature,
  naturalPpfd,
} from './climate';
import {
  exchangeGases,
  lampPpfd,
  o2SaturationMgL,
  updateWaterTemperature,
  waterPh,
} from './environment';
import { dayEndEvents, hourlyEvents, seasonEvents } from './events';
import { applyProcesses, type Pools } from './fluxes';
import { computeGeometry, microbialCapacities } from './geometry';
import { addRainToLand, updateHydrology } from './hydrology';
import { applyRunoff, updateLandClimate } from './land';
import {
  LAND_LITTER,
  POOL,
  WATER_DETRITUS,
  WATER_FOOD,
  WATER_INERT,
  landMicrobeProcesses,
  leachingProcesses,
  populationKey,
  seedingCod,
  waterMicrobeProcesses,
} from './microbes';
import { rngForTick } from './rng';
import { ambientDayMean, cloneState } from './state';
import type { Command, OrganicPool, SimEvent, SimulationState, StepResult } from './types';
import { MICROBES } from '../content/microbes';

/** docs/04 §9: split a tick when any tracked pool changes by more than this fraction. */
export const MAX_RELATIVE_CHANGE = 0.5;
export const MAX_SUBSTEPS = 8;
/** Pools below this mass are ignored by the substep check. */
const SUBSTEP_MASS_FLOOR_MG = 1e-3;
/** docs/11 §7: light through ice; snow-covered ice */
const ICE_LIGHT_FACTOR = 0.5;
const SNOW_LIGHT_FACTOR = 0.05;

function applyCommands(state: SimulationState, commands: readonly Command[]): void {
  for (const command of commands) {
    switch (command.type) {
      case 'feed': {
        const dry = Math.max(0, command.dryMassMg);
        const target = state.water.volumeL > 0 ? state.water.food : state.land.litter;
        const n = dry * FOOD_COMPOSITION.nPerDryMass.value;
        const p = dry * FOOD_COMPOSITION.pPerDryMass.value;
        target.cod += dry * FOOD_COMPOSITION.codPerDryMass.value;
        target.n += n;
        target.p += p;
        state.ledger.nIn += n;
        state.ledger.pIn += p;
        break;
      }
    }
  }
}

function startDay(state: SimulationState): SimEvent[] {
  const events = dayEndEvents(state);
  const previousWet = state.climate.wetSeason;
  const dayOfYear = dayOfYearAt(state.config.startDayOfYear, state.tick);
  const daily = dailyClimate(state.config.location, dayOfYear);
  const outdoor = state.config.placement === 'outdoor';
  state.climate.dayOfYear = dayOfYear;
  state.climate.dayLengthH = daily.dayLengthH;
  state.climate.sunshine = daily.sunshine;
  state.climate.wetSeason = daily.wetSeason;
  state.climate.ambientHumidity = daily.humidity;
  state.climate.ambientDayMeanC = ambientDayMean(state.config, dayOfYear);
  state.climate.rainTodayMm = outdoor
    ? drawRainfall(daily, rngForTick(state.seedHash, state.tick))
    : 0;
  state.climate.evaporationTodayMm = outdoor ? daily.evaporationMmPerDay : 0;
  return [...events, ...seasonEvents(state, previousWet)];
}

function updateHourlyClimate(state: SimulationState, hour: number): void {
  const config = state.config;
  if (config.placement === 'outdoor') {
    const daily = dailyClimate(config.location, state.climate.dayOfYear);
    state.climate.ambientTemperatureC = hourlyAmbientTemperature(daily, hour);
    const iceFactor = state.water.iceCover
      ? state.water.snowOnIce
        ? SNOW_LIGHT_FACTOR
        : ICE_LIGHT_FACTOR
      : 1;
    state.climate.ppfd =
      naturalPpfd(config.location, daily, hour) * (1 - config.shading) * iceFactor;
  } else {
    state.climate.ambientTemperatureC = config.roomTemperatureC;
    state.climate.ppfd = lampPpfd(state, hour);
  }
}

function organicToPools(
  pools: Pools,
  keys: { cod: string; n: string; p: string },
  pool: OrganicPool,
): void {
  pools.set(keys.cod, pool.cod);
  pools.set(keys.n, pool.n);
  pools.set(keys.p, pool.p);
}

function poolsToOrganic(
  pools: Pools,
  keys: { cod: string; n: string; p: string },
  pool: OrganicPool,
): void {
  pool.cod = pools.get(keys.cod) ?? 0;
  pool.n = pools.get(keys.n) ?? 0;
  pool.p = pools.get(keys.p) ?? 0;
}

function toPools(state: SimulationState): Pools {
  const water = state.water;
  const pools: Pools = new Map([
    [POOL.o2, water.o2],
    [POOL.co2, water.co2],
    [POOL.tan, water.tan],
    [POOL.no2, water.no2],
    [POOL.no3, water.no3],
    [POOL.po4, water.po4],
    [POOL.alkalinity, water.alkalinityMg],
    [POOL.substrate, water.substrateCod],
    [POOL.n2Out, 0],
    [POOL.nitrified, 0],
    [POOL.soilTan, state.land.soilTan],
    [POOL.soilPo4, state.land.soilPo4],
    [POOL.soilSubstrate, state.land.soilSubstrateCod],
  ]);
  organicToPools(pools, WATER_FOOD, water.food);
  organicToPools(pools, WATER_DETRITUS, water.detritus);
  organicToPools(pools, WATER_INERT, water.inert);
  organicToPools(pools, LAND_LITTER, state.land.litter);
  for (const population of state.populations)
    pools.set(populationKey(population.id), population.cod);
  return pools;
}

function fromPools(state: SimulationState, pools: Pools): void {
  const water = state.water;
  water.o2 = pools.get(POOL.o2) ?? 0;
  water.co2 = pools.get(POOL.co2) ?? 0;
  water.tan = pools.get(POOL.tan) ?? 0;
  water.no2 = pools.get(POOL.no2) ?? 0;
  water.no3 = pools.get(POOL.no3) ?? 0;
  water.po4 = pools.get(POOL.po4) ?? 0;
  water.alkalinityMg = pools.get(POOL.alkalinity) ?? 0;
  water.substrateCod = pools.get(POOL.substrate) ?? 0;
  state.land.soilTan = pools.get(POOL.soilTan) ?? 0;
  state.land.soilPo4 = pools.get(POOL.soilPo4) ?? 0;
  poolsToOrganic(pools, WATER_FOOD, water.food);
  poolsToOrganic(pools, WATER_DETRITUS, water.detritus);
  poolsToOrganic(pools, WATER_INERT, water.inert);
  poolsToOrganic(pools, LAND_LITTER, state.land.litter);
  for (const population of state.populations) {
    population.cod = pools.get(populationKey(population.id)) ?? 0;
  }
  state.land.soilSubstrateCod = pools.get(POOL.soilSubstrate) ?? 0;
  state.ledger.nOut += pools.get(POOL.n2Out) ?? 0;
  state.tracking.nitrifiedN += pools.get(POOL.nitrified) ?? 0;
}

function seedMicrobes(state: SimulationState, dtDays: number, landAreaM2: number): void {
  for (const population of state.populations) {
    const zone = MICROBES[population.archetypeId].zone;
    const units = zone === 'water' ? state.water.volumeL : landAreaM2;
    if (units <= 0) continue;
    const added = seedingCod(population.archetypeId, units, dtDays);
    population.cod += added;
    state.ledger.nIn += added * STOICHIOMETRY.nPerBiomassCod.value;
    state.ledger.pIn += added * STOICHIOMETRY.pPerBiomassCod.value;
  }
}

/** Advances one fraction of a tick; docs/04 §2 order. */
function integrate(
  state: SimulationState,
  hour: number,
  dtTicks: number,
  firstSubstep: boolean,
): void {
  const dtDays = dtTicks / 24;
  const geometry = computeGeometry(state.config);
  updateWaterTemperature(state, dtTicks);
  updateHydrology(state, dtTicks);
  addRainToLand(state, dtDays);
  exchangeGases(state, dtTicks);
  updateLandClimate(state, hour, dtTicks, firstSubstep);
  seedMicrobes(state, dtDays, geometry.landAreaM2);

  const capacities = microbialCapacities(geometry, state.water.volumeL);
  const pools = toPools(state);
  const handles = state.populations.map((population) => ({
    id: population.id,
    archetypeId: population.archetypeId,
    cod: population.cod,
  }));
  const processes = [
    ...leachingProcesses(pools, state.water.volumeL, dtDays),
    ...waterMicrobeProcesses(pools, handles, {
      volumeL: state.water.volumeL,
      temperatureC: state.water.temperatureC,
      ph: waterPh(state),
      o2SaturationMgL: o2SaturationMgL(state),
      anoxicFraction: geometry.anoxicFraction,
      capacity: capacities,
      dtDays,
    }),
    ...landMicrobeProcesses(pools, handles, {
      landAreaM2: geometry.landAreaM2,
      temperatureC: state.land.airTemperatureC,
      soilMoisture: state.land.soilMoisture,
      soilCapacity: capacities.soil,
      dtDays,
    }),
  ];
  applyProcesses(pools, processes);
  fromPools(state, pools);
  if (geometry.landAreaM2 > 0 && geometry.waterFloorAreaM2 > 0) applyRunoff(state, dtDays);
}

function trackedValues(state: SimulationState): number[] {
  const w = state.water;
  return [w.o2, w.tan, w.no2, w.no3, w.po4, w.substrateCod, w.food.cod, w.detritus.cod, w.volumeL];
}

function exceedsChange(before: readonly number[], after: readonly number[]): boolean {
  return before.some((value, index) => {
    const next = after[index] ?? 0;
    if (value < SUBSTEP_MASS_FLOOR_MG) return false;
    return Math.abs(next - value) / value > MAX_RELATIVE_CHANGE;
  });
}

function integrateTick(state: SimulationState, hour: number): SimulationState {
  const before = trackedValues(state);
  let substeps = 1;
  for (;;) {
    const candidate = cloneState(state);
    for (let index = 0; index < substeps; index += 1) {
      integrate(candidate, hour, 1 / substeps, index === 0);
    }
    if (substeps >= MAX_SUBSTEPS || !exceedsChange(before, trackedValues(candidate))) {
      return candidate;
    }
    substeps *= 2;
  }
}

/** Advances the simulation by one tick (1 game hour). */
export function step(state: SimulationState, commands: readonly Command[] = []): StepResult {
  let next = cloneState(state);
  const events: SimEvent[] = [];
  applyCommands(next, commands);
  const hour = next.tick % 24;
  if (hour === 0) events.push(...startDay(next));
  updateHourlyClimate(next, hour);
  const wasIceCovered = next.water.iceCover;
  next = integrateTick(next, hour);
  events.push(...hourlyEvents(next, wasIceCovered));
  next.tick += 1;
  return { state: next, events };
}
