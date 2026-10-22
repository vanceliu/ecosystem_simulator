import type { Archetype, BiomassNiche, DietProfile, FoodKind, Habitat } from '../content/archetype';
import type { ArchetypeId } from '../content/archetypeIds';
import type { ParameterSet } from '../content/parameters';
import type { ConsumerClass } from '../content/physiology';
import { DETRITUS, FOOD, LITTER, type OrganicIds } from '../content/substances';
import type { Phenotype } from '../generation/index';
import type { BioContext } from './bioContext';
import {
  ageDays,
  bodyRatios,
  bodyTemperature,
  cohortCod,
  effect,
  phenotypeOf,
  specialisedOf,
  waterFraction,
} from './biota';
import { crowdingFactor } from './crowding';
import {
  addTerm,
  type CohortTouch,
  type PoolKey,
  type Process,
  type Stoichiometry,
} from './fluxes';
import { temperatureFactor } from './microbes';
import { cohortKey, gainKey, populationKey } from './pools';
import type { BiomassPopulation, CohortPopulation, Population } from './types';

const EMBEDDED_NICHES: ReadonlySet<BiomassNiche> = new Set(['surface', 'sediment']);

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
export type Medium = 'water' | 'land';

/** Anything that can be eaten: a resource pool, a biomass population or one age cohort. */
export interface FoodNode {
  readonly key: PoolKey;
  readonly organic: OrganicIds | null;
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

const isConsumerClass = (params: ParameterSet, value: string): value is ConsumerClass =>
  value in params.physiology.metabolicScaling;

/** docs/04 §5.4 maintenance respiration, d⁻¹ of body COD. */
export function respirationRate(
  params: ParameterSet,
  archetype: Archetype,
  phenotype: Phenotype,
  massMg: number,
  temperatureC: number,
): number {
  const metabolicClass = archetype.metabolicClass;
  if (!isConsumerClass(params, metabolicClass)) return 0;
  const scaling = params.physiology.metabolicScaling[metabolicClass];
  return (
    scaling.r0.value *
    phenotype.growthMultiplier *
    phenotype.metabolicMultiplier *
    Math.pow(Math.max(massMg, 1e-12), scaling.exponent.value) *
    Math.pow(params.physiology.metabolicQ10.value, (temperatureC - 20) / 10)
  );
}

function maxIngestionMultiplier(params: ParameterSet, archetype: Archetype): number {
  const metabolicClass = archetype.metabolicClass;
  return isConsumerClass(params, metabolicClass)
    ? params.physiology.maxIngestionMultiplier[metabolicClass].value
    : 0;
}

function organicNode(
  context: BioContext,
  keys: OrganicIds,
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

function vulnerability(params: ParameterSet, phenotype: Phenotype, lightsOn: boolean): number {
  const consumers = params.mechanics.consumers;
  const refuge = phenotype.defenses.reduce(
    (product, defense) => product * consumers.defenseRefuge[defense],
    1,
  );
  return (
    Math.max(consumers.minRefuge, refuge) *
    phenotype.predationExposure *
    (lightsOn ? 1 : phenotype.nightExposure)
  );
}

/** Food nodes with a lookup by food kind. */
export interface FoodIndex {
  readonly nodes: readonly FoodNode[];
  readonly byKind: ReadonlyMap<FoodKind, readonly FoodNode[]>;
}

export function indexFood(nodes: readonly FoodNode[]): FoodIndex {
  const byKind = new Map<FoodKind, FoodNode[]>();
  for (const node of nodes) {
    for (const kind of node.kinds) {
      const list = byKind.get(kind);
      if (list === undefined) byKind.set(kind, [node]);
      else list.push(node);
    }
  }
  return { nodes, byKind };
}

/** Every food item available this substep (docs/04 §5.4). */
export function foodNodes(context: BioContext, populations: readonly Population[]): FoodNode[] {
  const nodes: FoodNode[] = [];
  const push = (node: FoodNode | null): void => {
    if (node !== null) nodes.push(node);
  };
  if (context.media.hasWater) {
    push(organicNode(context, DETRITUS, 'detritus', ['detritus', 'carrion'], 'water'));
    push(organicNode(context, FOOD, 'food', ['food', 'fruit'], 'water'));
    const doc = context.pools.get('water_substrate') ?? 0;
    if (doc > 0) {
      nodes.push({
        key: 'water_substrate',
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
        LITTER,
        'detritus',
        ['litter', 'detritus', 'carrion', 'food', 'fruit'],
        'land',
      ),
    );
  }
  const { params } = context;
  const tick = context.state.tick;
  for (const population of populations) {
    const archetype = params.archetypes[population.archetypeId];
    const phenotype = phenotypeOf(params, population.speciesId);
    const ratios = bodyRatios(params, archetype);
    const kinds = params.preyKinds[archetype.id];
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
        vulnerability:
          vulnerability(params, phenotype, context.lightsOn) *
          effect(specialisedOf(archetype, phenotype).predationExposure) *
          (archetype.kind === 'biomass' && EMBEDDED_NICHES.has(archetype.niche)
            ? params.mechanics.consumers.embeddedRefuge
            : 1),
      });
      continue;
    }
    const laysEggs = archetype.lifeHistory.reproduction.mode === 'eggs';
    const exposed = vulnerability(params, phenotype, context.lightsOn);
    const eggDays = params.mechanics.consumers.eggStageDays;
    population.cohorts.forEach((cohort, index) => {
      const cod = cohortCod(params, cohort);
      if (cod <= 0) return;
      const egg = laysEggs && ageDays(cohort, tick) < eggDays;
      const w = waterFraction(params, archetype, phenotype, context.media, cohort.aquatic);
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
  readonly gainKey: PoolKey;
  readonly n: number;
  readonly p: number;
  readonly breathesAir: boolean;
}

function activityFactor(params: ParameterSet, phenotype: Phenotype, lightsOn: boolean): number {
  const offPhase = params.mechanics.consumers.offPhaseActivity;
  const phase =
    phenotype.activity === 'diurnal'
      ? lightsOn
        ? 1
        : offPhase
      : phenotype.activity === 'nocturnal'
        ? lightsOn
          ? offPhase
          : 1
        : 1;
  return phase * (lightsOn ? 1 : phenotype.nightAttack);
}

/** Food density at half-maximal intake of a food kind in a medium. */
function foodHalfSaturation(params: ParameterSet, kind: FoodKind, medium: Medium): number {
  return params.physiology.foodHalfSaturation[params.physiology.foodClass[kind]][medium].value;
}

function cohortPredator(context: BioContext, population: CohortPopulation): Predator | null {
  const { params } = context;
  const archetype = params.archetypes[population.archetypeId];
  const phenotype = phenotypeOf(params, population.speciesId);
  if (archetype.kind !== 'cohort' || phenotype.diet === undefined) return null;
  let cod = 0;
  let massWeighted = 0;
  let wWeighted = 0;
  let maxIntake = 0;
  const multiplier = maxIngestionMultiplier(params, archetype);
  for (const cohort of population.cohorts) {
    const cohortMass = cohortCod(params, cohort);
    if (cohortMass <= 0) continue;
    const w = waterFraction(params, archetype, phenotype, context.media, cohort.aquatic);
    const temperature = bodyTemperature(context.state, archetype, w, context.lightsOn);
    cod += cohortMass;
    massWeighted += cohortMass * cohort.meanMassMg;
    wWeighted += cohortMass * w;
    maxIntake +=
      multiplier *
      respirationRate(params, archetype, phenotype, cohort.meanMassMg, temperature) *
      cohortMass;
  }
  if (cod <= 0 || maxIntake <= 0) return null;
  const ratios = bodyRatios(params, archetype);
  return {
    populationId: population.id,
    speciesId: population.speciesId,
    archetypeId: archetype.id,
    diet: phenotype.diet,
    cannibal: archetype.flags.includes('cannibal'),
    massMg: massWeighted / cod,
    sizeWindow: archetype.preySizeRatio ?? params.mechanics.consumers.defaultPreySizeRatio,
    w: wWeighted / cod,
    habitats: phenotype.habitats,
    activity: activityFactor(params, phenotype, context.lightsOn),
    maxIntake,
    efficiency: (kind) =>
      Math.min(
        params.mechanics.consumers.maxAssimilation,
        params.physiology.assimilationEfficiency[params.physiology.foodClass[kind]].value *
          phenotype.assimilationMultiplier,
      ),
    halfSaturation: (kind, medium) => foodHalfSaturation(params, kind, medium),
    gainKey: gainKey(population.id),
    n: ratios.n,
    p: ratios.p,
    breathesAir: archetype.flags.includes('air_breather'),
  };
}

/** docs/05 §2.3 parasitic water molds: attack eggs with the effect's maximum intake. */
function parasitePredator(context: BioContext, population: BiomassPopulation): Predator | null {
  const { params } = context;
  const archetype = params.archetypes[population.archetypeId];
  if (archetype.kind !== 'biomass' || population.cod <= 0) return null;
  const phenotype = phenotypeOf(params, population.speciesId);
  const perDay = specialisedOf(archetype, phenotype).eggPredation?.value ?? 0;
  const yieldCoefficient = archetype.kinetics.yieldCoefficient?.value ?? 0;
  if (perDay <= 0 || yieldCoefficient <= 0 || !context.media.hasWater) return null;
  const temperature = context.state.water.temperatureC;
  const range = phenotype.temperatureC;
  if (temperature < range.min || temperature > range.max) return null;
  const ratios = bodyRatios(params, archetype);
  return {
    populationId: population.id,
    speciesId: population.speciesId,
    archetypeId: archetype.id,
    diet: { egg: 1 },
    cannibal: false,
    massMg: null,
    sizeWindow: params.mechanics.consumers.defaultPreySizeRatio,
    w: 1,
    habitats: [],
    activity: 1,
    maxIntake: perDay * temperatureFactor(params, temperature) * population.cod,
    efficiency: () => yieldCoefficient,
    halfSaturation: (kind, medium) => foodHalfSaturation(params, kind, medium),
    gainKey: populationKey(population.id),
    n: ratios.n,
    p: ratios.p,
    breathesAir: false,
  };
}

function biomassPredator(context: BioContext, population: BiomassPopulation): Predator | null {
  const { params } = context;
  const archetype = params.archetypes[population.archetypeId];
  if (archetype.kind !== 'biomass') return null;
  if (archetype.trophicMode !== 'consumer') return parasitePredator(context, population);
  if (population.cod <= 0 || archetype.prey === undefined) return null;
  const phenotype = phenotypeOf(params, population.speciesId);
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
      temperatureFactor(params, temperature)) /
      yieldCoefficient) *
    crowdingFactor(context.occupancy, archetype.id) *
    population.cod;
  const diet: Partial<Record<FoodKind, number>> = {};
  for (const kind of archetype.prey) diet[kind] = 1;
  const ratios = bodyRatios(params, archetype);
  return {
    populationId: population.id,
    speciesId: population.speciesId,
    archetypeId: archetype.id,
    diet,
    cannibal: false,
    massMg: null,
    sizeWindow: params.mechanics.consumers.defaultPreySizeRatio,
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

/** log10 size window of a predator, precomputed for the attack loop. */
interface SizeWindowLog {
  readonly min: number;
  readonly max: number;
  readonly opt: number;
  /** 2σ² of the log-normal selectivity; 0 means flat */
  readonly spread: number;
}

const sizeLogCache = new WeakMap<object, SizeWindowLog>();

function sizeWindowLog(window: Predator['sizeWindow']): SizeWindowLog {
  const cached = sizeLogCache.get(window);
  if (cached !== undefined) return cached;
  const min = Math.log10(window.min);
  const max = Math.log10(window.max);
  const sigma = (max - min) / 4;
  const log = { min, max, opt: Math.log10(window.opt), spread: 2 * sigma * sigma };
  sizeLogCache.set(window, log);
  return log;
}

/**
 * Scaled food terms (a_ij R_j)^h for one predator (docs/04 §5.4). Diet weights are
 * renormalised over the food kinds present, so a predator switches to what it can find.
 */
export function attackTerms(
  context: BioContext,
  predator: Predator,
  food: FoodIndex,
): { node: FoodNode; kind: FoodKind; term: number }[] {
  const nodes: FoodNode[] = [];
  const kinds: FoodKind[] = [];
  const scaledTerms: number[] = [];
  const present = new Set<FoodKind>();
  const seen = new Set<FoodNode>();
  const volume = context.space.waterVolumeL;
  const area = context.space.geometry.landAreaM2;
  const habitats = new Set(predator.habitats);
  const window = predator.massMg === null ? null : sizeWindowLog(predator.sizeWindow);
  const logPredatorMass = predator.massMg === null ? 0 : Math.log10(predator.massMg);
  for (const dietKind in predator.diet) {
    if (!((predator.diet[dietKind as FoodKind] ?? 0) > 0)) continue;
    for (const node of food.byKind.get(dietKind as FoodKind) ?? []) {
      if (seen.has(node)) continue;
      seen.add(node);
      if (node.populationId === predator.populationId && !(predator.cannibal && node.isCohort))
        continue;
      const extent = node.medium === 'water' ? volume : area;
      if (extent <= 0) continue;
      let preference = 0;
      let kind: FoodKind | null = null;
      for (const candidate of node.kinds) {
        const weight = predator.diet[candidate] ?? 0;
        if (weight > preference) {
          preference = weight;
          kind = candidate;
        }
      }
      if (kind === null) continue;
      let size = 1;
      if (window !== null && node.individualMassMg !== null) {
        const ratio = Math.log10(node.individualMassMg) - logPredatorMass;
        if (ratio < window.min || ratio > window.max) continue;
        if (window.spread > 0) size = Math.exp(-((ratio - window.opt) ** 2) / window.spread);
      }
      let habitatOverlap = 1;
      if (node.habitats.length > 0 && habitats.size > 0) {
        habitatOverlap = context.params.mechanics.consumers.habitatMismatchOverlap;
        for (const habitat of node.habitats) {
          if (habitats.has(habitat)) {
            habitatOverlap = 1;
            break;
          }
        }
      }
      const zoneOverlap = predator.w * node.w + (1 - predator.w) * (1 - node.w);
      const scaled =
        (preference *
          size *
          zoneOverlap *
          habitatOverlap *
          node.vulnerability *
          predator.activity *
          (node.cod / extent)) /
        predator.halfSaturation(kind, node.medium);
      if (!(scaled > 0)) continue;
      present.add(kind);
      nodes.push(node);
      kinds.push(kind);
      scaledTerms.push(scaled);
    }
  }
  let totalPreference = 0;
  for (const kind of present) totalPreference += predator.diet[kind] ?? 0;
  if (totalPreference <= 0) return [];
  const exponent = context.params.physiology.functionalResponseExponent.value;
  const powered = scaledTerms.map((scaled) => Math.pow(scaled / totalPreference, exponent));
  const threshold =
    context.params.mechanics.consumers.minDietShare * powered.reduce((sum, term) => sum + term, 0);
  const terms: { node: FoodNode; kind: FoodKind; term: number }[] = [];
  powered.forEach((term, index) => {
    const node = nodes[index];
    const kind = kinds[index];
    if (term >= threshold && node !== undefined && kind !== undefined)
      terms.push({ node, kind, term });
  });
  return terms;
}

function detritusTarget(context: BioContext, w: number): OrganicIds {
  if (!context.media.hasLand) return DETRITUS;
  if (!context.media.hasWater) return LITTER;
  return w >= 0.5 ? DETRITUS : LITTER;
}

/** Excretion and respiration exchange split between water (w) and land (1 − w). */
function addMetabolicExchange(
  terms: Stoichiometry,
  context: BioContext,
  predator: { readonly w: number; readonly breathesAir: boolean },
  respiredCod: number,
  n: number,
  p: number,
): void {
  const w = predator.w;
  addTerm(terms, 'water_tan', n * w);
  addTerm(terms, 'water_po4', p * w);
  addTerm(terms, 'soil_tan', n * (1 - w));
  addTerm(terms, 'soil_po4', p * (1 - w));
  if (context.media.hasWater && !predator.breathesAir) {
    addTerm(terms, 'water_o2', -respiredCod * w);
    addTerm(terms, 'water_co2', respiredCod * w * context.params.physics.co2PerO2.value);
  }
}

/** Functional-response feeding, docs/04 §5.4: one process per predator, rate in mg prey COD. */
export function feedingProcesses(
  context: BioContext,
  predators: readonly Predator[],
  food: FoodIndex,
): Process[] {
  const processes: Process[] = [];
  for (const predator of predators) {
    const terms = attackTerms(context, predator, food);
    const total = terms.reduce((sum, entry) => sum + entry.term, 0);
    context.satiation.set(predator.populationId, total / (1 + total));
    const eaten = (predator.maxIntake * total * context.dtDays) / (1 + total);
    if (!(eaten > 0) || !(total > 0)) continue;
    const stoichiometry: Stoichiometry = {};
    const sink = detritusTarget(context, predator.w);
    const shares = new Map<string, number>();
    const cohorts: CohortTouch[] = [];
    let respired = 0;
    let excretedN = 0;
    let excretedP = 0;
    for (const { node, kind, term } of terms) {
      const share = term / total;
      const efficiency = predator.efficiency(kind);
      const limit = Math.min(
        1,
        predator.n > 0 ? node.n / predator.n : 1,
        predator.p > 0 ? node.p / predator.p : 1,
      );
      const growth = efficiency * limit;
      const egested = 1 - efficiency;
      addTerm(stoichiometry, node.key, -share);
      if (node.organic !== null) {
        addTerm(stoichiometry, node.organic.n, -share * node.n);
        addTerm(stoichiometry, node.organic.p, -share * node.p);
      }
      addTerm(stoichiometry, predator.gainKey, share * growth);
      addTerm(stoichiometry, sink.cod, share * egested);
      addTerm(stoichiometry, sink.n, share * egested * node.n);
      addTerm(stoichiometry, sink.p, share * egested * node.p);
      respired += share * (efficiency - growth);
      excretedN += share * (efficiency * node.n - growth * predator.n);
      excretedP += share * (efficiency * node.p - growth * predator.p);
      shares.set(node.recordId, (shares.get(node.recordId) ?? 0) + share);
      if (node.isCohort) cohorts.push({ key: node.key, effect: 'remove' });
    }
    addMetabolicExchange(stoichiometry, context, predator, respired, excretedN, excretedP);
    processes.push({
      name: `feed:${predator.populationId}`,
      rate: eaten,
      stoichiometry,
      speciesId: predator.speciesId,
      feeding: [...shares].map(([prey, share]) => ({
        prey,
        predator: predator.speciesId,
        share,
      })),
      ...(cohorts.length > 0 ? { cohorts } : {}),
    });
  }
  return processes;
}

/** Maintenance respiration of every cohort, docs/04 §5.4. */
export function respirationProcesses(
  context: BioContext,
  populations: readonly Population[],
): Process[] {
  const { params } = context;
  const processes: Process[] = [];
  for (const population of populations) {
    if (population.kind !== 'cohort') continue;
    const archetype = params.archetypes[population.archetypeId];
    const phenotype = phenotypeOf(params, population.speciesId);
    const ratios = bodyRatios(params, archetype);
    const breathesAir = archetype.flags.includes('air_breather');
    population.cohorts.forEach((cohort, index) => {
      const cod = cohortCod(params, cohort);
      if (cod <= 0) return;
      const w = waterFraction(params, archetype, phenotype, context.media, cohort.aquatic);
      const temperature = bodyTemperature(context.state, archetype, w, context.lightsOn);
      const rate = respirationRate(params, archetype, phenotype, cohort.meanMassMg, temperature);
      const respired = rate * cod * context.dtDays;
      if (!(respired > 0)) return;
      const key = cohortKey(population.id, index);
      const stoichiometry: Stoichiometry = {};
      addTerm(stoichiometry, key, -1);
      addMetabolicExchange(stoichiometry, context, { w, breathesAir }, 1, ratios.n, ratios.p);
      processes.push({
        name: `respire:${key}`,
        rate: respired,
        stoichiometry,
        speciesId: population.speciesId,
        cohorts: [{ key, effect: 'shrink' }],
      });
    });
  }
  return processes;
}

/** Normalised food supply 0–1 for emergence suitability (docs/04 §7). */
export function foodAvailability(context: BioContext, predator: Predator, food: FoodIndex): number {
  const total = attackTerms(context, predator, food).reduce((sum, entry) => sum + entry.term, 0);
  return total / (context.params.mechanics.consumers.arrivalFoodHalfSaturation + total);
}
