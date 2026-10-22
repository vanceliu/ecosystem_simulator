import { MICROBE_IDS, type MicrobeId } from '../content/microbes';
import type { ParameterSet } from '../content/parameters';
import { STATE_SUBSTANCE_IDS } from '../content/substances';
import { oxygenSaturation, pressureAtm } from './atmosphere';
import { dailyClimate, hourlyAmbientTemperature } from './climate';
import { computeGeometry, microbialCapacities, type Geometry } from './geometry';
import { targetHumidity, targetSoilMoisture } from './land';
import { waterComposition } from './sourceWater';
import type { Vector } from '../content/archetype';
import { createBioContext } from './bioContext';
import { bodyRatios, populationCod } from './biota';
import { inoculate, ORIGIN, pickSuitableGenotype, setupRoutes, type Route } from './emergence';
import { foundBiomass, registerSpecies } from './founding';
import { emptySubstances, toPools } from './pools';
import { emptyRecords } from './records';
import { createRng, hashSeed, mix32 } from './rng';
import type { ClimateState, Population, Records, SimulationState, TankConfig } from './types';

const isLandMicrobe = (params: ParameterSet, id: MicrobeId): boolean =>
  params.archetypes[id].zone === 'T';
/** rng stream for setup draws, distinct from per-tick streams */
const SETUP_STREAM = 0x5e7019;
const ML_PER_L = 1000;
const MG_PER_G = 1000;
const CM2_PER_M2 = 1e4;
const LITRES_PER_M2_CM = 10;

/** Organic matter as COD with its nitrogen and phosphorus, mg. */
interface Organic {
  cod: number;
  n: number;
  p: number;
}

const emptyOrganic = (): Organic => ({ cod: 0, n: 0, p: 0 });

const cellsToCod = (params: ParameterSet, cells: number): number =>
  cells *
  params.stoichiometry.base.cellDryMassMg.value *
  params.stoichiometry.base.codPerDryBiomass.value;

export function ambientDayMean(
  params: ParameterSet,
  config: TankConfig,
  dayOfYear: number,
): number {
  return config.placement === 'outdoor'
    ? dailyClimate(params, config.location, dayOfYear).meanTemperatureC
    : config.roomTemperatureC;
}

export function initialClimateState(params: ParameterSet, config: TankConfig): ClimateState {
  const daily = dailyClimate(params, config.location, config.startDayOfYear);
  return {
    dayOfYear: config.startDayOfYear,
    ambientTemperatureC:
      config.placement === 'outdoor'
        ? hourlyAmbientTemperature(params, daily, 0)
        : config.roomTemperatureC,
    ambientDayMeanC: ambientDayMean(params, config, config.startDayOfYear),
    ambientHumidity: daily.humidity,
    dayLengthH: daily.dayLengthH,
    ppfd: 0,
    rainTodayMm: 0,
    evaporationTodayMm: 0,
    sunshine: daily.sunshine,
    wetSeason: daily.wetSeason,
  };
}

export function validateTankConfig(params: ParameterSet, config: TankConfig): string[] {
  const errors: string[] = [];
  const geometry = computeGeometry(params, config);
  const maxVolume = params.mechanics.limits.maxTotalVolumeL;
  if (geometry.totalVolumeL > maxVolume) errors.push(`total volume exceeds ${maxVolume} L`);
  if (config.landFraction < 0 || config.landFraction > 1) errors.push('landFraction out of range');
  if (config.waterDepthCm > config.heightCm) errors.push('water deeper than tank height');
  if (config.shading < 0 || config.shading > 0.9) errors.push('shading out of range');
  if (config.salinityPpt < 0 || config.salinityPpt > 45) errors.push('salinity out of range');
  return errors;
}

interface WaterInoculum {
  readonly microbes: Partial<Record<MicrobeId, number>>;
  readonly detritus: Organic;
}

/** Biofilm microbes and organic matter on wild rocks, wood and substrate; docs/04 §5.2. */
function wildWaterMaterials(
  params: ParameterSet,
  config: TankConfig,
  geometry: Geometry,
): WaterInoculum {
  const microbes: Partial<Record<MicrobeId, number>> = {};
  const detritus = emptyOrganic();
  if (geometry.nominalWaterVolumeL <= 0) return { microbes, detritus };
  const add = (id: MicrobeId, cod: number): void => {
    microbes[id] = (microbes[id] ?? 0) + cod;
  };
  const options = params.tankOptions;
  const wildMaterials = options.wildMaterials;
  const base = params.stoichiometry.base;
  const nitrifierShare = wildMaterials.nitrifierShare.value;
  const colonise = (
    surfaceM2: number,
    denitrifierShare: number,
    organicSurfaceM2: number,
  ): void => {
    const cells = wildMaterials.biofilmBacteriaPerCm2.value * CM2_PER_M2 * surfaceM2;
    add('aob', cellsToCod(params, cells * nitrifierShare));
    add('nob', cellsToCod(params, cells * nitrifierShare));
    add('denitrifier', cellsToCod(params, cells * denitrifierShare));
    add('heterotroph', cellsToCod(params, cells * (1 - 2 * nitrifierShare - denitrifierShare)));
    const organic = wildMaterials.biofilmOrganicPerM2.value * organicSurfaceM2;
    detritus.cod += organic;
    detritus.n += organic * base.nPerBiomassCod.value;
    detritus.p += organic * base.pPerBiomassCod.value;
  };
  for (const item of config.hardscape) {
    if (item.source.origin !== 'wild') continue;
    const surface = options.hardscapeSurface[item.type].value * geometry.waterFloorAreaM2;
    colonise(surface, 0, surface);
  }
  if (config.substrate !== 'bare' && config.substrateSource.origin === 'wild') {
    const organicDepth = Math.min(
      config.substrateDepthCm,
      wildMaterials.organicSubstrateDepthCm.value,
    );
    const organicSurface =
      options.substrates[config.substrate].surfacePerFloorPerCm.value *
      organicDepth *
      geometry.waterFloorAreaM2;
    colonise(geometry.substrateSurfaceM2, wildMaterials.denitrifierShare.value, organicSurface);
  }
  return { microbes, detritus };
}

function wildSoilMicrobes(
  params: ParameterSet,
  config: TankConfig,
  geometry: Geometry,
): Partial<Record<MicrobeId, number>> {
  if (config.landSubstrate === null || geometry.landAreaM2 <= 0) return {};
  const capacity = microbialCapacities(params, geometry, 0, config.landSubstrateDepthCm).soil;
  if (config.landSubstrateSource.origin === 'clean') {
    const landMicrobes = MICROBE_IDS.filter((id) => isLandMicrobe(params, id)).length;
    const each =
      (capacity * params.microbes.processes.initialSoilMicrobeFraction.value) / landMicrobes;
    return { soil_bacteria: each, saprotrophic_fungus: each };
  }
  const wildMaterials = params.tankOptions.wildMaterials;
  const cells =
    wildMaterials.soilBacteriaPerG.value *
    wildMaterials.soilBulkDensity.value *
    config.landSubstrateDepthCm *
    CM2_PER_M2 *
    geometry.landAreaM2;
  const bacteria = cellsToCod(params, cells);
  const fungus = bacteria * wildMaterials.fungusToBacteriaRatio.value;
  const scale = Math.min(
    1,
    (capacity * params.mechanics.microbes.maxInitialCapacityShare) / (bacteria + fungus),
  );
  return { soil_bacteria: bacteria * scale, saprotrophic_fungus: fungus * scale };
}

/** docs/04 §3.3 exchangeable N and P carried by the substrate, mg. */
function sedimentNutrients(
  params: ParameterSet,
  config: TankConfig,
  geometry: Geometry,
): { n: number; p: number } {
  if (config.substrate === 'bare' || geometry.nominalWaterVolumeL <= 0) return { n: 0, p: 0 };
  const spec = params.tankOptions.substrates[config.substrate];
  const wildNutrients = params.tankOptions.wildSedimentNutrients;
  const litres = geometry.waterFloorAreaM2 * config.substrateDepthCm * LITRES_PER_M2_CM;
  const kg = litres * spec.bulkDensity.value;
  const inert = spec.exchangeableN.value === 0 && spec.exchangeableP.value === 0;
  const wild = config.substrateSource.origin === 'wild' && inert;
  return {
    n: kg * (wild ? wildNutrients.exchangeableN.value : spec.exchangeableN.value),
    p: kg * (wild ? wildNutrients.exchangeableP.value : spec.exchangeableP.value),
  };
}

function initialLitter(params: ParameterSet, config: TankConfig, geometry: Geometry): Organic {
  if (config.landSubstrate === null) return emptyOrganic();
  const options = params.tankOptions;
  const dryG =
    config.landSubstrateSource.origin === 'wild'
      ? options.wildLitterStock[config.location.latitudeZone].value
      : options.landSubstrates[config.landSubstrate].initialLitterDryG.value;
  const dryMg = dryG * geometry.landAreaM2 * MG_PER_G;
  const litter = params.stoichiometry.litter;
  return {
    cod: dryMg * litter.codPerDryMass.value,
    n: dryMg * litter.nPerDryMass.value,
    p: dryMg * litter.pPerDryMass.value,
  };
}

function capWaterMicrobes(
  params: ParameterSet,
  microbes: Partial<Record<MicrobeId, number>>,
  geometry: Geometry,
  volume: number,
): Partial<Record<MicrobeId, number>> {
  const capacities = microbialCapacities(params, geometry, volume, 0);
  const limit = (ids: readonly MicrobeId[], capacity: number): void => {
    const total = ids.reduce((sum, id) => sum + (microbes[id] ?? 0), 0);
    const allowed = capacity * params.mechanics.microbes.maxInitialCapacityShare;
    if (total <= allowed || total <= 0) return;
    for (const id of ids) microbes[id] = ((microbes[id] ?? 0) * allowed) / total;
  };
  limit(['heterotroph'], capacities.free);
  limit(['aob', 'nob'], capacities.attached);
  limit(['denitrifier'], capacities.substrate);
  return microbes;
}

/** docs/04 §3; all water and land pools are total masses in mg. */
export function createInitialState(
  params: ParameterSet,
  config: TankConfig,
  worldSeed: string,
): SimulationState {
  const errors = validateTankConfig(params, config);
  if (errors.length > 0) throw new Error(`Invalid tank config: ${errors.join('; ')}`);
  const geometry = computeGeometry(params, config);
  const volume = geometry.nominalWaterVolumeL;
  const water = waterComposition(params, config);
  const climate = initialClimateState(params, config);
  const waterTemperature =
    config.heaterSetpointC !== null && config.heaterSetpointC > climate.ambientDayMeanC
      ? config.heaterSetpointC
      : Math.max(0, climate.ambientDayMeanC);
  const atm = pressureAtm(config.location.altitudeM);
  const wild = wildWaterMaterials(params, config, geometry);
  const sediment = sedimentNutrients(params, config, geometry);
  const litter = initialLitter(params, config, geometry);

  const waterMicrobes: Partial<Record<MicrobeId, number>> = {};
  for (const id of MICROBE_IDS) {
    if (isLandMicrobe(params, id) || volume <= 0) continue;
    waterMicrobes[id] =
      cellsToCod(params, (water.inoculum[id] ?? 0) * ML_PER_L * volume) + (wild.microbes[id] ?? 0);
  }
  const startingCod = {
    ...capWaterMicrobes(params, waterMicrobes, geometry, volume),
    ...wildSoilMicrobes(params, config, geometry),
  };

  const substances = emptySubstances();
  for (const id of STATE_SUBSTANCE_IDS) substances[id] = (water.perLitre[id] ?? 0) * volume;
  substances.water_o2 = oxygenSaturation(waterTemperature, water.salinityPpt, atm) * volume;
  substances.water_co2 = params.physics.co2EquilibriumMgL.value * volume;
  substances.detritus_cod = wild.detritus.cod;
  substances.detritus_n = wild.detritus.n;
  substances.detritus_p = wild.detritus.p;
  substances.sediment_tan = sediment.n;
  substances.sediment_po4 = sediment.p;
  substances.litter_cod = litter.cod;
  substances.litter_n = litter.n;
  substances.litter_p = litter.p;

  const state: SimulationState = {
    schema: 2,
    worldSeed,
    seedHash: hashSeed(worldSeed),
    tick: 0,
    config,
    water: {
      volumeL: volume,
      temperatureC: waterTemperature,
      iceCover: false,
      snowOnIce: false,
    },
    land: {
      airTemperatureC: climate.ambientTemperatureC,
      humidity: 0,
      soilMoisture: 0,
    },
    substances,
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
  const context = createBioContext(params, state, toPools(params, state), geometry, 0);
  const routes = setupRoutes(config);
  for (const archetypeId of MICROBE_IDS) {
    const cod = startingCod[archetypeId] ?? 0;
    if (!(cod > 0)) continue;
    const archetype = params.archetypes[archetypeId];
    const vector = microbeVector(archetype.zone === 'T', routes);
    const strains: string[] = [];
    for (let draw = 0; draw < params.mechanics.emergence.initialMicrobeStrains; draw += 1) {
      const speciesId = pickSuitableGenotype(context, archetype, rng);
      if (speciesId !== null) strains.push(speciesId);
    }
    for (const speciesId of strains) {
      registerSpecies(state, { id: speciesId, origin: ORIGIN[vector], introduced: false });
      foundBiomass(state, speciesId, vector, cod / strains.length);
    }
  }
  inoculate(createBioContext(params, state, toPools(params, state), geometry, 0), rng);
  state.ledger = { nIn: 0, nOut: 0, pIn: 0, pOut: 0 };
  for (const population of state.populations)
    population.dayStartCod = populationCod(params, population);
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
  return {
    ...state,
    water: { ...state.water },
    land: { ...state.land },
    substances: { ...state.substances },
    climate: { ...state.climate },
    species: { ...state.species },
    populations: copyPopulations(state.populations),
    records: copyRecords(state.records),
    ledger: { ...state.ledger },
    tracking: { ...state.tracking },
  };
}

/** Living N or P held by all populations, mg. */
function livingElement(params: ParameterSet, state: SimulationState, element: 'n' | 'p'): number {
  return state.populations.reduce(
    (sum, population) =>
      sum +
      populationCod(params, population) *
        bodyRatios(params, params.archetypes[population.archetypeId])[element],
    0,
  );
}

/** Mass of an element held in substance pools, mg. */
function substanceElement(
  params: ParameterSet,
  state: SimulationState,
  element: 'N' | 'P',
): number {
  let total = 0;
  for (const id of STATE_SUBSTANCE_IDS)
    if (params.substances[id].element === element) total += state.substances[id];
  return total;
}

/** Total nitrogen held in the tank, mg. */
export function totalNitrogen(params: ParameterSet, state: SimulationState): number {
  return substanceElement(params, state, 'N') + livingElement(params, state, 'n');
}

/** Total phosphorus held in the tank, mg. */
export function totalPhosphorus(params: ParameterSet, state: SimulationState): number {
  return substanceElement(params, state, 'P') + livingElement(params, state, 'p');
}
