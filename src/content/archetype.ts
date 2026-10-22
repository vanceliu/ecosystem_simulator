import type { ArchetypeId } from './archetypeIds';
import type { BodyComposition } from './physiology';
import type { Sourced } from './sourced';

export type Layer = 'L1-D' | 'L1-P' | 'L2' | 'L3' | 'L3-P' | 'L4' | 'L5' | 'L6';
/** W water, T land, A both */
export type Zone = 'W' | 'T' | 'A';
export type PopulationKind = 'biomass' | 'cohort';
export type SalinityClass = 'F' | 'B' | 'M';

export type Category =
  | 'bacteria'
  | 'fungi'
  | 'algae_plants'
  | 'protozoa'
  | 'rotifers'
  | 'crustaceans'
  | 'worms'
  | 'molluscs'
  | 'cnidarians'
  | 'sponges_tunicates'
  | 'echinoderms'
  | 'myriapods'
  | 'arachnids'
  | 'insects'
  | 'bony_fish'
  | 'cartilaginous_fish'
  | 'amphibians'
  | 'reptiles';

/** docs/02 §1 */
export type Vector =
  | 'background'
  | 'tap_water'
  | 'aged_water'
  | 'pond_water'
  | 'natural_seawater'
  | 'live_rock'
  | 'wild_rock'
  | 'live_sand'
  | 'plant'
  | 'driftwood'
  | 'open_inflow'
  | 'soil'
  | 'leaf_litter'
  | 'feeder_escape'
  | 'outside'
  | 'player_release'
  | 'mutation';

export type MetabolicClass =
  | 'bacterium'
  | 'protist'
  | 'alga'
  | 'plant'
  | 'fungus'
  | 'invertebrate'
  | 'fish'
  | 'amphibian'
  | 'reptile';

/** docs/09 §2 */
export type Senescence =
  | 'cell_turnover'
  | 'clonal_aging'
  | 'modular'
  | 'gompertz'
  | 'negligible'
  | 'semelparous'
  | 'metamorphosis_exit';

export type Recruitment = 'normal' | 'rare' | 'none';

export type ReproMode =
  | 'fission'
  | 'spores'
  | 'fragmentation'
  | 'budding'
  | 'parthenogenesis'
  | 'eggs'
  | 'brood'
  | 'livebearer';

export type TrophicMode =
  'photoautotroph' | 'chemoautotroph' | 'decomposer' | 'symbiont' | 'consumer';

export type FoodKind =
  | 'detritus'
  | 'food'
  | 'doc'
  | 'bacteria'
  | 'biofilm'
  | 'phytoplankton'
  | 'periphyton'
  | 'plant'
  | 'macroalgae'
  | 'fungi'
  | 'litter'
  | 'fruit'
  | 'protozoa'
  | 'zooplankton'
  | 'aquatic_invertebrate'
  | 'terrestrial_invertebrate'
  | 'flying_insect'
  | 'mollusc'
  | 'crustacean'
  | 'echinoderm'
  | 'sessile_invertebrate'
  | 'fish'
  | 'egg'
  | 'amphibian'
  | 'reptile'
  | 'carrion';

export type Habitat =
  | 'pelagic'
  | 'surface'
  | 'benthic'
  | 'infaunal'
  | 'epiphytic'
  | 'sessile'
  | 'crevice'
  | 'leaf_litter'
  | 'soil'
  | 'ground'
  | 'arboreal'
  | 'aerial'
  | 'burrow'
  | 'shore';

export type Defense =
  | 'shell'
  | 'spines'
  | 'toxin'
  | 'venom'
  | 'hiding'
  | 'schooling'
  | 'armor'
  | 'size'
  | 'burrowing'
  | 'camouflage'
  | 'autotomy'
  | 'mucus';

export type Flag =
  | 'photosynthetic'
  | 'chemoautotroph'
  | 'nitrogen_fixer'
  | 'symbiont_host'
  | 'calcifier'
  | 'medication_resistant'
  | 'metamorphosis_exit'
  | 'cannibal'
  | 'air_breather'
  | 'needs_uvb'
  | 'needs_basking'
  | 'territorial'
  | 'escapes_open_lid'
  | 'needs_land'
  | 'needs_water_to_breed';

export type DensityUnit =
  | 'cells_per_mL'
  | 'cells_per_cm2'
  | 'cells_per_g_soil'
  | 'mg_chl_a_per_m2'
  | 'g_dry_per_m2'
  | 'cover_percent'
  | 'individuals_per_L'
  | 'individuals_per_m2'
  | 'individuals_per_100L'
  | 'individuals_per_enclosure';

/** food kind → preference weight; weights sum to 1 */
export type DietProfile = Readonly<Partial<Record<FoodKind, number>>>;

export interface SourcedRange {
  readonly min: Sourced;
  readonly max: Sourced;
}

/** Facts taken verbatim from docs/02; generated, not hand-edited. */
export interface ArchetypeSkeleton {
  readonly id: ArchetypeId;
  readonly nameZh: string;
  readonly layer: Layer;
  readonly zone: Zone;
  readonly kind: PopulationKind;
  readonly category: Category;
  readonly metabolicClass: MetabolicClass;
  /** empty for land-only groups */
  readonly salinityClasses: readonly SalinityClass[];
  readonly vectors: readonly Vector[];
}

export interface ToleranceData {
  readonly temperatureC: SourcedRange;
  /** required when zone is W or A */
  readonly salinityPpt?: SourcedRange;
  readonly ph: SourcedRange;
  /** free NH3 as mg NH3-N/L (engine: TAN × free fraction); acute-only data use LC50 × 0.1 */
  readonly nh3MaxMgL?: Sourced;
  /** mg NO2-N/L */
  readonly no2MaxMgL?: Sourced;
  readonly o2MinMgL?: Sourced;
  /** required when zone is T or A */
  readonly humidityMinPercent?: Sourced;
}

export interface LifeHistoryData {
  /** docs/09: individual (cohort) or cell/module (biomass) lifespan */
  readonly lifespanDays: {
    readonly min: Sourced;
    readonly typLow: Sourced;
    readonly typHigh: Sourced;
    readonly max: Sourced;
  };
  /** docs/09 遊戲上限; ≥ typHigh */
  readonly gameCapDays: Sourced;
  /** cohort: age at maturity; biomass: generation/doubling time */
  readonly maturityDays: SourcedRange;
  readonly reproduction: {
    readonly mode: ReproMode;
    /** offspring per reproductive event (cohort) */
    readonly clutch?: SourcedRange;
    readonly intervalDays?: SourcedRange;
  };
  readonly senescence: Senescence;
  readonly recruitment: Recruitment;
  /** modular: module (polyp, shoot, hypha, zooid) lifespan */
  readonly moduleLifespanDays?: Sourced;
  /** clonal_aging: generations before clonal collapse */
  readonly clonalMaxGenerations?: SourcedRange;
  /** metamorphosis_exit: days in the aquatic stage */
  readonly aquaticStageDays?: SourcedRange;
}

export interface MinEnclosure {
  readonly lengthCm?: Sourced;
  readonly waterVolumeL?: Sourced;
  readonly landAreaM2?: Sourced;
  readonly heightCm?: Sourced;
  /** adults per minimum enclosure */
  readonly adultsPerEnclosure?: Sourced;
}

interface ArchetypeDataBase {
  /** Latin stem for genus names, e.g. 'Cyclo' (docs/05 §4.1) */
  readonly latinStem: string;
  /** Chinese common-name noun, e.g. '劍水蚤' (docs/05 §4.2) */
  readonly nounZh: string;
  readonly flags: readonly Flag[];
  readonly extraVectors?: readonly Vector[];
  /** adult (cohort) or cell/module (biomass) dry mass range, mg; mapped onto the size locus */
  readonly massMg: SourcedRange;
  /** typical adult length for enclosure scaling (docs/09 §7) */
  readonly typicalLengthMm: Sourced;
  readonly tolerance: ToleranceData;
  readonly lifeHistory: LifeHistoryData;
  readonly density: {
    readonly typical: SourcedRange;
    readonly max: Sourced;
    readonly unit: DensityUnit;
  };
  readonly minEnclosure?: MinEnclosure;
  /** overrides the metabolic-class body composition */
  readonly bodyComposition?: BodyComposition;
}

export interface CohortData extends ArchetypeDataBase {
  readonly kind: 'cohort';
  /** four alternatives for the diet locus (docs/05 §2.2) */
  readonly diets: readonly [DietProfile, DietProfile, DietProfile, DietProfile];
  /** prey : predator body-mass ratio for animal prey */
  readonly preySizeRatio?: { readonly min: number; readonly opt: number; readonly max: number };
  /** four alternatives for the defense locus */
  readonly defenses: readonly [
    readonly Defense[],
    readonly Defense[],
    readonly Defense[],
    readonly Defense[],
  ];
  /** two alternatives for the habitat locus */
  readonly habitats: readonly [readonly Habitat[], readonly Habitat[]];
}

/** Where a biomass population lives; sets its capacity and the pools it exchanges with. */
export type BiomassNiche =
  'water_column' | 'surface' | 'sediment' | 'water_floor' | 'land' | 'soil' | 'host';

/** Growth kinetics at 20 °C (docs/04 §5.2–5.3). */
export interface BiomassKinetics {
  /** d⁻¹ */
  readonly muMax: Sourced;
  readonly halfSat: {
    /** mg/L of the growth substrate: COD (decomposers), N (nitrifiers) */
    readonly substrate?: Sourced;
    /** mg O2/L */
    readonly o2?: Sourced;
    /** mg N/L of TAN + NO3 */
    readonly nitrogen?: Sourced;
    /** mg P/L */
    readonly phosphorus?: Sourced;
    /** mg SiO2/L */
    readonly silicate?: Sourced;
    /** mg CO2/L */
    readonly co2?: Sourced;
    /** mg COD/L of prey biomass (biomass-type consumers) */
    readonly prey?: Sourced;
  };
  /** g biomass COD per g substrate (COD or N) or per g prey COD */
  readonly yieldCoefficient?: Sourced;
  /** d⁻¹; basal loss of groups whose lifespan is a division interval (clonal_aging) */
  readonly lossRate?: Sourced;
  /** d⁻¹; extra loss of biomass-type consumers without food, scaled by unmet intake */
  readonly starvationLoss?: Sourced;
  /** d⁻¹ as a fraction of muMax; photoautotroph respiration in darkness */
  readonly darkRespiration?: Sourced;
  /** microbes: full rate between min and max, linear to zero at tolerance.ph */
  readonly phOptimum?: SourcedRange;
}

export interface BiomassData extends ArchetypeDataBase {
  readonly kind: 'biomass';
  readonly trophicMode: TrophicMode;
  readonly niche: BiomassNiche;
  readonly kinetics: BiomassKinetics;
  /** biomass-type consumers: food kinds grazed */
  readonly prey?: readonly FoodKind[];
  /** eight alternatives for the morphology locus, Chinese labels */
  readonly morphologies: readonly [string, string, string, string, string, string, string, string];
  /** what the 'specialised' metabolism allele means for this group */
  readonly specialisedMetabolism: string;
  /** photosynthetic groups: µmol·m⁻²·s⁻¹ */
  readonly light?: { readonly halfSaturation: Sourced; readonly optimum: Sourced };
}

export type ArchetypeData = CohortData | BiomassData;

export type Archetype = ArchetypeSkeleton & ArchetypeData;
