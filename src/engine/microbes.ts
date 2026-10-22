import type { Archetype, BiomassData } from '../content/archetype';
import { getArchetype } from '../content/archetypes/index';
import { BACKGROUND_SEEDING, MICROBIAL_PROCESSES, TEMPERATURE_THETA } from '../content/microbes';
import type { Sourced } from '../content/sourced';
import { FOOD_COMPOSITION, STOICHIOMETRY } from '../content/stoichiometry';
import type { Phenotype } from '../generation/index';
import { landDensity, waterConcentration, type BioContext } from './bioContext';
import { bodyRatios, phenotypeOf } from './biota';
import { microbialCapacity } from './capacity';
import { crowdingFactor } from './crowding';
import { addTerm, type Pools, type Process } from './fluxes';
import {
  LAND_LITTER,
  POOL,
  WATER_DETRITUS,
  WATER_FOOD,
  populationKey,
  type OrganicKeys,
} from './pools';
import type { BiomassPopulation } from './types';

const CO2_PER_O2 = 44 / 32;
const DENITRIFICATION_COD_PER_N = 2.86;
const RQ = STOICHIOMETRY.respiratoryQuotient.value;

/** Archetypes driven by this module (docs/04 §5.2). */
export const MICROBIAL_ARCHETYPES: ReadonlySet<string> = new Set([
  'heterotroph',
  'biofilm',
  'aob',
  'nob',
  'denitrifier',
  'water_mold',
  'soil_bacteria',
  'saprotrophic_fungus',
]);

/** Heterotrophs that hydrolyse particulate organic matter (ASM1). */
const HYDROLYSERS: ReadonlySet<string> = new Set(['heterotroph', 'biofilm']);

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
export function phFactor(
  ph: number,
  min: number,
  optLow: number,
  optHigh: number,
  max: number,
): number {
  if (ph <= min || ph >= max) return 0;
  if (ph < optLow) return (ph - min) / (optLow - min);
  if (ph > optHigh) return (max - ph) / (max - optHigh);
  return 1;
}

const monod = (concentration: number, halfSat: number): number =>
  concentration > 0 ? concentration / (halfSat + concentration) : 0;

interface Microbe {
  readonly population: BiomassPopulation;
  readonly archetype: Archetype & BiomassData;
  readonly phenotype: Phenotype;
  readonly key: string;
}

function microbesOf(populations: readonly BiomassPopulation[]): Microbe[] {
  return populations
    .filter((population) => MICROBIAL_ARCHETYPES.has(population.archetypeId))
    .map((population) => {
      const archetype = getArchetype(population.archetypeId);
      if (archetype.kind !== 'biomass') throw new Error(`${archetype.id} is not biomass`);
      return {
        population,
        archetype,
        phenotype: phenotypeOf(population.speciesId),
        key: populationKey(population.id),
      };
    });
}

/** μmax × growth alleles × θ^(T−20), zero outside the species' temperature range; d⁻¹. */
function maxRate(microbe: Microbe, temperatureC: number): number {
  const range = microbe.phenotype.temperatureC;
  if (temperatureC < range.min || temperatureC > range.max) return 0;
  return (
    microbe.archetype.kinetics.muMax.value *
    microbe.phenotype.growthMultiplier *
    temperatureFactor(temperatureC)
  );
}

function halfSat(microbe: Microbe, value: Sourced | undefined): number {
  return (value?.value ?? 0) * microbe.phenotype.halfSaturationMultiplier;
}

function microbePh(microbe: Microbe, ph: number): number {
  const optimum = microbe.archetype.kinetics.phOptimum;
  const range = microbe.phenotype.ph;
  if (optimum === undefined) return tolerance(ph, range.min, range.opt, range.max);
  return phFactor(ph, range.min, optimum.min.value, optimum.max.value, range.max);
}

function yieldOf(microbe: Microbe): number {
  const value = microbe.archetype.kinetics.yieldCoefficient?.value;
  if (value === undefined) throw new Error(`${microbe.archetype.id} has no yield coefficient`);
  return value;
}

/** Dissolves an organic pool into dissolved COD, ammonium and phosphate. */
function dissolution(pools: Pools, keys: OrganicKeys, name: string, rate: number): Process | null {
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
  const cod = pools.get(WATER_FOOD.cod) ?? 0;
  const rate = Math.min(cod, FOOD_COMPOSITION.leachingPerDay.value * cod * dtDays);
  const process = dissolution(pools, WATER_FOOD, 'leaching:food', rate);
  return process === null ? [] : [process];
}

/** Aerobic heterotrophic growth on dissolved COD; N and P come from the water. */
function aerobicGrowth(microbe: Microbe, yieldCoefficient: number): Record<string, number> {
  const ratios = bodyRatios(microbe.archetype);
  const oxidised = (1 - yieldCoefficient) / yieldCoefficient;
  return {
    [POOL.substrate]: -1 / yieldCoefficient,
    [POOL.o2]: -oxidised,
    [POOL.tan]: -ratios.n,
    [POOL.po4]: -ratios.p,
    [POOL.co2]: oxidised * RQ * CO2_PER_O2,
    [microbe.key]: 1,
  };
}

/** Growth on particulate organic matter (water molds); surplus N and P are mineralised. */
function particulateGrowth(
  pools: Pools,
  microbe: Microbe,
  keys: OrganicKeys,
  yieldCoefficient: number,
): Record<string, number> {
  const cod = pools.get(keys.cod) ?? 0;
  const ratios = bodyRatios(microbe.archetype);
  const nRatio = cod > 0 ? (pools.get(keys.n) ?? 0) / cod : 0;
  const pRatio = cod > 0 ? (pools.get(keys.p) ?? 0) / cod : 0;
  const oxidised = (1 - yieldCoefficient) / yieldCoefficient;
  const terms: Record<string, number> = {};
  addTerm(terms, keys.cod, -1 / yieldCoefficient);
  addTerm(terms, keys.n, -nRatio / yieldCoefficient);
  addTerm(terms, keys.p, -pRatio / yieldCoefficient);
  addTerm(terms, POOL.tan, nRatio / yieldCoefficient - ratios.n);
  addTerm(terms, POOL.po4, pRatio / yieldCoefficient - ratios.p);
  addTerm(terms, POOL.o2, -oxidised);
  addTerm(terms, POOL.co2, oxidised * RQ * CO2_PER_O2);
  addTerm(terms, microbe.key, 1);
  return terms;
}

/** Aquatic microbial processes, docs/04 §5.2; rates are mg moved during dtDays. */
export function waterMicrobeProcesses(
  context: BioContext,
  populations: readonly BiomassPopulation[],
): Process[] {
  const { pools, dtDays } = context;
  const volumeL = context.space.waterVolumeL;
  if (volumeL <= 0) return [];
  const microbes = microbesOf(populations).filter((m) => m.archetype.zone !== 'T');
  const temperatureC = context.state.water.temperatureC;
  const theta = temperatureFactor(temperatureC);
  const o2 = waterConcentration(context, POOL.o2);
  const substrate = waterConcentration(context, POOL.substrate);
  const processes: Process[] = [];

  const hydrolyserCod = microbes
    .filter((m) => HYDROLYSERS.has(m.archetype.id))
    .reduce((sum, m) => sum + m.population.cod, 0);
  const hydrolysisRate = MICROBIAL_PROCESSES.hydrolysisRate.value;
  const hydrolysisHalfSat = MICROBIAL_PROCESSES.hydrolysisHalfSat.value;
  for (const pool of [WATER_FOOD, WATER_DETRITUS]) {
    const cod = pools.get(pool.cod) ?? 0;
    if (cod <= 0 || hydrolyserCod <= 0) continue;
    const ratio = cod / hydrolyserCod;
    const rate =
      hydrolysisRate * theta * (ratio / (hydrolysisHalfSat + ratio)) * hydrolyserCod * dtDays;
    const process = dissolution(pools, pool, `hydrolysis:${pool.cod}`, rate);
    if (process !== null) processes.push(process);
  }

  for (const microbe of microbes) {
    if (microbe.population.cod <= 0) continue;
    const kinetics = microbe.archetype.kinetics;
    const muMax = maxRate(microbe, temperatureC) * microbePh(microbe, context.ph);
    if (muMax <= 0) continue;
    const crowd = crowdingFactor(context.occupancy, microbe.archetype.id);
    const o2Limit = monod(o2, halfSat(microbe, kinetics.halfSat.o2));
    const yieldCoefficient = yieldOf(microbe);
    let growth = 0;
    let stoichiometry: Record<string, number> = {};

    switch (microbe.archetype.id) {
      case 'heterotroph':
      case 'biofilm':
        growth = muMax * monod(substrate, halfSat(microbe, kinetics.halfSat.substrate)) * o2Limit;
        stoichiometry = aerobicGrowth(microbe, yieldCoefficient);
        break;
      case 'aob': {
        const ratios = bodyRatios(microbe.archetype);
        growth =
          muMax *
          monod(
            waterConcentration(context, POOL.tan),
            halfSat(microbe, kinetics.halfSat.substrate),
          ) *
          o2Limit;
        const oxidisedN = 1 / yieldCoefficient;
        stoichiometry = {
          [POOL.tan]: -(oxidisedN + ratios.n),
          [POOL.o2]: -(STOICHIOMETRY.o2PerNByAob.value * oxidisedN - 1),
          [POOL.alkalinity]: -STOICHIOMETRY.alkalinityPerNNitrified.value * oxidisedN,
          [POOL.po4]: -ratios.p,
          [POOL.no2]: oxidisedN,
          [POOL.nitrified]: oxidisedN,
          [microbe.key]: 1,
        };
        break;
      }
      case 'nob': {
        const ratios = bodyRatios(microbe.archetype);
        growth =
          muMax *
          monod(
            waterConcentration(context, POOL.no2),
            halfSat(microbe, kinetics.halfSat.substrate),
          ) *
          o2Limit;
        const oxidisedN = 1 / yieldCoefficient;
        stoichiometry = {
          [POOL.no2]: -(oxidisedN + ratios.n),
          [POOL.o2]: -(STOICHIOMETRY.o2PerNByNob.value * oxidisedN - 1),
          [POOL.po4]: -ratios.p,
          [POOL.no3]: oxidisedN,
          [microbe.key]: 1,
        };
        break;
      }
      case 'denitrifier': {
        const ratios = bodyRatios(microbe.archetype);
        const anoxia =
          context.space.geometry.anoxicFraction *
          Math.max(0, 1 - o2 / Math.max(context.o2SaturationMgL, 1e-6));
        growth =
          muMax *
          monod(substrate, halfSat(microbe, kinetics.halfSat.substrate)) *
          monod(waterConcentration(context, POOL.no3), MICROBIAL_PROCESSES.nitrateHalfSat.value) *
          anoxia;
        const reducedN = (1 - yieldCoefficient) / (DENITRIFICATION_COD_PER_N * yieldCoefficient);
        stoichiometry = {
          [POOL.substrate]: -1 / yieldCoefficient,
          [POOL.no3]: -reducedN,
          [POOL.tan]: -ratios.n,
          [POOL.po4]: -ratios.p,
          [POOL.n2Out]: reducedN,
          [POOL.alkalinity]: STOICHIOMETRY.alkalinityPerNDenitrified.value * reducedN,
          [POOL.co2]: ((1 - yieldCoefficient) / yieldCoefficient) * RQ * CO2_PER_O2,
          [microbe.key]: 1,
        };
        break;
      }
      case 'water_mold': {
        const organic =
          waterConcentration(context, WATER_DETRITUS.cod) +
          waterConcentration(context, WATER_FOOD.cod);
        growth = muMax * monod(organic, halfSat(microbe, kinetics.halfSat.substrate)) * o2Limit;
        const detritus = pools.get(WATER_DETRITUS.cod) ?? 0;
        const food = pools.get(WATER_FOOD.cod) ?? 0;
        const total = detritus + food;
        if (total <= 0) growth = 0;
        for (const [keys, share] of [
          [WATER_DETRITUS, total > 0 ? detritus / total : 0],
          [WATER_FOOD, total > 0 ? food / total : 0],
        ] as const) {
          if (share <= 0 || growth <= 0) continue;
          processes.push({
            name: `growth:${microbe.population.id}:${keys.cod}`,
            rate: growth * crowd * share * microbe.population.cod * dtDays,
            stoichiometry: particulateGrowth(pools, microbe, keys, yieldCoefficient),
            speciesId: microbe.population.speciesId,
          });
        }
        growth = 0;
        break;
      }
    }
    if (growth > 0) {
      processes.push({
        name: `growth:${microbe.population.id}`,
        rate: growth * crowd * microbe.population.cod * dtDays,
        stoichiometry,
        speciesId: microbe.population.speciesId,
      });
    }
  }
  return processes;
}

/** Land decomposition, docs/04 §4.1 and §5.2. */
export function landMicrobeProcesses(
  context: BioContext,
  populations: readonly BiomassPopulation[],
): Process[] {
  const landAreaM2 = context.space.geometry.landAreaM2;
  if (landAreaM2 <= 0) return [];
  const { pools, dtDays } = context;
  const land = context.state.land;
  const theta = temperatureFactor(land.airTemperatureC);
  const soilMicrobes = microbesOf(populations).filter((m) => m.archetype.zone === 'T');
  const decomposerCod = soilMicrobes.reduce((sum, m) => sum + m.population.cod, 0);
  const processes: Process[] = [];
  const soilCapacity = microbialCapacity('soil', context.space);
  const reference = MICROBIAL_PROCESSES.soilActivityReference.value * soilCapacity;
  const activity = reference > 0 ? Math.min(1, decomposerCod / reference) : 0;
  const moisture = Math.min(1, land.soilMoisture / MICROBIAL_PROCESSES.litterMoistureOptimum.value);
  const litterCod = pools.get(LAND_LITTER.cod) ?? 0;
  if (litterCod > 0 && activity > 0) {
    const perDay = MICROBIAL_PROCESSES.litterDecayPerYear.value / 365;
    const nRatio = (pools.get(LAND_LITTER.n) ?? 0) / litterCod;
    const pRatio = (pools.get(LAND_LITTER.p) ?? 0) / litterCod;
    processes.push({
      name: 'litter_decay',
      rate: perDay * theta * moisture * activity * litterCod * dtDays,
      stoichiometry: {
        [LAND_LITTER.cod]: -1,
        [LAND_LITTER.n]: -nRatio,
        [LAND_LITTER.p]: -pRatio,
        [POOL.soilSubstrate]: 1,
        [POOL.soilTan]: nRatio,
        [POOL.soilPo4]: pRatio,
      },
    });
  }
  const substratePerArea = landDensity(context, POOL.soilSubstrate);
  for (const microbe of soilMicrobes) {
    if (microbe.population.cod <= 0) continue;
    const yieldCoefficient = yieldOf(microbe);
    const ratios = bodyRatios(microbe.archetype);
    const growth =
      maxRate(microbe, land.airTemperatureC) *
      moisture *
      monod(substratePerArea, MICROBIAL_PROCESSES.soilSubstrateHalfSatPerM2.value) *
      crowdingFactor(context.occupancy, microbe.archetype.id);
    if (growth <= 0) continue;
    processes.push({
      name: `growth:${microbe.population.id}`,
      rate: growth * microbe.population.cod * dtDays,
      stoichiometry: {
        [POOL.soilSubstrate]: -1 / yieldCoefficient,
        [POOL.soilTan]: -ratios.n,
        [POOL.soilPo4]: -ratios.p,
        [microbe.key]: 1,
      },
      speciesId: microbe.population.speciesId,
    });
  }
  return processes;
}

/** mg COD added per dtDays by background seeding (docs/04 §5.2). */
export function seedingCod(
  archetypeId: keyof typeof BACKGROUND_SEEDING,
  units: number,
  dtDays: number,
): number {
  return (
    BACKGROUND_SEEDING[archetypeId].value *
    units *
    STOICHIOMETRY.cellDryMassMg.value *
    STOICHIOMETRY.codPerDryBiomass.value *
    dtDays
  );
}
