import {
  BACKGROUND_SEEDING,
  MICROBES,
  MICROBIAL_PROCESSES,
  TEMPERATURE_THETA,
  type MicrobeId,
  type PhTolerance,
} from '../content/microbes';
import { FOOD_COMPOSITION, STOICHIOMETRY } from '../content/stoichiometry';
import type { Pools, Process } from './fluxes';

export const POOL = {
  o2: 'w.o2',
  co2: 'w.co2',
  tan: 'w.tan',
  no2: 'w.no2',
  no3: 'w.no3',
  po4: 'w.po4',
  alkalinity: 'w.alk',
  substrate: 'w.S',
  n2Out: 'sink.n2',
  soilTan: 'l.tan',
  soilPo4: 'l.po4',
  soilSubstrate: 'l.S',
  /** counter of ammonia nitrogen oxidised by AOB; not a mass pool */
  nitrified: 'meter.nitrified',
} as const;

export const organicKeys = (prefix: string) =>
  ({ cod: `${prefix}.cod`, n: `${prefix}.n`, p: `${prefix}.p` }) as const;

export const WATER_FOOD = organicKeys('w.food');
export const WATER_DETRITUS = organicKeys('w.det');
export const WATER_INERT = organicKeys('w.inert');
export const LAND_LITTER = organicKeys('l.litter');

export const populationKey = (id: string): string => `pop:${id}`;

const CO2_PER_O2 = 44 / 32;
const DENITRIFICATION_COD_PER_N = 2.86;

const N_BIOMASS = STOICHIOMETRY.nPerBiomassCod.value;
const P_BIOMASS = STOICHIOMETRY.pPerBiomassCod.value;
const N_INERT = STOICHIOMETRY.nPerInertCod.value;
const INERT_FRACTION = STOICHIOMETRY.inertFractionOfDecay.value;
const RQ = STOICHIOMETRY.respiratoryQuotient.value;

export function temperatureFactor(temperatureC: number): number {
  return Math.pow(TEMPERATURE_THETA.value, temperatureC - 20);
}

/** docs/04 §5.1 tolerance curve. */
export function tolerance(value: number, min: number, opt: number, max: number): number {
  if (value < min || value > max) return 0;
  const width = (max - min) / 4;
  return Math.exp(-(((value - opt) / width) ** 2));
}

/** Trapezoidal pH response for microbes; docs/04 §5.2. */
export function phFactor(ph: number, range: PhTolerance): number {
  const min = range.min.value;
  const optLow = range.optLow.value;
  const optHigh = range.optHigh.value;
  const max = range.max.value;
  if (ph <= min || ph >= max) return 0;
  if (ph < optLow) return (ph - min) / (optLow - min);
  if (ph > optHigh) return (max - ph) / (max - optHigh);
  return 1;
}

const monod = (concentration: number, halfSat: number): number =>
  concentration > 0 ? concentration / (halfSat + concentration) : 0;

export interface MicrobeHandle {
  readonly id: string;
  readonly archetypeId: MicrobeId;
  readonly cod: number;
}

export interface WaterMicrobeContext {
  readonly volumeL: number;
  readonly temperatureC: number;
  readonly ph: number;
  readonly o2SaturationMgL: number;
  readonly anoxicFraction: number;
  readonly capacity: {
    readonly attached: number;
    readonly substrate: number;
    readonly free: number;
  };
  readonly dtDays: number;
}

/** ASM1 death-regeneration: decayed biomass splits into hydrolysable detritus and inert matter. */
function waterDecayProcess(handle: MicrobeHandle, rate: number): Process {
  return {
    name: `decay:${handle.id}`,
    rate,
    stoichiometry: {
      [populationKey(handle.id)]: -1,
      [WATER_DETRITUS.cod]: 1 - INERT_FRACTION,
      [WATER_DETRITUS.n]: N_BIOMASS - N_INERT * INERT_FRACTION,
      [WATER_DETRITUS.p]: P_BIOMASS,
      [WATER_INERT.cod]: INERT_FRACTION,
      [WATER_INERT.n]: N_INERT * INERT_FRACTION,
    },
  };
}

/** Dissolves an organic pool into dissolved COD, ammonium and phosphate. */
function dissolution(
  pools: Pools,
  keys: typeof WATER_FOOD,
  name: string,
  rate: number,
): Process | null {
  const cod = pools.get(keys.cod) ?? 0;
  if (cod <= 0 || rate <= 0) return null;
  const nRatio = (pools.get(keys.n) ?? 0) / cod;
  const pRatio = (pools.get(keys.p) ?? 0) / cod;
  return {
    name,
    rate,
    stoichiometry: {
      [keys.cod]: -1,
      [keys.n]: -nRatio,
      [keys.p]: -pRatio,
      [POOL.substrate]: 1,
      [POOL.tan]: nRatio,
      [POOL.po4]: pRatio,
    },
  };
}

/** Abiotic food leaching; docs/04 §5.2. */
export function leachingProcesses(pools: Pools, volumeL: number, dtDays: number): Process[] {
  if (volumeL <= 0) return [];
  const rate = FOOD_COMPOSITION.leachingPerDay.value * (pools.get(WATER_FOOD.cod) ?? 0) * dtDays;
  const process = dissolution(
    pools,
    WATER_FOOD,
    'leaching:food',
    Math.min(rate, pools.get(WATER_FOOD.cod) ?? 0),
  );
  return process === null ? [] : [process];
}

function crowding(occupied: number, capacity: number): number {
  return capacity > 0 ? Math.max(0, 1 - occupied / capacity) : 0;
}

/** Aquatic microbial processes, docs/04 §5.2; rates are mg moved during dtDays. */
export function waterMicrobeProcesses(
  pools: Pools,
  microbes: readonly MicrobeHandle[],
  context: WaterMicrobeContext,
): Process[] {
  const { volumeL, dtDays } = context;
  if (volumeL <= 0) return [];
  const conc = (key: string): number => Math.max(0, pools.get(key) ?? 0) / volumeL;
  const theta = temperatureFactor(context.temperatureC);
  const o2 = conc(POOL.o2);
  const substrate = conc(POOL.substrate);
  const processes: Process[] = [];

  const sumBy = (habitat: string): number =>
    microbes
      .filter((m) => MICROBES[m.archetypeId].habitat === habitat)
      .reduce((sum, m) => sum + m.cod, 0);
  const crowd = {
    attached: crowding(sumBy('attached'), context.capacity.attached),
    substrate: crowding(sumBy('substrate'), context.capacity.substrate),
    free: crowding(sumBy('free'), context.capacity.free),
  };

  const heterotrophCod = microbes
    .filter((m) => m.archetypeId === 'heterotroph')
    .reduce((sum, m) => sum + m.cod, 0);
  const hydrolysisRate = MICROBIAL_PROCESSES.hydrolysisRate.value;
  const hydrolysisHalfSat = MICROBIAL_PROCESSES.hydrolysisHalfSat.value;
  for (const pool of [WATER_FOOD, WATER_DETRITUS]) {
    const cod = pools.get(pool.cod) ?? 0;
    if (cod <= 0 || heterotrophCod <= 0) continue;
    const ratio = cod / heterotrophCod;
    const rate =
      hydrolysisRate * theta * (ratio / (hydrolysisHalfSat + ratio)) * heterotrophCod * dtDays;
    const process = dissolution(pools, pool, `hydrolysis:${pool.cod}`, rate);
    if (process !== null) processes.push(process);
  }

  for (const microbe of microbes) {
    const kinetics = MICROBES[microbe.archetypeId];
    if (kinetics.zone !== 'water' || microbe.cod <= 0) continue;
    const key = populationKey(microbe.id);
    const muMax = kinetics.muMax.value * theta * phFactor(context.ph, kinetics.ph);
    const yieldCoefficient = kinetics.yieldCoefficient.value;
    const o2Limit = monod(o2, kinetics.halfSatO2.value);
    let growth = 0;
    let stoichiometry: Record<string, number> = {};

    switch (microbe.archetypeId) {
      case 'heterotroph': {
        growth = muMax * monod(substrate, kinetics.halfSatSubstrate.value) * o2Limit * crowd.free;
        const oxidised = (1 - yieldCoefficient) / yieldCoefficient;
        stoichiometry = {
          [POOL.substrate]: -1 / yieldCoefficient,
          [POOL.o2]: -oxidised,
          [POOL.tan]: -N_BIOMASS,
          [POOL.po4]: -P_BIOMASS,
          [POOL.co2]: oxidised * RQ * CO2_PER_O2,
          [key]: 1,
        };
        break;
      }
      case 'aob': {
        growth =
          muMax * monod(conc(POOL.tan), kinetics.halfSatSubstrate.value) * o2Limit * crowd.attached;
        const oxidisedN = 1 / yieldCoefficient;
        stoichiometry = {
          [POOL.tan]: -(oxidisedN + N_BIOMASS),
          [POOL.o2]: -(STOICHIOMETRY.o2PerNByAob.value * oxidisedN - 1),
          [POOL.alkalinity]: -STOICHIOMETRY.alkalinityPerNNitrified.value * oxidisedN,
          [POOL.po4]: -P_BIOMASS,
          [POOL.no2]: oxidisedN,
          [POOL.nitrified]: oxidisedN,
          [key]: 1,
        };
        break;
      }
      case 'nob': {
        growth =
          muMax * monod(conc(POOL.no2), kinetics.halfSatSubstrate.value) * o2Limit * crowd.attached;
        const oxidisedN = 1 / yieldCoefficient;
        stoichiometry = {
          [POOL.no2]: -(oxidisedN + N_BIOMASS),
          [POOL.o2]: -(STOICHIOMETRY.o2PerNByNob.value * oxidisedN - 1),
          [POOL.po4]: -P_BIOMASS,
          [POOL.no3]: oxidisedN,
          [key]: 1,
        };
        break;
      }
      case 'denitrifier': {
        const anoxia =
          context.anoxicFraction * Math.max(0, 1 - o2 / Math.max(context.o2SaturationMgL, 1e-6));
        growth =
          muMax *
          monod(substrate, kinetics.halfSatSubstrate.value) *
          monod(conc(POOL.no3), MICROBIAL_PROCESSES.nitrateHalfSat.value) *
          anoxia *
          crowd.substrate;
        const reducedN = (1 - yieldCoefficient) / (DENITRIFICATION_COD_PER_N * yieldCoefficient);
        stoichiometry = {
          [POOL.substrate]: -1 / yieldCoefficient,
          [POOL.no3]: -reducedN,
          [POOL.tan]: -N_BIOMASS,
          [POOL.po4]: -P_BIOMASS,
          [POOL.n2Out]: reducedN,
          [POOL.alkalinity]: STOICHIOMETRY.alkalinityPerNDenitrified.value * reducedN,
          [POOL.co2]: ((1 - yieldCoefficient) / yieldCoefficient) * RQ * CO2_PER_O2,
          [key]: 1,
        };
        break;
      }
      case 'soil_bacteria':
      case 'saprotrophic_fungus':
        break;
    }
    if (growth > 0) {
      processes.push({
        name: `growth:${microbe.id}`,
        rate: growth * microbe.cod * dtDays,
        stoichiometry,
      });
    }
    processes.push(waterDecayProcess(microbe, kinetics.decay.value * theta * microbe.cod * dtDays));
  }
  return processes;
}

export interface LandMicrobeContext {
  readonly landAreaM2: number;
  readonly temperatureC: number;
  readonly soilMoisture: number;
  readonly soilCapacity: number;
  readonly dtDays: number;
}

/** Land decomposition, docs/04 §4.1 and §5.2. */
export function landMicrobeProcesses(
  pools: Pools,
  microbes: readonly MicrobeHandle[],
  context: LandMicrobeContext,
): Process[] {
  if (context.landAreaM2 <= 0) return [];
  const theta = temperatureFactor(context.temperatureC);
  const soilMicrobes = microbes.filter((m) => MICROBES[m.archetypeId].zone === 'land');
  const decomposerCod = soilMicrobes.reduce((sum, m) => sum + m.cod, 0);
  const processes: Process[] = [];
  const reference = MICROBIAL_PROCESSES.soilActivityReference.value * context.soilCapacity;
  const activity = reference > 0 ? Math.min(1, decomposerCod / reference) : 0;
  const moisture = Math.min(
    1,
    context.soilMoisture / MICROBIAL_PROCESSES.litterMoistureOptimum.value,
  );
  const litterCod = pools.get(LAND_LITTER.cod) ?? 0;
  if (litterCod > 0 && activity > 0) {
    const perDay = MICROBIAL_PROCESSES.litterDecayPerYear.value / 365;
    processes.push({
      name: 'litter_decay',
      rate: perDay * theta * moisture * activity * litterCod * context.dtDays,
      stoichiometry: {
        [LAND_LITTER.cod]: -1,
        [LAND_LITTER.n]: -(pools.get(LAND_LITTER.n) ?? 0) / litterCod,
        [LAND_LITTER.p]: -(pools.get(LAND_LITTER.p) ?? 0) / litterCod,
        [POOL.soilSubstrate]: 1,
        [POOL.soilTan]: (pools.get(LAND_LITTER.n) ?? 0) / litterCod,
        [POOL.soilPo4]: (pools.get(LAND_LITTER.p) ?? 0) / litterCod,
      },
    });
  }
  const substratePerArea = (pools.get(POOL.soilSubstrate) ?? 0) / context.landAreaM2;
  const crowd = crowding(decomposerCod, context.soilCapacity);
  for (const microbe of soilMicrobes) {
    if (microbe.cod <= 0) continue;
    const kinetics = MICROBES[microbe.archetypeId];
    const yieldCoefficient = kinetics.yieldCoefficient.value;
    const growth =
      kinetics.muMax.value *
      theta *
      moisture *
      monod(substratePerArea, MICROBIAL_PROCESSES.soilSubstrateHalfSatPerM2.value) *
      crowd;
    if (growth > 0) {
      processes.push({
        name: `growth:${microbe.id}`,
        rate: growth * microbe.cod * context.dtDays,
        stoichiometry: {
          [POOL.soilSubstrate]: -1 / yieldCoefficient,
          [POOL.soilTan]: -N_BIOMASS,
          [POOL.soilPo4]: -P_BIOMASS,
          [populationKey(microbe.id)]: 1,
        },
      });
    }
    processes.push({
      name: `decay:${microbe.id}`,
      rate: kinetics.decay.value * theta * microbe.cod * context.dtDays,
      stoichiometry: {
        [populationKey(microbe.id)]: -1,
        [POOL.soilSubstrate]: 1,
        [POOL.soilTan]: N_BIOMASS,
        [POOL.soilPo4]: P_BIOMASS,
      },
    });
  }
  return processes;
}

/** mg COD added per dtDays by background seeding. */
export function seedingCod(archetypeId: MicrobeId, units: number, dtDays: number): number {
  return (
    BACKGROUND_SEEDING[archetypeId].value *
    units *
    STOICHIOMETRY.cellDryMassMg.value *
    STOICHIOMETRY.codPerDryBiomass.value *
    dtDays
  );
}
