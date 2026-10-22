import type {
  Archetype,
  BiomassNiche,
  Defense,
  DietProfile,
  FoodKind,
  Habitat,
} from '../content/archetype';
import type { ArchetypeId } from '../content/archetypeIds';
import { getArchetype } from '../content/archetypes/index';
import { PREY_KINDS } from '../content/foodWeb';
import {
  ASSIMILATION_EFFICIENCY,
  FOOD_CLASS,
  FOOD_HALF_SATURATION,
  FUNCTIONAL_RESPONSE_EXPONENT,
  MAX_INGESTION_MULTIPLIER,
  METABOLIC_Q10,
  METABOLIC_SCALING,
  type ConsumerClass,
} from '../content/physiology';
import type { Phenotype } from '../generation/index';
import type { BioContext } from './bioContext';
import {
  ageDays,
  bodyRatios,
  bodyTemperature,
  cohortCod,
  phenotypeOf,
  waterFraction,
} from './biota';
import { crowdingFactor } from './crowding';
import { addTerm, type Process } from './fluxes';
import { temperatureFactor } from './microbes';
import {
  cohortKey,
  gainKey,
  LAND_LITTER,
  POOL,
  populationKey,
  WATER_DETRITUS,
  WATER_FOOD,
  type OrganicKeys,
} from './pools';
import type { BiomassPopulation, CohortPopulation, Population } from './types';

const CO2_PER_O2 = 44 / 32;
/** docs/04 §5.4: off-phase activity of diurnal or nocturnal species */
export const OFF_PHASE_ACTIVITY = 0.3;
/** niche overlap when predator and prey share no habitat */
export const HABITAT_MISMATCH_OVERLAP = 0.3;
/** docs/04 §5.4: cohorts younger than this count as eggs of egg-laying species */
export const EGG_STAGE_DAYS = 2;
/** docs/04 §5.4: prey : predator mass ratio for predators without archetype data */
export const DEFAULT_PREY_SIZE_RATIO = { min: 1e-6, opt: 1e-3, max: 0.5 } as const;
/** docs/04 §5.4 refuge multiplier per prey defense */
export const DEFENSE_REFUGE: Readonly<Record<Defense, number>> = {
  shell: 0.5,
  spines: 0.6,
  toxin: 0.3,
  venom: 0.7,
  hiding: 0.6,
  schooling: 0.8,
  armor: 0.6,
  size: 1,
  burrowing: 0.5,
  camouflage: 0.7,
  autotomy: 0.8,
  mucus: 0.8,
};
const MIN_REFUGE = 0.05;
/** Habitats a biomass population occupies, by niche, for niche overlap (docs/04 §5.4). */
export const NICHE_HABITATS: Readonly<Record<BiomassNiche, readonly Habitat[]>> = {
  water_column: ['pelagic', 'surface'],
  surface: ['benthic', 'epiphytic', 'crevice', 'sessile'],
  sediment: ['infaunal', 'benthic', 'burrow'],
  water_floor: ['benthic', 'epiphytic'],
  land: ['ground', 'arboreal', 'leaf_litter', 'shore'],
  soil: ['soil', 'leaf_litter', 'burrow'],
  host: ['sessile'],
};
const MAX_ASSIMILATION = 0.95;

export type Medium = 'water' | 'land';

/** Anything that can be eaten: a resource pool, a biomass population or one age cohort. */
export interface FoodNode {
  readonly key: string;
  readonly organic: OrganicKeys | null;
  /** docs/04 §10 NodeId: species ID, or detritus / food / doc */
  readonly recordId: string;
  readonly kinds: readonly FoodKind[];
  readonly medium: Medium;
  /** mg N and P per mg COD */
  readonly n: number;
  readonly p: number;
  readonly cod: number;
  /** individual dry mass for size-selective predation; null for pools and biomass */
  readonly individualMassMg: number | null;
  readonly populationId: string | null;
  readonly isCohort: boolean;
  /** water-time fraction */
  readonly w: number;
  readonly habitats: readonly Habitat[];
  /** refuge × exposure multipliers */
  readonly vulnerability: number;
}

const isConsumerClass = (value: string): value is ConsumerClass => value in METABOLIC_SCALING;

/** docs/04 §5.4 maintenance respiration, d⁻¹ of body COD. */
export function respirationRate(
  archetype: Archetype,
  phenotype: Phenotype,
  massMg: number,
  temperatureC: number,
): number {
  const metabolicClass = archetype.metabolicClass;
  if (!isConsumerClass(metabolicClass)) return 0;
  const scaling = METABOLIC_SCALING[metabolicClass];
  return (
    scaling.r0.value *
    phenotype.growthMultiplier *
    phenotype.metabolicMultiplier *
    Math.pow(Math.max(massMg, 1e-12), scaling.exponent.value) *
    Math.pow(METABOLIC_Q10.value, (temperatureC - 20) / 10)
  );
}

function maxIngestionMultiplier(archetype: Archetype): number {
  const metabolicClass = archetype.metabolicClass;
  return isConsumerClass(metabolicClass) ? MAX_INGESTION_MULTIPLIER[metabolicClass].value : 0;
}

function organicNode(
  context: BioContext,
  keys: OrganicKeys,
  recordId: string,
  kinds: readonly FoodKind[],
  medium: Medium,
): FoodNode | null {
  const cod = context.pools.get(keys.cod) ?? 0;
  if (cod <= 0) return null;
  return {
    key: keys.cod,
    organic: keys,
    recordId,
    kinds,
    medium,
    n: (context.pools.get(keys.n) ?? 0) / cod,
    p: (context.pools.get(keys.p) ?? 0) / cod,
    cod,
    individualMassMg: null,
    populationId: null,
    isCohort: false,
    w: medium === 'water' ? 1 : 0,
    habitats: [],
    vulnerability: 1,
  };
}

function vulnerability(phenotype: Phenotype, lightsOn: boolean): number {
  const refuge = phenotype.defenses.reduce(
    (product, defense) => product * DEFENSE_REFUGE[defense],
    1,
  );
  return (
    Math.max(MIN_REFUGE, refuge) *
    phenotype.predationExposure *
    (lightsOn ? 1 : phenotype.nightExposure)
  );
}

/** Every food item available this substep (docs/04 §5.4). */
export function foodNodes(context: BioContext, populations: readonly Population[]): FoodNode[] {
  const nodes: FoodNode[] = [];
  const push = (node: FoodNode | null): void => {
    if (node !== null) nodes.push(node);
  };
  if (context.media.hasWater) {
    push(organicNode(context, WATER_DETRITUS, 'detritus', ['detritus', 'carrion'], 'water'));
    push(organicNode(context, WATER_FOOD, 'food', ['food', 'fruit'], 'water'));
    const doc = context.pools.get(POOL.substrate) ?? 0;
    if (doc > 0) {
      nodes.push({
        key: POOL.substrate,
        organic: null,
        recordId: 'doc',
        kinds: ['doc'],
        medium: 'water',
        n: 0,
        p: 0,
        cod: doc,
        individualMassMg: null,
        populationId: null,
        isCohort: false,
        w: 1,
        habitats: [],
        vulnerability: 1,
      });
    }
  }
  if (context.media.hasLand) {
    push(
      organicNode(
        context,
        LAND_LITTER,
        'detritus',
        ['litter', 'detritus', 'carrion', 'food', 'fruit'],
        'land',
      ),
    );
  }
  const tick = context.state.tick;
  for (const population of populations) {
    const archetype = getArchetype(population.archetypeId);
    const phenotype = phenotypeOf(population.speciesId);
    const ratios = bodyRatios(archetype);
    const kinds = PREY_KINDS[archetype.id];
    if (population.kind === 'biomass') {
      if (population.cod <= 0 || kinds.length === 0) continue;
      const medium: Medium = archetype.zone === 'T' ? 'land' : 'water';
      nodes.push({
        key: populationKey(population.id),
        organic: null,
        recordId: population.speciesId,
        kinds,
        medium,
        n: ratios.n,
        p: ratios.p,
        cod: population.cod,
        individualMassMg: null,
        populationId: population.id,
        isCohort: false,
        w: medium === 'water' ? 1 : 0,
        habitats: archetype.kind === 'biomass' ? NICHE_HABITATS[archetype.niche] : [],
        vulnerability: vulnerability(phenotype, context.lightsOn),
      });
      continue;
    }
    const laysEggs = archetype.lifeHistory.reproduction.mode === 'eggs';
    const exposed = vulnerability(phenotype, context.lightsOn);
    population.cohorts.forEach((cohort, index) => {
      const cod = cohortCod(cohort);
      if (cod <= 0) return;
      const egg = laysEggs && ageDays(cohort, tick) < EGG_STAGE_DAYS;
      const w = waterFraction(archetype, phenotype, context.media, cohort.aquatic);
      nodes.push({
        key: cohortKey(population.id, index),
        organic: null,
        recordId: population.speciesId,
        kinds: egg ? ['egg'] : kinds,
        medium: w >= 0.5 ? 'water' : 'land',
        n: ratios.n,
        p: ratios.p,
        cod,
        individualMassMg: cohort.meanMassMg,
        populationId: population.id,
        isCohort: true,
        w,
        habitats: phenotype.habitats,
        vulnerability: egg ? 1 : exposed,
      });
    });
  }
  return nodes;
}

/** docs/04 §5.4 size selectivity on log10(prey mass / predator mass). */
export function sizeFactor(
  ratio: number,
  window: { readonly min: number; readonly opt: number; readonly max: number },
): number {
  if (!(ratio >= window.min && ratio <= window.max)) return 0;
  const sigma = (Math.log10(window.max) - Math.log10(window.min)) / 4;
  if (sigma <= 0) return 1;
  const offset = Math.log10(ratio) - Math.log10(window.opt);
  return Math.exp(-(offset * offset) / (2 * sigma * sigma));
}

/** A feeding population reduced to what the functional response needs. */
export interface Predator {
  readonly populationId: string;
  readonly speciesId: string;
  readonly archetypeId: ArchetypeId;
  readonly diet: DietProfile;
  readonly cannibal: boolean;
  /** biomass-weighted individual dry mass; null for biomass consumers */
  readonly massMg: number | null;
  readonly sizeWindow: { readonly min: number; readonly opt: number; readonly max: number };
  readonly w: number;
  readonly habitats: readonly Habitat[];
  readonly activity: number;
  /** maximum intake, mg COD per day */
  readonly maxIntake: number;
  /** assimilated fraction by food kind */
  readonly efficiency: (kind: FoodKind) => number;
  /** food density at half-maximal intake by food kind and medium */
  readonly halfSaturation: (kind: FoodKind, medium: Medium) => number;
  readonly gainKey: string;
  readonly n: number;
  readonly p: number;
  readonly breathesAir: boolean;
}

function activityFactor(phenotype: Phenotype, lightsOn: boolean): number {
  const phase =
    phenotype.activity === 'diurnal'
      ? lightsOn
        ? 1
        : OFF_PHASE_ACTIVITY
      : phenotype.activity === 'nocturnal'
        ? lightsOn
          ? OFF_PHASE_ACTIVITY
          : 1
        : 1;
  return phase * (lightsOn ? 1 : phenotype.nightAttack);
}

function cohortPredator(context: BioContext, population: CohortPopulation): Predator | null {
  const archetype = getArchetype(population.archetypeId);
  const phenotype = phenotypeOf(population.speciesId);
  if (archetype.kind !== 'cohort' || phenotype.diet === undefined) return null;
  let cod = 0;
  let massWeighted = 0;
  let wWeighted = 0;
  let maxIntake = 0;
  const multiplier = maxIngestionMultiplier(archetype);
  for (const cohort of population.cohorts) {
    const cohortMass = cohortCod(cohort);
    if (cohortMass <= 0) continue;
    const w = waterFraction(archetype, phenotype, context.media, cohort.aquatic);
    const temperature = bodyTemperature(context.state, archetype, w, context.lightsOn);
    cod += cohortMass;
    massWeighted += cohortMass * cohort.meanMassMg;
    wWeighted += cohortMass * w;
    maxIntake +=
      multiplier *
      respirationRate(archetype, phenotype, cohort.meanMassMg, temperature) *
      cohortMass;
  }
  if (cod <= 0 || maxIntake <= 0) return null;
  const ratios = bodyRatios(archetype);
  return {
    populationId: population.id,
    speciesId: population.speciesId,
    archetypeId: archetype.id,
    diet: phenotype.diet,
    cannibal: archetype.flags.includes('cannibal'),
    massMg: massWeighted / cod,
    sizeWindow: archetype.preySizeRatio ?? DEFAULT_PREY_SIZE_RATIO,
    w: wWeighted / cod,
    habitats: phenotype.habitats,
    activity: activityFactor(phenotype, context.lightsOn),
    maxIntake,
    efficiency: (kind) =>
      Math.min(
        MAX_ASSIMILATION,
        ASSIMILATION_EFFICIENCY[FOOD_CLASS[kind]].value * phenotype.assimilationMultiplier,
      ),
    halfSaturation: (kind, medium) => FOOD_HALF_SATURATION[FOOD_CLASS[kind]][medium].value,
    gainKey: gainKey(population.id),
    n: ratios.n,
    p: ratios.p,
    breathesAir: archetype.flags.includes('air_breather'),
  };
}

function biomassPredator(context: BioContext, population: BiomassPopulation): Predator | null {
  const archetype = getArchetype(population.archetypeId);
  if (archetype.kind !== 'biomass' || archetype.trophicMode !== 'consumer') return null;
  if (population.cod <= 0 || archetype.prey === undefined) return null;
  const phenotype = phenotypeOf(population.speciesId);
  const yieldCoefficient = archetype.kinetics.yieldCoefficient?.value ?? 0;
  const halfSat =
    (archetype.kinetics.halfSat.prey?.value ?? 0) * phenotype.halfSaturationMultiplier;
  if (yieldCoefficient <= 0 || halfSat <= 0) return null;
  const temperature = context.state.water.temperatureC;
  const range = phenotype.temperatureC;
  if (temperature < range.min || temperature > range.max) return null;
  const maxIntake =
    ((archetype.kinetics.muMax.value *
      phenotype.growthMultiplier *
      temperatureFactor(temperature)) /
      yieldCoefficient) *
    crowdingFactor(context.occupancy, archetype.id) *
    population.cod;
  const diet: Partial<Record<FoodKind, number>> = {};
  for (const kind of archetype.prey) diet[kind] = 1;
  const ratios = bodyRatios(archetype);
  return {
    populationId: population.id,
    speciesId: population.speciesId,
    archetypeId: archetype.id,
    diet,
    cannibal: false,
    massMg: null,
    sizeWindow: DEFAULT_PREY_SIZE_RATIO,
    w: 1,
    habitats: NICHE_HABITATS[archetype.niche],
    activity: 1,
    maxIntake,
    efficiency: () => yieldCoefficient,
    halfSaturation: () => halfSat,
    gainKey: populationKey(population.id),
    n: ratios.n,
    p: ratios.p,
    breathesAir: false,
  };
}

export function predatorOf(context: BioContext, population: Population): Predator | null {
  return population.kind === 'cohort'
    ? cohortPredator(context, population)
    : biomassPredator(context, population);
}

export function predatorsOf(context: BioContext, populations: readonly Population[]): Predator[] {
  const predators: Predator[] = [];
  for (const population of populations) {
    const predator = predatorOf(context, population);
    if (predator !== null) predators.push(predator);
  }
  return predators;
}

/** Scaled food terms (a_ij R_j)^h for one predator (docs/04 §5.4). */
export function attackTerms(
  context: BioContext,
  predator: Predator,
  nodes: readonly FoodNode[],
): { node: FoodNode; kind: FoodKind; term: number }[] {
  const terms: { node: FoodNode; kind: FoodKind; term: number }[] = [];
  const volume = context.space.waterVolumeL;
  const area = context.space.geometry.landAreaM2;
  for (const node of nodes) {
    if (node.populationId === predator.populationId && !(predator.cannibal && node.isCohort))
      continue;
    let preference = 0;
    let kind: FoodKind | null = null;
    for (const candidate of node.kinds) {
      const weight = predator.diet[candidate] ?? 0;
      if (weight > preference) {
        preference = weight;
        kind = candidate;
      }
    }
    if (kind === null || preference <= 0) continue;
    const size =
      node.individualMassMg !== null && predator.massMg !== null
        ? sizeFactor(node.individualMassMg / predator.massMg, predator.sizeWindow)
        : 1;
    if (size <= 0) continue;
    const zoneOverlap = predator.w * node.w + (1 - predator.w) * (1 - node.w);
    const habitatOverlap =
      node.habitats.length === 0 ||
      predator.habitats.length === 0 ||
      node.habitats.some((habitat) => predator.habitats.includes(habitat))
        ? 1
        : HABITAT_MISMATCH_OVERLAP;
    const extent = node.medium === 'water' ? volume : area;
    if (extent <= 0) continue;
    const density = node.cod / extent;
    const scaled =
      (preference *
        size *
        zoneOverlap *
        habitatOverlap *
        node.vulnerability *
        predator.activity *
        density) /
      predator.halfSaturation(kind, node.medium);
    const term = Math.pow(scaled, FUNCTIONAL_RESPONSE_EXPONENT.value);
    if (term > 0) terms.push({ node, kind, term });
  }
  return terms;
}

function detritusTarget(context: BioContext, w: number): OrganicKeys {
  if (!context.media.hasLand) return WATER_DETRITUS;
  if (!context.media.hasWater) return LAND_LITTER;
  return w >= 0.5 ? WATER_DETRITUS : LAND_LITTER;
}

/** Excretion and respiration exchange split between water (w) and land (1 − w). */
function addMetabolicExchange(
  terms: Record<string, number>,
  context: BioContext,
  predator: { readonly w: number; readonly breathesAir: boolean },
  respiredCod: number,
  n: number,
  p: number,
): void {
  const w = predator.w;
  addTerm(terms, POOL.tan, n * w);
  addTerm(terms, POOL.po4, p * w);
  addTerm(terms, POOL.soilTan, n * (1 - w));
  addTerm(terms, POOL.soilPo4, p * (1 - w));
  if (context.media.hasWater && !predator.breathesAir) {
    addTerm(terms, POOL.o2, -respiredCod * w);
    addTerm(terms, POOL.co2, respiredCod * w * CO2_PER_O2);
  }
}

/** Holling II feeding fluxes, docs/04 §5.4; rates in mg prey COD per dtDays. */
export function feedingProcesses(
  context: BioContext,
  predators: readonly Predator[],
  nodes: readonly FoodNode[],
): Process[] {
  const processes: Process[] = [];
  for (const predator of predators) {
    const terms = attackTerms(context, predator, nodes);
    const denominator = 1 + terms.reduce((sum, entry) => sum + entry.term, 0);
    context.satiation.set(predator.populationId, 1 - 1 / denominator);
    for (const { node, kind, term } of terms) {
      const eaten = (predator.maxIntake * term * context.dtDays) / denominator;
      if (!(eaten > 0)) continue;
      const efficiency = predator.efficiency(kind);
      const limit = Math.min(
        1,
        predator.n > 0 ? node.n / predator.n : 1,
        predator.p > 0 ? node.p / predator.p : 1,
      );
      const growth = efficiency * limit;
      const egested = 1 - efficiency;
      const stoichiometry: Record<string, number> = {};
      addTerm(stoichiometry, node.key, -1);
      if (node.organic !== null) {
        addTerm(stoichiometry, node.organic.n, -node.n);
        addTerm(stoichiometry, node.organic.p, -node.p);
      }
      addTerm(stoichiometry, predator.gainKey, growth);
      const sink = detritusTarget(context, predator.w);
      addTerm(stoichiometry, sink.cod, egested);
      addTerm(stoichiometry, sink.n, egested * node.n);
      addTerm(stoichiometry, sink.p, egested * node.p);
      addMetabolicExchange(
        stoichiometry,
        context,
        predator,
        efficiency - growth,
        efficiency * node.n - growth * predator.n,
        efficiency * node.p - growth * predator.p,
      );
      processes.push({
        name: `feed:${predator.populationId}:${node.key}`,
        rate: eaten,
        stoichiometry,
        speciesId: predator.speciesId,
        feeding: { prey: node.recordId, predator: predator.speciesId },
        ...(node.isCohort ? { cohort: { key: node.key, effect: 'remove' as const } } : {}),
      });
    }
  }
  return processes;
}

/** Maintenance respiration of every cohort, docs/04 §5.4. */
export function respirationProcesses(
  context: BioContext,
  populations: readonly Population[],
): Process[] {
  const processes: Process[] = [];
  for (const population of populations) {
    if (population.kind !== 'cohort') continue;
    const archetype = getArchetype(population.archetypeId);
    const phenotype = phenotypeOf(population.speciesId);
    const ratios = bodyRatios(archetype);
    const breathesAir = archetype.flags.includes('air_breather');
    population.cohorts.forEach((cohort, index) => {
      const cod = cohortCod(cohort);
      if (cod <= 0) return;
      const w = waterFraction(archetype, phenotype, context.media, cohort.aquatic);
      const temperature = bodyTemperature(context.state, archetype, w, context.lightsOn);
      const rate = respirationRate(archetype, phenotype, cohort.meanMassMg, temperature);
      const respired = rate * cod * context.dtDays;
      if (!(respired > 0)) return;
      const key = cohortKey(population.id, index);
      const stoichiometry: Record<string, number> = {};
      addTerm(stoichiometry, key, -1);
      addMetabolicExchange(stoichiometry, context, { w, breathesAir }, 1, ratios.n, ratios.p);
      processes.push({
        name: `respire:${key}`,
        rate: respired,
        stoichiometry,
        speciesId: population.speciesId,
        cohort: { key, effect: 'shrink' },
      });
    });
  }
  return processes;
}

/** docs/04 §7: food supply (Σ a·R) at which an arrival's food score reaches one half */
export const ARRIVAL_FOOD_HALF_SATURATION = 0.01;

/** Normalised food supply 0–1 for emergence suitability (docs/04 §7). */
export function foodAvailability(
  context: BioContext,
  predator: Predator,
  nodes: readonly FoodNode[],
): number {
  const total = attackTerms(context, predator, nodes).reduce((sum, entry) => sum + entry.term, 0);
  return total / (ARRIVAL_FOOD_HALF_SATURATION + total);
}
