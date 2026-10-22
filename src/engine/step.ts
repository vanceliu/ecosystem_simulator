import { MICROBE_IDS } from '../content/microbes';
import type { ParameterSet } from '../content/parameters';
import { FOOD, LITTER } from '../content/substances';
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
import {
  feedingProcesses,
  foodNodes,
  indexFood,
  predatorsOf,
  respirationProcesses,
} from './consumers';
import { advanceClonalGenerations, dailyBiology } from './daily';
import { applyCohortFluxes, removeExtinct, updateCohorts } from './demography';
import { arrivals, release } from './emergence';
import { exchangeGases, lampPpfd, updateWaterTemperature } from './environment';
import { dayEndEvents, hourlyEvents, makeEvent, seasonEvents } from './events';
import { applyProcesses, type PoolKey, type Process } from './fluxes';
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
import { sedimentExchange } from './sediment';
import { recordFluxes, rollRecords, sampleHistory } from './records';
import { mix32, rngForTick, type Rng } from './rng';
import { cloneState, copyPopulations } from './state';
import { symbiosisProcesses, updateSymbionts } from './symbiosis';
import type { BiomassPopulation, Command, SimEvent, SimulationState, StepResult } from './types';

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

function tickContext(
  params: ParameterSet,
  state: SimulationState,
  geometry: Geometry,
  dtDays: number,
): BioContext {
  return createBioContext(params, state, toPools(params, state), geometry, dtDays);
}

function applyCommands(
  params: ParameterSet,
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
        const composition = params.stoichiometry.food;
        const target = state.water.volumeL > 0 ? FOOD : LITTER;
        const n = dry * composition.nPerDryMass.value;
        const p = dry * composition.pPerDryMass.value;
        state.substances[target.cod] += dry * composition.codPerDryMass.value;
        state.substances[target.n] += n;
        state.substances[target.p] += p;
        state.ledger.nIn += n;
        state.ledger.pIn += p;
        break;
      }
      case 'release': {
        const event = release(tickContext(params, state, geometry, 0), command, rng);
        if (event !== null) events.push(event);
        break;
      }
    }
  }
  return events;
}

/** Closes the previous game day (from tick 24 on) and opens the next one. */
function startDay(
  params: ParameterSet,
  state: SimulationState,
  geometry: Geometry,
  rng: Rng,
): SimEvent[] {
  const events = dayEndEvents(params, state);
  if (state.tick > 0) {
    rollRecords(state);
    events.push(
      ...dailyBiology(params, state, spaceOf(state, geometry), rng, state.tracking.saturated),
    );
  }
  const previousWet = state.climate.wetSeason;
  const dayOfYear = dayOfYearAt(state.config.startDayOfYear, state.tick);
  const daily = dailyClimate(params, state.config.location, dayOfYear);
  const outdoor = state.config.placement === 'outdoor';
  state.climate.dayOfYear = dayOfYear;
  state.climate.dayLengthH = daily.dayLengthH;
  state.climate.sunshine = daily.sunshine;
  state.climate.wetSeason = daily.wetSeason;
  state.climate.ambientHumidity = daily.humidity;
  state.climate.ambientDayMeanC = ambientDayMeanOf(params, state, dayOfYear);
  state.climate.rainTodayMm = outdoor
    ? drawRainfall(params, daily, rngForTick(state.seedHash, state.tick))
    : 0;
  state.climate.evaporationTodayMm = outdoor ? daily.evaporationMmPerDay : 0;
  return [...events, ...seasonEvents(state, previousWet)];
}

function ambientDayMeanOf(params: ParameterSet, state: SimulationState, dayOfYear: number): number {
  return state.config.placement === 'outdoor'
    ? dailyClimate(params, state.config.location, dayOfYear).meanTemperatureC
    : state.config.roomTemperatureC;
}

function updateHourlyClimate(params: ParameterSet, state: SimulationState, hour: number): void {
  const config = state.config;
  if (config.placement === 'outdoor') {
    const daily = dailyClimate(params, config.location, state.climate.dayOfYear);
    state.climate.ambientTemperatureC = hourlyAmbientTemperature(params, daily, hour);
    const water = params.mechanics.water;
    const iceFactor = state.water.iceCover
      ? state.water.snowOnIce
        ? water.snowLightFactor
        : water.iceLightFactor
      : 1;
    state.climate.ppfd =
      naturalPpfd(params, config.location, daily, hour) * (1 - config.shading) * iceFactor;
  } else {
    state.climate.ambientTemperatureC = config.roomTemperatureC;
    state.climate.ppfd = lampPpfd(state, hour);
  }
}

/** docs/04 §5.2 background seeding into the dominant strain of each seeded microbe. */
function seedMicrobes(
  params: ParameterSet,
  state: SimulationState,
  dtDays: number,
  landAreaM2: number,
): void {
  for (const id of MICROBE_IDS) {
    const archetype = params.archetypes[id];
    const units = archetype.zone === 'T' ? landAreaM2 : state.water.volumeL;
    if (units <= 0) continue;
    let dominant: BiomassPopulation | null = null;
    for (const population of state.populations) {
      if (population.kind !== 'biomass' || population.archetypeId !== id) continue;
      if (dominant === null || population.cod > dominant.cod) dominant = population;
    }
    if (dominant === null) continue;
    const added = seedingCod(params, id, units, dtDays);
    dominant.cod += added;
    const ratios = bodyRatios(params, archetype);
    state.ledger.nIn += added * ratios.n;
    state.ledger.pIn += added * ratios.p;
  }
}

/** Advances one fraction of a tick; docs/04 §2 steps 2–9. */
function integrate(
  params: ParameterSet,
  state: SimulationState,
  hour: number,
  dtTicks: number,
  firstSubstep: boolean,
): SubstepFluxes {
  const dtDays = dtTicks / 24;
  const geometry = computeGeometry(params, state.config);
  updateWaterTemperature(params, state, dtTicks);
  updateHydrology(params, state, dtTicks);
  addRainToLand(params, state, dtDays);
  exchangeGases(params, state, dtTicks);
  updateLandClimate(params, state, hour, dtTicks, firstSubstep);
  seedMicrobes(params, state, dtDays, geometry.landAreaM2);

  const pools = toPools(params, state);
  const context = createBioContext(params, state, pools, geometry, dtDays);
  const biomass = state.populations.filter(
    (population): population is BiomassPopulation => population.kind === 'biomass',
  );
  const before = new Map<PoolKey, number>(
    biomass.map((population) => [populationKey(population.id), population.cod]),
  );
  const processes = [
    ...leachingProcesses(params, pools, state.water.volumeL, dtDays),
    ...sedimentExchange(context),
    ...waterMicrobeProcesses(context, biomass),
    ...landMicrobeProcesses(context, biomass),
    ...producerProcesses(context, biomass),
    ...symbiosisProcesses(context, state.populations),
    ...feedingProcesses(
      context,
      predatorsOf(context, state.populations),
      indexFood(foodNodes(context, state.populations)),
    ),
    ...respirationProcesses(context, state.populations),
    ...mortalityProcesses(context, state.populations),
  ].map((process) => withAlkalinity(params, process));
  const effective = applyProcesses(pools, processes);
  fromPools(state, pools);
  applyCohortFluxes(params, state, pools, processes, effective);
  advanceClonalGenerations(params, state, processes, effective, before);
  if (geometry.landAreaM2 > 0 && geometry.waterFloorAreaM2 > 0) applyRunoff(params, state, dtDays);
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
    water: { ...state.water },
    land: { ...state.land },
    substances: { ...state.substances },
    populations: copyPopulations(state.populations),
    ledger: { ...state.ledger },
    tracking: { ...state.tracking },
  };
}

/** Tracked water pools as concentrations (mg/L), plus the volume itself. */
const TRACKED_SUBSTANCES = [
  'water_o2',
  'water_tan',
  'water_no2',
  'water_no3',
  'water_po4',
  'water_substrate',
  'food_cod',
  'detritus_cod',
] as const;

function trackedValues(state: SimulationState): number[] {
  const volume = Math.max(state.water.volumeL, 1e-9);
  const masses = TRACKED_SUBSTANCES.map((id) => state.substances[id]);
  return [...masses.map((mass) => mass / volume), state.water.volumeL];
}

function exceedsChange(
  params: ParameterSet,
  before: readonly number[],
  after: readonly number[],
): boolean {
  const numerics = params.mechanics.numerics;
  return before.some((value, index) => {
    const next = after[index] ?? 0;
    if (value < numerics.substepConcentrationFloor) return false;
    return Math.abs(next - value) / value > numerics.maxRelativeChange;
  });
}

function integrateTick(
  params: ParameterSet,
  state: SimulationState,
  hour: number,
): SimulationState {
  const before = trackedValues(state);
  const maxSubsteps = params.mechanics.numerics.maxSubsteps;
  let substeps = Math.max(1, Math.floor(state.tracking.substeps / 2));
  for (;;) {
    const candidate = cloneForIntegration(state);
    const fluxes: SubstepFluxes[] = [];
    for (let index = 0; index < substeps; index += 1) {
      fluxes.push(integrate(params, candidate, hour, 1 / substeps, index === 0));
    }
    if (substeps >= maxSubsteps || !exceedsChange(params, before, trackedValues(candidate))) {
      for (const { processes, effective } of fluxes)
        recordFluxes(candidate.records, processes, effective);
      candidate.tracking.substeps = substeps;
      return candidate;
    }
    substeps = Math.min(maxSubsteps, substeps * 2);
  }
}

/** docs/04 §2 step 10 and §9.2: demography, arrivals, extinction, saturation. */
function populationStep(
  params: ParameterSet,
  state: SimulationState,
  geometry: Geometry,
  rng: Rng,
): SimEvent[] {
  const events: SimEvent[] = [];
  for (const population of updateSymbionts(
    params,
    state.populations,
    state.climate.ppfd,
    state.water.temperatureC,
  )) {
    events.push(makeEvent('coral_bleaching', state.tick, { speciesId: population.speciesId }));
  }
  const space = spaceOf(state, geometry);
  events.push(...updateCohorts(params, state, space, rng, state.tracking.saturated));
  if (!state.tracking.saturated) arrivals(tickContext(params, state, geometry, 1 / 24), rng);
  events.push(...removeExtinct(params, state));
  const count = state.populations.length;
  const limits = params.mechanics.limits;
  if (!state.tracking.saturated && count >= limits.saturationLimit) {
    state.tracking.saturated = true;
    events.push(makeEvent('ecosystem_saturated', state.tick));
  } else if (state.tracking.saturated && count < limits.saturationResume) {
    state.tracking.saturated = false;
  }
  for (const population of state.populations) {
    if (!Number.isFinite(populationCod(params, population)))
      throw new Error(`Non-finite ${population.id}`);
  }
  return events;
}

/** Advances the simulation by one tick (1 game hour). */
export function step(
  params: ParameterSet,
  state: SimulationState,
  commands: readonly Command[] = [],
): StepResult {
  let next = cloneState(state);
  const geometry = computeGeometry(params, next.config);
  const rng = rngForTick(mix32(next.seedHash, BIOLOGY_STREAM), next.tick);
  const events: SimEvent[] = applyCommands(params, next, commands, geometry, rng);
  const hour = next.tick % 24;
  if (hour === 0) events.push(...startDay(params, next, geometry, rng));
  updateHourlyClimate(params, next, hour);
  const wasIceCovered = next.water.iceCover;
  next = integrateTick(params, next, hour);
  events.push(...populationStep(params, next, geometry, rng));
  sampleHistory(params, next);
  events.push(...hourlyEvents(params, next, wasIceCovered));
  next.tick += 1;
  return { state: next, events };
}
