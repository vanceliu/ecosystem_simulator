import { getArchetype } from '../content/archetypes/index';
import { BACKGROUND_SEEDING, type MicrobeId } from '../content/microbes';
import { FOOD_COMPOSITION } from '../content/stoichiometry';
import { createBioContext, type BioContext } from './bioContext';
import { bodyRatios, populationCod } from './biota';
import type { Space } from './capacity';
import {
  dailyClimate,
  dayOfYearAt,
  drawRainfall,
  hourlyAmbientTemperature,
  naturalPpfd,
} from './climate';
import { feedingProcesses, foodNodes, predatorsOf, respirationProcesses } from './consumers';
import { advanceClonalGenerations, dailyBiology } from './daily';
import { applyCohortFluxes, removeExtinct, updateCohorts } from './demography';
import { arrivals, release, SATURATION_LIMIT, SATURATION_RESUME } from './emergence';
import { exchangeGases, lampPpfd, updateWaterTemperature } from './environment';
import { dayEndEvents, hourlyEvents, makeEvent, seasonEvents } from './events';
import { applyProcesses, type Process } from './fluxes';
import { computeGeometry, type Geometry } from './geometry';
import { addRainToLand, updateHydrology } from './hydrology';
import { applyRunoff, updateLandClimate } from './land';
import {
  landMicrobeProcesses,
  leachingProcesses,
  seedingCod,
  waterMicrobeProcesses,
} from './microbes';
import { mortalityProcesses } from './mortality';
import { fromPools, populationKey, toPools, withAlkalinity } from './pools';
import { producerProcesses } from './producers';
import { recordFluxes, rollRecords, sampleHistory } from './records';
import { mix32, rngForTick, type Rng } from './rng';
import { cloneState, copyPopulations } from './state';
import { symbiosisProcesses, updateSymbionts } from './symbiosis';
import type { BiomassPopulation, Command, SimEvent, SimulationState, StepResult } from './types';

/** docs/04 §9: split a tick when any tracked pool changes by more than this fraction. */
export const MAX_RELATIVE_CHANGE = 0.5;
export const MAX_SUBSTEPS = 8;
/** docs/04 §9: pools below this concentration (mg/L) are ignored by the substep check. */
export const SUBSTEP_CONCENTRATION_FLOOR = 0.1;
/** docs/11 §7: light through ice; snow-covered ice */
const ICE_LIGHT_FACTOR = 0.5;
const SNOW_LIGHT_FACTOR = 0.05;
/** rng stream for biological draws, distinct from the climate stream */
const BIOLOGY_STREAM = 0x62696f;

function spaceOf(state: SimulationState, geometry: Geometry): Space {
  return {
    geometry,
    waterVolumeL: state.water.volumeL,
    landSubstrateDepthCm:
      state.config.landSubstrate === null ? 0 : state.config.landSubstrateDepthCm,
  };
}

function tickContext(state: SimulationState, geometry: Geometry, dtDays: number): BioContext {
  return createBioContext(state, toPools(state), geometry, dtDays);
}

function applyCommands(
  state: SimulationState,
  commands: readonly Command[],
  geometry: Geometry,
  rng: Rng,
): SimEvent[] {
  const events: SimEvent[] = [];
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
      case 'release': {
        const event = release(tickContext(state, geometry, 0), command, rng);
        if (event !== null) events.push(event);
        break;
      }
    }
  }
  return events;
}

/** Closes the previous game day (from tick 24 on) and opens the next one. */
function startDay(state: SimulationState, geometry: Geometry, rng: Rng): SimEvent[] {
  const events = dayEndEvents(state);
  if (state.tick > 0) {
    rollRecords(state);
    events.push(...dailyBiology(state, spaceOf(state, geometry), rng, state.tracking.saturated));
  }
  const previousWet = state.climate.wetSeason;
  const dayOfYear = dayOfYearAt(state.config.startDayOfYear, state.tick);
  const daily = dailyClimate(state.config.location, dayOfYear);
  const outdoor = state.config.placement === 'outdoor';
  state.climate.dayOfYear = dayOfYear;
  state.climate.dayLengthH = daily.dayLengthH;
  state.climate.sunshine = daily.sunshine;
  state.climate.wetSeason = daily.wetSeason;
  state.climate.ambientHumidity = daily.humidity;
  state.climate.ambientDayMeanC = ambientDayMeanOf(state, dayOfYear);
  state.climate.rainTodayMm = outdoor
    ? drawRainfall(daily, rngForTick(state.seedHash, state.tick))
    : 0;
  state.climate.evaporationTodayMm = outdoor ? daily.evaporationMmPerDay : 0;
  return [...events, ...seasonEvents(state, previousWet)];
}

function ambientDayMeanOf(state: SimulationState, dayOfYear: number): number {
  return state.config.placement === 'outdoor'
    ? dailyClimate(state.config.location, dayOfYear).meanTemperatureC
    : state.config.roomTemperatureC;
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

/** docs/04 §5.2 background seeding into the dominant strain of each seeded microbe. */
function seedMicrobes(state: SimulationState, dtDays: number, landAreaM2: number): void {
  for (const id of Object.keys(BACKGROUND_SEEDING) as MicrobeId[]) {
    const archetype = getArchetype(id);
    const units = archetype.zone === 'T' ? landAreaM2 : state.water.volumeL;
    if (units <= 0) continue;
    let dominant: BiomassPopulation | null = null;
    for (const population of state.populations) {
      if (population.kind !== 'biomass' || population.archetypeId !== id) continue;
      if (dominant === null || population.cod > dominant.cod) dominant = population;
    }
    if (dominant === null) continue;
    const added = seedingCod(id, units, dtDays);
    dominant.cod += added;
    const ratios = bodyRatios(archetype);
    state.ledger.nIn += added * ratios.n;
    state.ledger.pIn += added * ratios.p;
  }
}

/** Advances one fraction of a tick; docs/04 §2 steps 2–9. */
function integrate(
  state: SimulationState,
  hour: number,
  dtTicks: number,
  firstSubstep: boolean,
): SubstepFluxes {
  const dtDays = dtTicks / 24;
  const geometry = computeGeometry(state.config);
  updateWaterTemperature(state, dtTicks);
  updateHydrology(state, dtTicks);
  addRainToLand(state, dtDays);
  exchangeGases(state, dtTicks);
  updateLandClimate(state, hour, dtTicks, firstSubstep);
  seedMicrobes(state, dtDays, geometry.landAreaM2);

  const pools = toPools(state);
  const context = createBioContext(state, pools, geometry, dtDays);
  const biomass = state.populations.filter(
    (population): population is BiomassPopulation => population.kind === 'biomass',
  );
  const before = new Map(
    biomass.map((population) => [populationKey(population.id), population.cod]),
  );
  const processes = [
    ...leachingProcesses(pools, state.water.volumeL, dtDays),
    ...waterMicrobeProcesses(context, biomass),
    ...landMicrobeProcesses(context, biomass),
    ...producerProcesses(context, biomass),
    ...symbiosisProcesses(context, state.populations),
    ...feedingProcesses(
      context,
      predatorsOf(context, state.populations),
      foodNodes(context, state.populations),
    ),
    ...respirationProcesses(context, state.populations),
    ...mortalityProcesses(context, state.populations),
  ].map(withAlkalinity);
  const effective = applyProcesses(pools, processes);
  fromPools(state, pools);
  applyCohortFluxes(state, pools, processes, effective);
  advanceClonalGenerations(state, processes, effective, before);
  if (geometry.landAreaM2 > 0 && geometry.waterFloorAreaM2 > 0) applyRunoff(state, dtDays);
  return { processes, effective };
}

interface SubstepFluxes {
  readonly processes: readonly Process[];
  readonly effective: readonly number[];
}

/** Copies the parts of the state that integration mutates; records and species are shared. */
function cloneForIntegration(state: SimulationState): SimulationState {
  return {
    ...state,
    water: {
      ...state.water,
      food: { ...state.water.food },
      detritus: { ...state.water.detritus },
      inert: { ...state.water.inert },
    },
    land: { ...state.land, litter: { ...state.land.litter } },
    populations: copyPopulations(state.populations),
    ledger: { ...state.ledger },
    tracking: { ...state.tracking },
  };
}

/** Tracked water pools as concentrations (mg/L), plus the volume itself. */
function trackedValues(state: SimulationState): number[] {
  const w = state.water;
  const volume = Math.max(w.volumeL, 1e-9);
  const pools = [w.o2, w.tan, w.no2, w.no3, w.po4, w.substrateCod, w.food.cod, w.detritus.cod];
  return [...pools.map((mass) => mass / volume), w.volumeL];
}

function exceedsChange(before: readonly number[], after: readonly number[]): boolean {
  return before.some((value, index) => {
    const next = after[index] ?? 0;
    if (value < SUBSTEP_CONCENTRATION_FLOOR) return false;
    return Math.abs(next - value) / value > MAX_RELATIVE_CHANGE;
  });
}

function integrateTick(state: SimulationState, hour: number): SimulationState {
  const before = trackedValues(state);
  let substeps = Math.max(1, Math.floor(state.tracking.substeps / 2));
  for (;;) {
    const candidate = cloneForIntegration(state);
    const fluxes: SubstepFluxes[] = [];
    for (let index = 0; index < substeps; index += 1) {
      fluxes.push(integrate(candidate, hour, 1 / substeps, index === 0));
    }
    if (substeps >= MAX_SUBSTEPS || !exceedsChange(before, trackedValues(candidate))) {
      for (const { processes, effective } of fluxes)
        recordFluxes(candidate.records, processes, effective);
      candidate.tracking.substeps = substeps;
      return candidate;
    }
    substeps = Math.min(MAX_SUBSTEPS, substeps * 2);
  }
}

/** docs/04 §2 step 10 and §9.2: demography, arrivals, extinction, saturation. */
function populationStep(state: SimulationState, geometry: Geometry, rng: Rng): SimEvent[] {
  const events: SimEvent[] = [];
  for (const population of updateSymbionts(
    state.populations,
    state.climate.ppfd,
    state.water.temperatureC,
  )) {
    events.push(makeEvent('coral_bleaching', state.tick, { speciesId: population.speciesId }));
  }
  const space = spaceOf(state, geometry);
  events.push(...updateCohorts(state, space, rng, state.tracking.saturated));
  if (!state.tracking.saturated) arrivals(tickContext(state, geometry, 1 / 24), rng);
  events.push(...removeExtinct(state));
  const count = state.populations.length;
  if (!state.tracking.saturated && count >= SATURATION_LIMIT) {
    state.tracking.saturated = true;
    events.push(makeEvent('ecosystem_saturated', state.tick));
  } else if (state.tracking.saturated && count < SATURATION_RESUME) {
    state.tracking.saturated = false;
  }
  for (const population of state.populations) {
    if (!Number.isFinite(populationCod(population))) throw new Error(`Non-finite ${population.id}`);
  }
  return events;
}

/** Advances the simulation by one tick (1 game hour). */
export function step(state: SimulationState, commands: readonly Command[] = []): StepResult {
  let next = cloneState(state);
  const geometry = computeGeometry(next.config);
  const rng = rngForTick(mix32(next.seedHash, BIOLOGY_STREAM), next.tick);
  const events: SimEvent[] = applyCommands(next, commands, geometry, rng);
  const hour = next.tick % 24;
  if (hour === 0) events.push(...startDay(next, geometry, rng));
  updateHourlyClimate(next, hour);
  const wasIceCovered = next.water.iceCover;
  next = integrateTick(next, hour);
  events.push(...populationStep(next, geometry, rng));
  sampleHistory(next);
  events.push(...hourlyEvents(next, wasIceCovered));
  next.tick += 1;
  return { state: next, events };
}
