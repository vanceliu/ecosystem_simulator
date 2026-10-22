import type { Archetype, BiomassData, SpecialisedEffects } from '../content/archetype';
import type { MicrobeId } from '../content/microbes';
import type { ParameterSet } from '../content/parameters';
import type { Sourced } from '../content/sourced';
import { DETRITUS, FOOD, INERT, LITTER, type OrganicIds } from '../content/substances';
import type { Phenotype } from '../generation/index';
import { landDensity, waterConcentration, type BioContext } from './bioContext';
import { bodyRatios, effect, phenotypeOf, specialisedOf } from './biota';
import { MICROBIAL_CAPACITY_GROUP, microbialCapacity } from './capacity';
import { crowdingFactor } from './crowding';
import { addTerm, type PoolKey, type Pools, type Process, type Stoichiometry } from './fluxes';
import { populationKey } from './pools';
import type { BiomassPopulation } from './types';

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

export function temperatureFactor(params: ParameterSet, temperatureC: number): number {
  return Math.pow(params.microbes.temperatureTheta.value, temperatureC - 20);
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
  readonly effects: SpecialisedEffects;
  readonly key: PoolKey;
  /** mg N and P per mg COD of the microbe's biomass */
  readonly ratios: { readonly n: number; readonly p: number };
}

function microbesOf(params: ParameterSet, populations: readonly BiomassPopulation[]): Microbe[] {
  return populations
    .filter((population) => MICROBIAL_ARCHETYPES.has(population.archetypeId))
    .map((population) => {
      const archetype = params.archetypes[population.archetypeId];
      if (archetype.kind !== 'biomass') throw new Error(`${archetype.id} is not biomass`);
      const phenotype = phenotypeOf(params, population.speciesId);
      return {
        population,
        archetype,
        phenotype,
        effects: specialisedOf(archetype, phenotype),
        key: populationKey(population.id),
        ratios: bodyRatios(params, archetype),
      };
    });
}

/** μmax × growth alleles × θ^(T−20), zero outside the species' temperature range; d⁻¹. */
function maxRate(params: ParameterSet, microbe: Microbe, temperatureC: number): number {
  const range = microbe.phenotype.temperatureC;
  if (temperatureC < range.min || temperatureC > range.max) return 0;
  return (
    microbe.archetype.kinetics.muMax.value *
    microbe.phenotype.growthMultiplier *
    effect(microbe.effects.growth) *
    temperatureFactor(params, temperatureC)
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
function dissolution(pools: Pools, keys: OrganicIds, name: string, rate: number): Process | null {
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
      water_substrate: 1,
      water_tan: nRatio,
      water_po4: pRatio,
    },
  };
}

/** Abiotic food leaching; docs/04 §5.2. */
export function leachingProcesses(
  params: ParameterSet,
  pools: Pools,
  volumeL: number,
  dtDays: number,
): Process[] {
  if (volumeL <= 0) return [];
  const cod = pools.get(FOOD.cod) ?? 0;
  const rate = Math.min(cod, params.stoichiometry.food.leachingPerDay.value * cod * dtDays);
  const process = dissolution(pools, FOOD, 'leaching:food', rate);
  return process === null ? [] : [process];
}

/** Aerobic heterotrophic growth on dissolved COD; N and P come from the water. */
function aerobicGrowth(
  params: ParameterSet,
  microbe: Microbe,
  yieldCoefficient: number,
): Stoichiometry {
  const ratios = microbe.ratios;
  const rq = params.stoichiometry.base.respiratoryQuotient.value;
  const co2PerO2 = params.physics.co2PerO2.value;
  const oxidised = (1 - yieldCoefficient) / yieldCoefficient;
  return {
    water_substrate: -1 / yieldCoefficient,
    water_o2: -oxidised,
    water_tan: -ratios.n,
    water_po4: -ratios.p,
    water_co2: oxidised * rq * co2PerO2,
    [microbe.key]: 1,
  };
}

/** Growth on particulate organic matter (water molds); surplus N and P are mineralised. */
function particulateGrowth(
  params: ParameterSet,
  pools: Pools,
  microbe: Microbe,
  keys: OrganicIds,
  yieldCoefficient: number,
): Stoichiometry {
  const cod = pools.get(keys.cod) ?? 0;
  const ratios = microbe.ratios;
  const nRatio = cod > 0 ? (pools.get(keys.n) ?? 0) / cod : 0;
  const pRatio = cod > 0 ? (pools.get(keys.p) ?? 0) / cod : 0;
  const oxidised = (1 - yieldCoefficient) / yieldCoefficient;
  const terms: Stoichiometry = {};
  addTerm(terms, keys.cod, -1 / yieldCoefficient);
  addTerm(terms, keys.n, -nRatio / yieldCoefficient);
  addTerm(terms, keys.p, -pRatio / yieldCoefficient);
  addTerm(terms, 'water_tan', nRatio / yieldCoefficient - ratios.n);
  addTerm(terms, 'water_po4', pRatio / yieldCoefficient - ratios.p);
  addTerm(terms, 'water_o2', -oxidised);
  addTerm(
    terms,
    'water_co2',
    oxidised * params.stoichiometry.base.respiratoryQuotient.value * params.physics.co2PerO2.value,
  );
  addTerm(terms, microbe.key, 1);
  return terms;
}

function specialistActivity(context: BioContext, microbe: Microbe): number {
  const group = MICROBIAL_CAPACITY_GROUP[microbe.archetype.id];
  const capacity =
    group === undefined ? 0 : microbialCapacity(context.params, group, context.space);
  return capacity > 0
    ? Math.min(
        1,
        microbe.population.cod /
          (context.params.mechanics.microbes.specialistActivityReference * capacity),
      )
    : 0;
}

/** docs/05 §2.3 oligotrophs: refractory (inert) COD made available as dissolved substrate. */
function refractoryRelease(context: BioContext, microbe: Microbe, theta: number): Process[] {
  const pools = context.pools;
  const inert = pools.get(INERT.cod) ?? 0;
  const perDay = microbe.effects.refractoryUse?.value ?? 0;
  if (inert <= 0 || perDay <= 0) return [];
  const rate = perDay * theta * specialistActivity(context, microbe) * inert * context.dtDays;
  if (!(rate > 0)) return [];
  const nRatio = (pools.get(INERT.n) ?? 0) / inert;
  const pRatio = (pools.get(INERT.p) ?? 0) / inert;
  return [
    {
      name: `refractory:${microbe.population.id}`,
      rate,
      stoichiometry: {
        [INERT.cod]: -1,
        [INERT.n]: -nRatio,
        [INERT.p]: -pRatio,
        water_substrate: 1,
        water_tan: nRatio,
        water_po4: pRatio,
      },
      speciesId: microbe.population.speciesId,
    },
  ];
}

/** Aquatic microbial processes, docs/04 §5.2; rates are mg moved during dtDays. */
export function waterMicrobeProcesses(
  context: BioContext,
  populations: readonly BiomassPopulation[],
): Process[] {
  const { params, pools, dtDays } = context;
  const volumeL = context.space.waterVolumeL;
  if (volumeL <= 0) return [];
  const base = params.stoichiometry.base;
  const rq = base.respiratoryQuotient.value;
  const microbes = microbesOf(params, populations).filter((m) => m.archetype.zone !== 'T');
  const temperatureC = context.state.water.temperatureC;
  const theta = temperatureFactor(params, temperatureC);
  const o2 = waterConcentration(context, 'water_o2');
  const substrate = waterConcentration(context, 'water_substrate');
  const processes: Process[] = [];

  const hydrolyserCod = microbes
    .filter((m) => HYDROLYSERS.has(m.archetype.id))
    .reduce((sum, m) => sum + m.population.cod, 0);
  const hydrolysisRate = params.microbes.processes.hydrolysisRate.value;
  const hydrolysisHalfSat = params.microbes.processes.hydrolysisHalfSat.value;
  for (const pool of [DETRITUS]) {
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
    const muMax = maxRate(params, microbe, temperatureC) * microbePh(microbe, context.ph);
    if (muMax <= 0) continue;
    const crowd = crowdingFactor(context.occupancy, microbe.archetype.id);
    const o2Limit = monod(
      o2,
      halfSat(microbe, kinetics.halfSat.o2) * effect(microbe.effects.o2HalfSat),
    );
    const substrateHalfSat =
      halfSat(microbe, kinetics.halfSat.substrate) * effect(microbe.effects.substrateHalfSat);
    const yieldCoefficient = yieldOf(microbe);
    let growth = 0;
    let stoichiometry: Stoichiometry = {};

    switch (microbe.archetype.id) {
      case 'heterotroph':
      case 'biofilm':
        growth = muMax * monod(substrate, substrateHalfSat) * o2Limit;
        stoichiometry = aerobicGrowth(params, microbe, yieldCoefficient);
        if (microbe.effects.refractoryUse !== undefined)
          processes.push(...refractoryRelease(context, microbe, theta));
        break;
      case 'aob': {
        const ratios = microbe.ratios;
        growth =
          muMax * monod(waterConcentration(context, 'water_tan'), substrateHalfSat) * o2Limit;
        const oxidisedN = 1 / yieldCoefficient;
        stoichiometry = {
          water_tan: -(oxidisedN + ratios.n),
          water_o2: -(base.o2PerNByAob.value * oxidisedN - 1),
          water_po4: -ratios.p,
          water_no2: oxidisedN,
          meter_nitrified: oxidisedN,
          [microbe.key]: 1,
        };
        break;
      }
      case 'nob': {
        const ratios = microbe.ratios;
        growth =
          muMax * monod(waterConcentration(context, 'water_no2'), substrateHalfSat) * o2Limit;
        const oxidisedN = 1 / yieldCoefficient;
        stoichiometry = {
          water_no2: -(oxidisedN + ratios.n),
          water_o2: -(base.o2PerNByNob.value * oxidisedN - 1),
          water_po4: -ratios.p,
          water_no3: oxidisedN,
          [microbe.key]: 1,
        };
        const comammox = microbe.effects.comammoxHalfSat?.value;
        if (comammox !== undefined) {
          const complete =
            muMax *
            effect(microbe.effects.comammoxRate) *
            monod(waterConcentration(context, 'water_tan'), comammox) *
            o2Limit *
            crowd;
          if (complete > 0)
            processes.push({
              name: `comammox:${microbe.population.id}`,
              rate: complete * microbe.population.cod * dtDays,
              stoichiometry: {
                water_tan: -(oxidisedN + ratios.n),
                water_o2: -((base.o2PerNByAob.value + base.o2PerNByNob.value) * oxidisedN - 1),
                water_po4: -ratios.p,
                water_no3: oxidisedN,
                meter_nitrified: oxidisedN,
                [microbe.key]: 1,
              },
              speciesId: microbe.population.speciesId,
            });
        }
        break;
      }
      case 'denitrifier': {
        const ratios = microbe.ratios;
        const anoxia = Math.max(
          context.space.geometry.anoxicFraction *
            Math.max(0, 1 - o2 / Math.max(context.o2SaturationMgL, 1e-6)),
          microbe.effects.aerobicDenitrification?.value ?? 0,
        );
        growth =
          muMax *
          monod(substrate, substrateHalfSat) *
          monod(
            waterConcentration(context, 'water_no3'),
            params.microbes.processes.nitrateHalfSat.value,
          ) *
          anoxia;
        const reducedN =
          (1 - yieldCoefficient) / (params.physics.denitrificationCodPerN.value * yieldCoefficient);
        stoichiometry = {
          water_substrate: -1 / yieldCoefficient,
          water_no3: -reducedN,
          water_tan: -ratios.n,
          water_po4: -ratios.p,
          out_n2: reducedN,
          water_co2:
            ((1 - yieldCoefficient) / yieldCoefficient) * rq * params.physics.co2PerO2.value,
          [microbe.key]: 1,
        };
        break;
      }
      case 'water_mold': {
        const organic =
          waterConcentration(context, DETRITUS.cod) + waterConcentration(context, FOOD.cod);
        growth = muMax * monod(organic, substrateHalfSat) * o2Limit;
        const detritus = pools.get(DETRITUS.cod) ?? 0;
        const food = pools.get(FOOD.cod) ?? 0;
        const total = detritus + food;
        if (total <= 0) growth = 0;
        for (const [keys, share] of [
          [DETRITUS, total > 0 ? detritus / total : 0],
          [FOOD, total > 0 ? food / total : 0],
        ] as const) {
          if (share <= 0 || growth <= 0) continue;
          processes.push({
            name: `growth:${microbe.population.id}:${keys.cod}`,
            rate: growth * crowd * share * microbe.population.cod * dtDays,
            stoichiometry: particulateGrowth(params, pools, microbe, keys, yieldCoefficient),
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
  const { params, pools, dtDays } = context;
  const processSpecs = params.microbes.processes;
  const land = context.state.land;
  const theta = temperatureFactor(params, land.airTemperatureC);
  const soilMicrobes = microbesOf(params, populations).filter((m) => m.archetype.zone === 'T');
  const decomposerCod = soilMicrobes.reduce((sum, m) => sum + m.population.cod, 0);
  const processes: Process[] = [];
  const soilCapacity = microbialCapacity(params, 'soil', context.space);
  const reference = processSpecs.soilActivityReference.value * soilCapacity;
  const activity = reference > 0 ? Math.min(1, decomposerCod / reference) : 0;
  const moisture = Math.min(1, land.soilMoisture / processSpecs.litterMoistureOptimum.value);
  const litterCod = pools.get(LITTER.cod) ?? 0;
  if (litterCod > 0 && activity > 0) {
    const perDay = processSpecs.litterDecayPerYear.value / 365;
    const nRatio = (pools.get(LITTER.n) ?? 0) / litterCod;
    const pRatio = (pools.get(LITTER.p) ?? 0) / litterCod;
    processes.push({
      name: 'litter_decay',
      rate: perDay * theta * moisture * activity * litterCod * dtDays,
      stoichiometry: {
        [LITTER.cod]: -1,
        [LITTER.n]: -nRatio,
        [LITTER.p]: -pRatio,
        soil_substrate: 1,
        soil_tan: nRatio,
        soil_po4: pRatio,
      },
    });
  }
  const substratePerArea = landDensity(context, 'soil_substrate');
  for (const microbe of soilMicrobes) {
    if (microbe.population.cod <= 0) continue;
    const litterPerDay = microbe.effects.litterDecay?.value ?? 0;
    const litter = pools.get(LITTER.cod) ?? 0;
    if (litterPerDay > 0 && litter > 0) {
      const nRatio = (pools.get(LITTER.n) ?? 0) / litter;
      const pRatio = (pools.get(LITTER.p) ?? 0) / litter;
      processes.push({
        name: `white_rot:${microbe.population.id}`,
        rate:
          litterPerDay * theta * moisture * specialistActivity(context, microbe) * litter * dtDays,
        stoichiometry: {
          [LITTER.cod]: -1,
          [LITTER.n]: -nRatio,
          [LITTER.p]: -pRatio,
          soil_substrate: 1,
          soil_tan: nRatio,
          soil_po4: pRatio,
        },
        speciesId: microbe.population.speciesId,
      });
    }
    const yieldCoefficient = yieldOf(microbe);
    const ratios = microbe.ratios;
    const growth =
      maxRate(params, microbe, land.airTemperatureC) *
      moisture *
      monod(substratePerArea, processSpecs.soilSubstrateHalfSatPerM2.value) *
      crowdingFactor(context.occupancy, microbe.archetype.id);
    if (growth <= 0) continue;
    processes.push({
      name: `growth:${microbe.population.id}`,
      rate: growth * microbe.population.cod * dtDays,
      stoichiometry: {
        soil_substrate: -1 / yieldCoefficient,
        soil_tan: -ratios.n,
        soil_po4: -ratios.p,
        [microbe.key]: 1,
      },
      speciesId: microbe.population.speciesId,
    });
  }
  return processes;
}

/** mg COD added per dtDays by background seeding (docs/04 §5.2). */
export function seedingCod(
  params: ParameterSet,
  archetypeId: MicrobeId,
  units: number,
  dtDays: number,
): number {
  const base = params.stoichiometry.base;
  return (
    params.microbes.backgroundSeeding[archetypeId].value *
    units *
    base.cellDryMassMg.value *
    base.codPerDryBiomass.value *
    dtDays
  );
}
