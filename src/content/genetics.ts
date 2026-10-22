import type { Defense, FoodKind } from './archetype';

type Numbers<K extends string> = Readonly<Record<K, number>>;
type Table = readonly number[];

/** Alleles of one locus: labels define the allele count; archetype-defined loci have none. */
export interface LocusSpec {
  readonly labelsZh?: readonly string[];
  readonly ordered: boolean;
  readonly baseWeights: Table;
}

export type LocusKey =
  | 'size'
  | 'thermal'
  | 'salinity'
  | 'humidity'
  | 'ph'
  | 'hardiness'
  | 'growth'
  | 'lifespan'
  | 'mutation'
  | 'cohortPigment'
  | 'pattern'
  | 'diet'
  | 'activity'
  | 'defense'
  | 'fecundity'
  | 'habitat'
  | 'biomassPigment'
  | 'morphology'
  | 'metabolism';

/** Genotype-to-phenotype tables (ref_param `generation.*`; docs/05). */
export interface GenerationParams {
  readonly loci: Readonly<Record<LocusKey, LocusSpec>>;
  readonly phenotype: Numbers<
    | 'eurythermalAllele'
    | 'eurythermalWidth'
    | 'speciesThermalShare'
    | 'thermalEdgeShare'
    | 'salinityCeilingPpt'
    | 'phOptMargin'
    | 'specialisedMetabolism'
    | 'mimicryPattern'
    | 'mimicryExposure'
    | 'eggMassFraction'
    | 'maxReproductiveFraction'
    | 'shellGrowth'
    | 'toxinMetabolism'
    | 'jitter'
    | 'typicalCapShare'
    | 'maxOverTypicalMin'
  > &
    Readonly<
      Record<
        | 'thermalOptC'
        | 'salinityWidth'
        | 'humidityOffset'
        | 'phOpt'
        | 'hardinessToxin'
        | 'hardinessOxygen'
        | 'hardinessGrowth'
        | 'growthRate'
        | 'growthAssimilation'
        | 'fecundityClutch'
        | 'fecundityEgg'
        | 'fecunditySurvival'
        | 'metabolismHalfSat'
        | 'metabolismRate'
        | 'pigmentLightHalfSaturation'
        | 'pigmentLightOptimum',
        Table
      >
    > & {
      readonly humidityMinPercent: Numbers<'min' | 'max'>;
      readonly mutationEffect: Numbers<
        | 'albinoExposure'
        | 'albinoPhotosynthesis'
        | 'melanisticExposure'
        | 'melanisticThermalShift'
        | 'gigantismMass'
        | 'gigantismLifespan'
        | 'gigantismClutch'
        | 'dwarfismMass'
        | 'dwarfismLifespan'
        | 'dwarfismMaturity'
        | 'glowAttack'
        | 'glowExposure'
        | 'longevityLifespan'
        | 'longevityGrowth'
        | 'fecundityClutch'
        | 'fecunditySurvival'
        | 'eurythermalWidth'
        | 'euryhalineExpansion'
      >;
    };
  readonly mutation: Numbers<'mutationLocusShare' | 'twoLociShare' | 'revertShare'>;
  readonly rarity: Numbers<'uncommonFrom' | 'rareFrom' | 'legendaryFrom'>;
  readonly gompertz: Numbers<'survivalAtTypical' | 'survivalAtMax'>;
  readonly sampling: Numbers<'minEnvironmentFactor'>;
  readonly tolerance: Numbers<'salinityRampShare' | 'phPlateau'>;
}

/** Species naming vocabulary (ref_param `naming.*`; docs/05 §4). */
export interface NamingParams {
  readonly genusLinks: readonly string[];
  readonly sizeSyllables: readonly string[];
  readonly cohortSuffixes: readonly string[];
  readonly biomassSuffixes: readonly string[];
  readonly consonants: readonly string[];
  readonly vowels: readonly string[];
  readonly epithetSyllables: Numbers<'cohort' | 'biomass'>;
  readonly neuterSuffixes: readonly string[];
  readonly masculineSuffixes: readonly string[];
  readonly varietyNames: readonly string[];
  readonly mutationModifierZh: readonly string[];
  readonly cohortPigmentModifierZh: readonly string[];
  readonly patternModifierZh: readonly string[];
  readonly biomassPigmentModifierZh: readonly string[];
  readonly defenseModifierZh: Readonly<Partial<Record<Defense, string>>>;
  readonly maxModifiers: number;
  readonly modifierZh: Readonly<
    Record<'smallest' | 'largest' | 'nocturnal' | 'cold' | 'hot', string>
  >;
  readonly dietPreferZh: string;
  readonly dietNoneZh: string;
  readonly defenseNoneZh: string;
  readonly foodZh: Readonly<Record<FoodKind, string>>;
  readonly rarityZh: Readonly<Record<'common' | 'uncommon' | 'rare' | 'legendary', string>>;
}
