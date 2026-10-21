import { MICROBES, MICROBIAL_PROCESSES, type MicrobeId } from '../content/microbes';
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
import { hashSeed } from './rng';
import { waterComposition } from './sourceWater';
import type {
  BiomassPopulation,
  ClimateState,
  OrganicPool,
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
const LAND_MICROBE_COUNT = MICROBE_ORDER.filter((id) => MICROBES[id].zone === 'land').length;
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
  const capacity = microbialCapacities(geometry, 0).soil;
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
  const capacities = microbialCapacities(geometry, volume);
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
    if (MICROBES[id].zone !== 'water' || volume <= 0) continue;
    waterMicrobes[id] =
      cellsToCod((water.inoculum[id] ?? 0) * ML_PER_L * volume) + (wild.microbes[id] ?? 0);
  }
  const startingCod = {
    ...capWaterMicrobes(waterMicrobes, geometry, volume),
    ...wildSoilMicrobes(config, geometry),
  };

  const populations: BiomassPopulation[] = [];
  MICROBE_ORDER.forEach((archetypeId, index) => {
    const zone = MICROBES[archetypeId].zone;
    const hasHabitat = zone === 'water' ? volume > 0 : geometry.landAreaM2 > 0;
    if (!hasHabitat) return;
    populations.push({
      id: `pop-${index + 1}`,
      speciesId: `${archetypeId}:base`,
      archetypeId,
      zone,
      cod: startingCod[archetypeId] ?? 0,
    });
  });

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
    populations,
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
    },
  };
  state.land.humidity = targetHumidity(state);
  state.land.soilMoisture = geometry.landAreaM2 > 0 ? targetSoilMoisture(state) : 0;
  return state;
}

export function cloneState(state: SimulationState): SimulationState {
  return JSON.parse(JSON.stringify(state)) as SimulationState;
}

/** Total nitrogen held in the tank, mg. */
export function totalNitrogen(state: SimulationState): number {
  const w = state.water;
  const biomass = state.populations.reduce((sum, p) => sum + p.cod, 0);
  return (
    w.tan +
    w.no2 +
    w.no3 +
    w.food.n +
    w.detritus.n +
    w.inert.n +
    state.land.litter.n +
    state.land.soilTan +
    biomass * STOICHIOMETRY.nPerBiomassCod.value
  );
}

/** Total phosphorus held in the tank, mg. */
export function totalPhosphorus(state: SimulationState): number {
  const w = state.water;
  const biomass = state.populations.reduce((sum, p) => sum + p.cod, 0);
  return (
    w.po4 +
    w.food.p +
    w.detritus.p +
    w.inert.p +
    state.land.litter.p +
    state.land.soilPo4 +
    biomass * STOICHIOMETRY.pPerBiomassCod.value
  );
}
