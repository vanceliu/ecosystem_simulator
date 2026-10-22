import type { Archetype, FoodKind } from '../content/archetype';
import type { LocusKey, NamingParams } from '../content/genetics';
import type { ParameterSet } from '../content/parameters';

export type LocusId =
  | 'size'
  | 'thermal'
  | 'salinity'
  | 'humidity'
  | 'ph'
  | 'hardiness'
  | 'growth'
  | 'lifespan'
  | 'mutation'
  | 'pigment'
  | 'pattern'
  | 'diet'
  | 'activity'
  | 'defense'
  | 'fecundity'
  | 'habitat'
  | 'morphology'
  | 'metabolism';

export interface LocusDef {
  readonly id: LocusId;
  readonly labelsZh: readonly string[];
  /** ordered loci mutate by ±1 */
  readonly ordered: boolean;
  readonly baseWeights: readonly number[];
}

export const MUTATIONS = [
  'none',
  'albino',
  'melanistic',
  'gigantism',
  'dwarfism',
  'bioluminescent',
  'longevity',
  'fecundity',
  'eurythermal',
  'euryhaline',
  'resistant',
] as const;
export type Mutation = (typeof MUTATIONS)[number];

const lociCache = new WeakMap<Archetype, readonly LocusDef[]>();

/** Ordered loci for an archetype; the order defines the genotype encoding (docs/05 §2). */
export function lociFor(params: ParameterSet, archetype: Archetype): readonly LocusDef[] {
  const cached = lociCache.get(archetype);
  if (cached !== undefined) return cached;
  const loci = buildLoci(params, archetype);
  lociCache.set(archetype, loci);
  return loci;
}

function dietLabel(
  naming: NamingParams,
  diet: Readonly<Partial<Record<FoodKind, number>>>,
): string {
  const top = Object.entries(diet).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  return top === undefined
    ? naming.dietNoneZh
    : `${naming.dietPreferZh}${naming.foodZh[top[0] as FoodKind]}`;
}

function buildLoci(params: ParameterSet, archetype: Archetype): readonly LocusDef[] {
  const specs = params.generation.loci;
  const naming = params.naming;
  const locus = (id: LocusId, key: LocusKey, labelsZh?: readonly string[]): LocusDef => {
    const spec = specs[key];
    const labels = labelsZh ?? spec.labelsZh;
    if (labels === undefined) throw new Error(`Locus ${key} has no labels`);
    return { id, labelsZh: labels, ordered: spec.ordered, baseWeights: spec.baseWeights };
  };
  const common: LocusDef[] = [
    locus('size', 'size'),
    locus('thermal', 'thermal'),
    archetype.zone === 'T' ? locus('humidity', 'humidity') : locus('salinity', 'salinity'),
    locus('ph', 'ph'),
    locus('hardiness', 'hardiness'),
    locus('growth', 'growth'),
    locus('lifespan', 'lifespan'),
    locus('mutation', 'mutation'),
  ];
  if (archetype.kind === 'cohort') {
    return [
      ...common,
      locus('pigment', 'cohortPigment'),
      locus('pattern', 'pattern'),
      locus(
        'diet',
        'diet',
        archetype.diets.map((diet) => dietLabel(naming, diet)),
      ),
      locus('activity', 'activity'),
      locus(
        'defense',
        'defense',
        archetype.defenses.map((set) => (set.length === 0 ? naming.defenseNoneZh : set.join('+'))),
      ),
      locus('fecundity', 'fecundity'),
      locus(
        'habitat',
        'habitat',
        archetype.habitats.map((set) => set.join('+')),
      ),
    ];
  }
  return [
    ...common,
    locus('pigment', 'biomassPigment'),
    locus('morphology', 'morphology', archetype.morphologies),
    locus('metabolism', 'metabolism'),
  ];
}

export function locusIndex(loci: readonly LocusDef[], id: LocusId): number {
  return loci.findIndex((locus) => locus.id === id);
}
