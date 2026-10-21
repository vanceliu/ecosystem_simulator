import type { Archetype, FoodKind } from '../content/archetype';

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

export const MUTATION_LABELS_ZH: Readonly<Record<Mutation, string>> = {
  none: '無',
  albino: '白化',
  melanistic: '黑化',
  gigantism: '巨大化',
  dwarfism: '侏儒化',
  bioluminescent: '發光',
  longevity: '長壽',
  fecundity: '多產',
  eurythermal: '廣溫',
  euryhaline: '廣鹽',
  resistant: '抗藥',
};

/** docs/05 §3 base weights */
const SIZE_WEIGHTS = [1, 4, 10, 14, 10, 4, 1];
const THERMAL_WEIGHTS = [1, 4, 6, 4, 1];
const ORDERED_THREE = [1, 3, 1];
const NO_MUTATION_WEIGHT = 10000;
const MUTATION_WEIGHTS = [NO_MUTATION_WEIGHT, ...Array<number>(MUTATIONS.length - 1).fill(1)];
const uniform = (count: number): number[] => Array<number>(count).fill(1);

export const COHORT_PIGMENTS_ZH = [
  '赤',
  '橙',
  '金',
  '黃',
  '綠',
  '碧',
  '藍',
  '紫',
  '褐',
  '墨',
  '雪',
  '透明',
];
export const BIOMASS_PIGMENTS_ZH = ['綠', '褐', '紅', '藍綠', '金', '無色'];
export const PATTERNS_ZH = ['素面', '斑點', '條紋', '環紋', '網紋', '虎斑', '漸層', '擬態'];
export const ACTIVITIES_ZH = ['日行', '夜行', '晨昏'];
export const FECUNDITIES_ZH = ['多產小卵', '中產', '少產大卵', '護幼'];
export const METABOLISMS_ZH = ['高親和', '均衡', '高速', '特化'];

const FOOD_ZH: Readonly<Record<FoodKind, string>> = {
  detritus: '碎屑',
  food: '殘餌',
  doc: '溶解有機物',
  bacteria: '細菌',
  biofilm: '生物膜',
  phytoplankton: '浮游藻',
  periphyton: '附生藻',
  plant: '植物',
  macroalgae: '大型藻',
  fungi: '真菌',
  litter: '落葉',
  fruit: '果實',
  protozoa: '原生動物',
  zooplankton: '浮游動物',
  aquatic_invertebrate: '水生無脊椎',
  terrestrial_invertebrate: '陸生無脊椎',
  flying_insect: '飛蟲',
  mollusc: '螺貝',
  crustacean: '甲殼類',
  echinoderm: '棘皮動物',
  sessile_invertebrate: '固著無脊椎',
  fish: '魚',
  egg: '卵',
  amphibian: '兩棲類',
  reptile: '爬蟲類',
  carrion: '腐肉',
};

function dietLabel(diet: Readonly<Partial<Record<FoodKind, number>>>): string {
  const top = Object.entries(diet).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  return top === undefined ? '雜食' : `偏食${FOOD_ZH[top[0] as FoodKind]}`;
}

const lociCache = new WeakMap<Archetype, readonly LocusDef[]>();

/** Ordered loci for an archetype; the order defines the genotype encoding (docs/05 §2). */
export function lociFor(archetype: Archetype): readonly LocusDef[] {
  const cached = lociCache.get(archetype);
  if (cached !== undefined) return cached;
  const loci = buildLoci(archetype);
  lociCache.set(archetype, loci);
  return loci;
}

function buildLoci(archetype: Archetype): readonly LocusDef[] {
  const environment: LocusDef =
    archetype.zone === 'T'
      ? {
          id: 'humidity',
          labelsZh: ['乾燥', '中濕', '潮濕', '飽和'],
          ordered: true,
          baseWeights: uniform(4),
        }
      : {
          id: 'salinity',
          labelsZh: ['低端狹鹽', '低端廣鹽', '高端廣鹽', '高端狹鹽'],
          ordered: true,
          baseWeights: uniform(4),
        };
  const common: LocusDef[] = [
    {
      id: 'size',
      labelsZh: ['微', '小', '中小', '中', '中大', '大', '巨'],
      ordered: true,
      baseWeights: SIZE_WEIGHTS,
    },
    {
      id: 'thermal',
      labelsZh: ['冷水', '溫帶', '廣溫', '暖水', '熱帶'],
      ordered: true,
      baseWeights: THERMAL_WEIGHTS,
    },
    environment,
    { id: 'ph', labelsZh: ['偏酸', '中性', '偏鹼'], ordered: true, baseWeights: ORDERED_THREE },
    {
      id: 'hardiness',
      labelsZh: ['嬌弱', '一般', '強健'],
      ordered: true,
      baseWeights: ORDERED_THREE,
    },
    { id: 'growth', labelsZh: ['快速', '均衡', '節能'], ordered: true, baseWeights: ORDERED_THREE },
    {
      id: 'lifespan',
      labelsZh: ['短命', '一般', '長壽'],
      ordered: true,
      baseWeights: ORDERED_THREE,
    },
    {
      id: 'mutation',
      labelsZh: MUTATIONS.map((mutation) => MUTATION_LABELS_ZH[mutation]),
      ordered: false,
      baseWeights: MUTATION_WEIGHTS,
    },
  ];
  if (archetype.kind === 'cohort') {
    return [
      ...common,
      { id: 'pigment', labelsZh: COHORT_PIGMENTS_ZH, ordered: false, baseWeights: uniform(12) },
      { id: 'pattern', labelsZh: PATTERNS_ZH, ordered: false, baseWeights: uniform(8) },
      {
        id: 'diet',
        labelsZh: archetype.diets.map(dietLabel),
        ordered: false,
        baseWeights: uniform(4),
      },
      { id: 'activity', labelsZh: ACTIVITIES_ZH, ordered: false, baseWeights: uniform(3) },
      {
        id: 'defense',
        labelsZh: archetype.defenses.map((set) => (set.length === 0 ? '無' : set.join('+'))),
        ordered: false,
        baseWeights: uniform(4),
      },
      { id: 'fecundity', labelsZh: FECUNDITIES_ZH, ordered: true, baseWeights: uniform(4) },
      {
        id: 'habitat',
        labelsZh: archetype.habitats.map((set) => set.join('+')),
        ordered: false,
        baseWeights: uniform(2),
      },
    ];
  }
  return [
    ...common,
    { id: 'pigment', labelsZh: BIOMASS_PIGMENTS_ZH, ordered: false, baseWeights: uniform(6) },
    { id: 'morphology', labelsZh: archetype.morphologies, ordered: false, baseWeights: uniform(8) },
    { id: 'metabolism', labelsZh: METABOLISMS_ZH, ordered: false, baseWeights: uniform(4) },
  ];
}

export function locusIndex(loci: readonly LocusDef[], id: LocusId): number {
  return loci.findIndex((locus) => locus.id === id);
}
