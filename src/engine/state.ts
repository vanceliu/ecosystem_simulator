import { getArchetype } from '../content/archetypes/index';
import { MICROBIAL_PROCESSES, type MicrobeId } from '../content/microbes';
import { LITTER_COMPOSITION, STOICHIOMETRY } from '../content/stoichiometry';
import {
  HARDSCAPE_SURFACE,
  LAND_SUBSTRATES,
  SUBSTRATES,
  WILD_LITTER_STOCK,
  WILD_MATERIALS,
} from '../content/tankOptions';
import { CO2_EQUILIBRIUM_MG_L, oxygenSaturation, pressureAtm } from './atmosphere';
import { dailyClimate, hourlyAmbientTemperature } from './climate';
import {
  computeGeometry,
  microbialCapacities,
  MAX_TOTAL_VOLUME_L,
  type Geometry,
} from './geometry';
import { targetHumidity, targetSoilMoisture } from './land';
import { waterComposition } from './sourceWater';
import type { Vector } from '../content/archetype';
import { createBioContext } from './bioContext';
import { bodyRatios, populationCod } from './biota';
import {
  INITIAL_MICROBE_STRAINS,
  inoculate,
  ORIGIN,
  pickSuitableGenotype,
  setupRoutes,
  type Route,
} from './emergence';
import { foundBiomass, registerSpecies } from './founding';
import { toPools } from './pools';
import { emptyRecords } from './records';
import { createRng, hashSeed, mix32 } from './rng';
import type {
  ClimateState,
  OrganicPool,
  Population,
  Records,
  SimulationState,
  TankConfig,
} from './types';

const MICROBE_ORDER: readonly MicrobeId[] = [
  'heterotroph',
  'aob',
  'nob',
  'denitrifier',
  'soil_bacteria',
  'saprotrophic_fungus',
];
const isLandMicrobe = (id: MicrobeId): boolean => getArchetype(id).zone === 'T';
const LAND_MICROBE_COUNT = MICROBE_ORDER.filter(isLandMicrobe).length;
/** rng stream for setup draws, distinct from per-tick streams */
const SETUP_STREAM = 0x5e7019;
const ML_PER_L = 1000;
const MG_PER_G = 1000;
const CM2_PER_M2 = 1e4;
/** Wild inocula fill at most this share of a habitat's microbial capacity. */
const MAX_INITIAL_CAPACITY_SHARE = 0.5;

export const emptyPool = (): OrganicPool => ({ cod: 0, n: 0, p: 0 });

const cellsToCod = (cells: number): number =>
  cells * STOICHIOMETRY.cellDryMassMg.value * STOICHIOMETRY.codPerDryBiomass.value;

export function ambientDayMean(config: TankConfig, dayOfYear: number): number {
  return config.placement === 'outdoor'
    ? dailyClimate(config.location, dayOfYear).meanTemperatureC
    : config.roomTemperatureC;
}

export function initialClimateState(config: TankConfig): ClimateState {
  const daily = dailyClimate(config.location, config.startDayOfYear);
  return {
    dayOfYear: config.startDayOfYear,
    ambientTemperatureC:
      config.placement === 'outdoor' ? hourlyAmbientTemperature(daily, 0) : config.roomTemperatureC,
    ambientDayMeanC: ambientDayMean(config, config.startDayOfYear),
    ambientHumidity: daily.humidity,
    dayLengthH: daily.dayLengthH,
    ppfd: 0,
    rainTodayMm: 0,
    evaporationTodayMm: 0,
    sunshine: daily.sunshine,
    wetSeason: daily.wetSeason,
  };
}

export function validateTankConfig(config: TankConfig): string[] {
  const errors: string[] = [];
  const geometry = computeGeometry(config);
  if (geometry.totalVolumeL > MAX_TOTAL_VOLUME_L) errors.push('total volume exceeds 100,000 L');
  if (config.landFraction < 0 || config.landFraction > 1) errors.push('landFraction out of range');
  if (config.waterDepthCm > config.heightCm) errors.push('water deeper than tank height');
  if (config.shading < 0 || config.shading > 0.9) errors.push('shading out of range');
  if (config.salinityPpt < 0 || config.salinityPpt > 45) errors.push('salinity out of range');
  return errors;
}

interface WaterInoculum {
  readonly microbes: Partial<Record<MicrobeId, number>>;
  readonly detritus: OrganicPool;
}

/** Biofilm microbes and organic matter on wild rocks, wood and substrate; docs/04 §5.2. */
function wildWaterMaterials(config: TankConfig, geometry: Geometry): WaterInoculum {
  const microbes: Partial<Record<MicrobeId, number>> = {};
  const detritus = emptyPool();
  if (geometry.nominalWaterVolumeL <= 0) return { microbes, detritus };
  const add = (id: MicrobeId, cod: number): void => {
    microbes[id] = (microbes[id] ?? 0) + cod;
  };
  const nitrifierShare = WILD_MATERIALS.nitrifierShare.value;
  const colonise = (
    surfaceM2: number,
    denitrifierShare: number,
    organicSurfaceM2: number,
  ): void => {
    const cells = WILD_MATERIALS.biofilmBacteriaPerCm2.value * CM2_PER_M2 * surfaceM2;
    add('aob', cellsToCod(cells * nitrifierShare));
    add('nob', cellsToCod(cells * nitrifierShare));
    add('denitrifier', cellsToCod(cells * denitrifierShare));
    add('heterotroph', cellsToCod(cells * (1 - 2 * nitrifierShare - denitrifierShare)));
    const organic = WILD_MATERIALS.biofilmOrganicPerM2.value * organicSurfaceM2;
    detritus.cod += organic;
    detritus.n += organic * STOICHIOMETRY.nPerBiomassCod.value;
    detritus.p += organic * STOICHIOMETRY.pPerBiomassCod.value;
  };
  for (const item of config.hardscape) {
    if (item.source.origin !== 'wild') continue;
    const surface = HARDSCAPE_SURFACE[item.type].value * geometry.waterFloorAreaM2;
    colonise(surface, 0, surface);
  }
  if (config.substrate !== 'bare' && config.substrateSource.origin === 'wild') {
    const organicDepth = Math.min(
      config.substrateDepthCm,
      WILD_MATERIALS.organicSubstrateDepthCm.value,
    );
    const organicSurface =
      SUBSTRATES[config.substrate].surfacePerFloorPerCm.value *
      organicDepth *
      geometry.waterFloorAreaM2;
    colonise(geometry.substrateSurfaceM2, WILD_MATERIALS.denitrifierShare.value, organicSurface);
  }
  return { microbes, detritus };
}

function wildSoilMicrobes(
  config: TankConfig,
  geometry: Geometry,
): Partial<Record<MicrobeId, number>> {
  if (config.landSubstrate === null || geometry.landAreaM2 <= 0) return {};
  const capacity = microbialCapacities(geometry, 0, config.landSubstrateDepthCm).soil;
  if (config.landSubstrateSource.origin === 'clean') {
    const each =
      (capacity * MICROBIAL_PROCESSES.initialSoilMicrobeFraction.value) / LAND_MICROBE_COUNT;
    return { soil_bacteria: each, saprotrophic_fungus: each };
  }
  const cells =
    WILD_MATERIALS.soilBacteriaPerG.value *
    WILD_MATERIALS.soilBulkDensity.value *
    config.landSubstrateDepthCm *
    CM2_PER_M2 *
    geometry.landAreaM2;
  const bacteria = cellsToCod(cells);
  const fungus = bacteria * WILD_MATERIALS.fungusToBacteriaRatio.value;
  const scale = Math.min(1, (capacity * MAX_INITIAL_CAPACITY_SHARE) / (bacteria + fungus));
  return { soil_bacteria: bacteria * scale, saprotrophic_fungus: fungus * scale };
}

function initialLitter(config: TankConfig, geometry: Geometry): OrganicPool {
  if (config.landSubstrate === null) return emptyPool();
  const dryG =
    config.landSubstrateSource.origin === 'wild'
      ? WILD_LITTER_STOCK[config.location.latitudeZone].value
      : LAND_SUBSTRATES[config.landSubstrate].initialLitterDryG.value;
  const dryMg = dryG * geometry.landAreaM2 * MG_PER_G;
  return {
    cod: dryMg * LITTER_COMPOSITION.codPerDryMass.value,
    n: dryMg * LITTER_COMPOSITION.nPerDryMass.value,
    p: dryMg * LITTER_COMPOSITION.pPerDryMass.value,
  };
}

function capWaterMicrobes(
  microbes: Partial<Record<MicrobeId, number>>,
  geometry: Geometry,
  volume: number,
): Partial<Record<MicrobeId, number>> {
  const capacities = microbialCapacities(geometry, volume, 0);
  const limit = (ids: readonly MicrobeId[], capacity: number): void => {
    const total = ids.reduce((sum, id) => sum + (microbes[id] ?? 0), 0);
    const allowed = capacity * MAX_INITIAL_CAPACITY_SHARE;
    if (total <= allowed || total <= 0) return;
    for (const id of ids) microbes[id] = ((microbes[id] ?? 0) * allowed) / total;
  };
  limit(['heterotroph'], capacities.free);
  limit(['aob', 'nob'], capacities.attached);
  limit(['denitrifier'], capacities.substrate);
  return microbes;
}

/** docs/04 §3; all water and land pools are total masses in mg. */
export function createInitialState(config: TankConfig, worldSeed: string): SimulationState {
  const errors = validateTankConfig(config);
  if (errors.length > 0) throw new Error(`Invalid tank config: ${errors.join('; ')}`);
  const geometry = computeGeometry(config);
  const volume = geometry.nominalWaterVolumeL;
  const water = waterComposition(config);
  const climate = initialClimateState(config);
  const waterTemperature =
    config.heaterSetpointC !== null && config.heaterSetpointC > climate.ambientDayMeanC
      ? config.heaterSetpointC
      : Math.max(0, climate.ambientDayMeanC);
  const atm = pressureAtm(config.location.altitudeM);
  const wild = wildWaterMaterials(config, geometry);

  const waterMicrobes: Partial<Record<MicrobeId, number>> = {};
  for (const id of MICROBE_ORDER) {
    if (isLandMicrobe(id) || volume <= 0) continue;
    waterMicrobes[id] =
      cellsToCod((water.inoculum[id] ?? 0) * ML_PER_L * volume) + (wild.microbes[id] ?? 0);
  }
  const startingCod = {
    ...capWaterMicrobes(waterMicrobes, geometry, volume),
    ...wildSoilMicrobes(config, geometry),
  };

  const state: SimulationState = {
    schema: 1,
    worldSeed,
    seedHash: hashSeed(worldSeed),
    tick: 0,
    config,
    water: {
      volumeL: volume,
      temperatureC: waterTemperature,
      saltMg: water.salinityPpt * MG_PER_G * volume,
      alkalinityMg: water.kh * STOICHIOMETRY.caco3PerDkh.value * volume,
      o2: oxygenSaturation(waterTemperature, water.salinityPpt, atm) * volume,
      co2: CO2_EQUILIBRIUM_MG_L * volume,
      tan: water.tan * volume,
      no2: 0,
      no3: water.no3 * volume,
      po4: water.po4 * volume,
      sio2: water.sio2 * volume,
      ca: water.ca * volume,
      substrateCod: water.labileCod * volume,
      food: emptyPool(),
      detritus: wild.detritus,
      inert: { cod: water.refractoryCod * volume, n: 0, p: 0 },
      iceCover: false,
      snowOnIce: false,
    },
    land: {
      airTemperatureC: climate.ambientTemperatureC,
      humidity: 0,
      soilMoisture: 0,
      litter: initialLitter(config, geometry),
      soilSubstrateCod: 0,
      soilTan: 0,
      soilPo4: 0,
    },
    climate,
    species: {},
    populations: [],
    nextPopulationId: 1,
    records: emptyRecords(),
    ledger: { nIn: 0, nOut: 0, pIn: 0, pOut: 0 },
    tracking: {
      cycleStatus: 'no_load',
      cycledDays: 0,
      nitrifiedN: 0,
      nitrifiedAtDayStart: 0,
      ammoniaAlert: false,
      nitriteAlert: false,
      hypoxiaAlert: false,
      droughtAlert: false,
      dayLengthAbove12: climate.dayLengthH > 12,
      uvbOffDays: 0,
      uvbAlert: false,
      dryAirAlert: false,
      saturated: false,
      trophicMilestone: 0,
      substeps: 1,
    },
  };
  state.land.humidity = targetHumidity(state);
  state.land.soilMoisture = geometry.landAreaM2 > 0 ? targetSoilMoisture(state) : 0;
  const rng = createRng(mix32(state.seedHash, SETUP_STREAM));
  const context = createBioContext(state, toPools(state), geometry, 0);
  const routes = setupRoutes(config);
  for (const archetypeId of MICROBE_ORDER) {
    const cod = startingCod[archetypeId] ?? 0;
    if (!(cod > 0)) continue;
    const archetype = getArchetype(archetypeId);
    const vector = microbeVector(archetype.zone === 'T', routes);
    const strains: string[] = [];
    for (let draw = 0; draw < INITIAL_MICROBE_STRAINS; draw += 1) {
      const speciesId = pickSuitableGenotype(context, archetype, rng);
      if (speciesId !== null) strains.push(speciesId);
    }
    for (const speciesId of strains) {
      registerSpecies(state, { id: speciesId, origin: ORIGIN[vector], introduced: false });
      foundBiomass(state, speciesId, vector, cod / strains.length);
    }
  }
  inoculate(createBioContext(state, toPools(state), geometry, 0), rng);
  state.ledger = { nIn: 0, nOut: 0, pIn: 0, pOut: 0 };
  for (const population of state.populations) population.dayStartCod = populationCod(population);
  return state;
}

/** Route credited with the starting microbes of water or soil. */
function microbeVector(onLand: boolean, routes: readonly Route[]): Vector {
  const wanted: readonly Vector[] = onLand
    ? ['soil', 'leaf_litter']
    : [
        'tap_water',
        'aged_water',
        'pond_water',
        'natural_seawater',
        'live_rock',
        'wild_rock',
        'live_sand',
        'driftwood',
      ];
  return routes.find((route) => wanted.includes(route.vector))?.vector ?? 'background';
}

const copyRows = (table: Readonly<Record<string, number[]>>): Record<string, number[]> => {
  const copy: Record<string, number[]> = {};
  for (const key in table) copy[key] = (table[key] ?? []).slice();
  return copy;
};

export function copyPopulations(populations: readonly Population[]): Population[] {
  return populations.map((population) =>
    population.kind === 'biomass'
      ? { ...population, recentDaySize: population.recentDaySize.slice() }
      : {
          ...population,
          recentDaySize: population.recentDaySize.slice(),
          cohorts: population.cohorts.map((cohort) => ({ ...cohort })),
        },
  );
}

export function copyRecords(records: Records): Records {
  const accumulator: Record<string, [number, number]> = {};
  for (const key in records.historyAccumulator) {
    const entry = records.historyAccumulator[key];
    if (entry !== undefined) accumulator[key] = [entry[0], entry[1]];
  }
  return {
    day: records.day,
    feeding: copyRows(records.feeding),
    chemistry: copyRows(records.chemistry),
    history: copyRows(records.history),
    historyAccumulator: accumulator,
    trophicLevels: { ...records.trophicLevels },
  };
}

/** Deep copy of the mutable state; the config and species records are immutable and shared. */
export function cloneState(state: SimulationState): SimulationState {
  const water = state.water;
  const land = state.land;
  return {
    ...state,
    water: {
      ...water,
      food: { ...water.food },
      detritus: { ...water.detritus },
      inert: { ...water.inert },
    },
    land: { ...land, litter: { ...land.litter } },
    climate: { ...state.climate },
    species: { ...state.species },
    populations: copyPopulations(state.populations),
    records: copyRecords(state.records),
    ledger: { ...state.ledger },
    tracking: { ...state.tracking },
  };
}

/** Living N or P held by all populations, mg. */
function livingElement(state: SimulationState, element: 'n' | 'p'): number {
  return state.populations.reduce(
    (sum, population) =>
      sum + populationCod(population) * bodyRatios(getArchetype(population.archetypeId))[element],
    0,
  );
}

/** Total nitrogen held in the tank, mg. */
export function totalNitrogen(state: SimulationState): number {
  const w = state.water;
  return (
    w.tan +
    w.no2 +
    w.no3 +
    w.food.n +
    w.detritus.n +
    w.inert.n +
    state.land.litter.n +
    state.land.soilTan +
    livingElement(state, 'n')
  );
}

/** Total phosphorus held in the tank, mg. */
export function totalPhosphorus(state: SimulationState): number {
  const w = state.water;
  return (
    w.po4 +
    w.food.p +
    w.detritus.p +
    w.inert.p +
    state.land.litter.p +
    state.land.soilPo4 +
    livingElement(state, 'p')
  );
}
