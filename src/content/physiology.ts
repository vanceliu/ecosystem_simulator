import type { FoodKind, MetabolicClass } from './archetype';
import { derived, estimated, measured, type Sourced } from './sourced';

/** Body elemental composition per dry mass (docs/04 §3.2). */
export interface BodyComposition {
  readonly nPerDryMass: Sourced;
  readonly pPerDryMass: Sourced;
}

export const BODY_COMPOSITION: Readonly<Record<MetabolicClass, BodyComposition>> = {
  bacterium: {
    nPerDryMass: derived(0.114, 'asm1', 'ASM1 biomass N 0.08 g/g COD × 1.42 COD/dry mass'),
    pPerDryMass: derived(0.022, 'cellFormula', 'C60H87O23N12P 0.0155 g P/g COD × 1.42'),
  },
  protist: {
    nPerDryMass: estimated(0.1, 'heterotroph N interquartile 8.2–11%', 'physiology_andrieux2020'),
    pPerDryMass: estimated(
      0.015,
      'heterotroph P interquartile 0.7–2.1%, fast growers high',
      'physiology_andrieux2020',
    ),
  },
  alga: {
    nPerDryMass: derived(
      0.075,
      'physiology_sheppard2023',
      'C:N 7.1 mol, C 45% of dry mass: 0.45 × 14/12 ÷ 7.1',
    ),
    pPerDryMass: derived(
      0.008,
      'physiology_sheppard2023',
      'between C:P 200 (0.0058) and Redfield 106 (0.011)',
    ),
  },
  plant: {
    nPerDryMass: measured(0.019, 'physiology_tian2017'),
    pPerDryMass: measured(0.0012, 'physiology_tian2017'),
  },
  fungus: {
    nPerDryMass: measured(0.037, 'physiology_zhangElser2017'),
    pPerDryMass: measured(0.0053, 'physiology_zhangElser2017'),
  },
  invertebrate: {
    nPerDryMass: measured(0.095, 'physiology_hessenLyche1991'),
    pPerDryMass: measured(0.01, 'physiology_hessenLyche1991'),
  },
  fish: {
    nPerDryMass: derived(0.105, 'physiology_hendrixson2007', 'midpoint of 9–12% N'),
    pPerDryMass: derived(0.03, 'physiology_hendrixson2007', 'midpoint of < 2 to > 4% P'),
  },
  amphibian: {
    nPerDryMass: measured(0.105, 'physiology_vertebrateStoichiometry2022'),
    pPerDryMass: measured(0.018, 'physiology_vertebrateStoichiometry2022'),
  },
  reptile: {
    nPerDryMass: measured(0.105, 'physiology_vertebrateStoichiometry2022'),
    pPerDryMass: measured(0.03, 'physiology_vertebrateStoichiometry2022'),
  },
};

export type ConsumerClass = 'protist' | 'invertebrate' | 'fish' | 'amphibian' | 'reptile';

/** r = r0 × M^exponent × Q10^((T−20)/10); r in d⁻¹ of body COD, M in mg dry mass (docs/04 §5.4). */
export interface MetabolicScaling {
  readonly r0: Sourced;
  readonly exponent: Sourced;
}

const VERTEBRATE_CHAIN =
  'mL O2/h × 1.429 × 24 ÷ (1.42 COD × 1000 × wet-to-dry), M_wet = M_dry ÷ (1000 × wet-to-dry)';

export const METABOLIC_SCALING: Readonly<Record<ConsumerClass, MetabolicScaling>> = {
  protist: {
    r0: derived(
      0.077,
      'physiology_makarieva2008',
      '25 W/kg dry at 25 °C ÷ 20 J/mL O2 × 1.429 mg/mL × Q10 0.707 ÷ 1.42',
    ),
    exponent: derived(0, 'physiology_makarieva2008', 'protist group means are mass-independent'),
  },
  invertebrate: {
    r0: derived(
      0.05,
      'physiology_makarieva2008',
      'aquatic invertebrates 1.3 W/kg (r0 0.041) to insects 2.9 W/kg (0.061) at 25 °C × 0.707',
    ),
    exponent: estimated(-0.25, 'docs/04 §5.4 quarter-power scaling'),
  },
  fish: {
    r0: derived(
      0.0181,
      'physiology_white2006',
      `0.091 M^0.879 at 20 °C, wet-to-dry 0.235; ${VERTEBRATE_CHAIN}`,
    ),
    exponent: derived(-0.121, 'physiology_white2006', '0.879 − 1'),
  },
  amphibian: {
    r0: derived(
      0.0177,
      'physiology_white2006',
      `0.081 M^0.884 at 20 °C, wet-to-dry 0.2046; ${VERTEBRATE_CHAIN}`,
    ),
    exponent: derived(-0.116, 'physiology_white2006', '0.884 − 1'),
  },
  reptile: {
    r0: derived(
      0.0363,
      'physiology_white2006',
      `0.110 M^0.768 at 20 °C, wet-to-dry 0.268; ${VERTEBRATE_CHAIN}`,
    ),
    exponent: derived(-0.232, 'physiology_white2006', '0.768 − 1'),
  },
};

export const METABOLIC_Q10 = estimated(
  2,
  'docs/04 §5.4; reptiles measured 2.44',
  'physiology_white2006',
);

/** Maximum ingestion as a multiple of maintenance respiration. */
export const MAX_INGESTION_MULTIPLIER: Readonly<Record<ConsumerClass, Sourced>> = {
  protist: estimated(
    40,
    'µmax ≈ 1.2 d⁻¹ ÷ growth efficiency 0.25 ÷ r 0.077',
    'physiology_makarieva2008',
  ),
  invertebrate: measured(8, 'physiology_nonaka2021'),
  fish: measured(4, 'physiology_nonaka2021'),
  amphibian: estimated(4, 'fish value applied to ectotherm vertebrates', 'physiology_nonaka2021'),
  reptile: estimated(4, 'fish value applied to ectotherm vertebrates', 'physiology_nonaka2021'),
};

export type FoodClass = 'detritus' | 'feed' | 'plant' | 'microbe' | 'animal';

export const FOOD_CLASS: Readonly<Record<FoodKind, FoodClass>> = {
  detritus: 'detritus',
  litter: 'detritus',
  carrion: 'detritus',
  food: 'feed',
  fruit: 'feed',
  doc: 'microbe',
  bacteria: 'microbe',
  biofilm: 'microbe',
  fungi: 'microbe',
  protozoa: 'microbe',
  phytoplankton: 'plant',
  periphyton: 'plant',
  plant: 'plant',
  macroalgae: 'plant',
  zooplankton: 'animal',
  aquatic_invertebrate: 'animal',
  terrestrial_invertebrate: 'animal',
  flying_insect: 'animal',
  mollusc: 'animal',
  crustacean: 'animal',
  echinoderm: 'animal',
  sessile_invertebrate: 'animal',
  fish: 'animal',
  egg: 'animal',
  amphibian: 'animal',
  reptile: 'animal',
};

/** Fraction of ingested COD assimilated (docs/04 §5.4). */
export const ASSIMILATION_EFFICIENCY: Readonly<Record<FoodClass, Sourced>> = {
  detritus: derived(
    0.15,
    'physiology_woodBalloniscus2012',
    'decomposed leaves ≈ 20% (isopods); Gammarus 11% (Bird 2012)',
  ),
  feed: estimated(0.8, 'formulated feed digestibility'),
  plant: measured(0.45, 'physiology_bioenergetic'),
  microbe: derived(0.6, 'physiology_amonHerndl1991', 'between bacterial absorption 26% and 71%'),
  animal: measured(0.85, 'physiology_bioenergetic'),
};

/** Exponent on scaled food density in the functional response (1 = Holling type II). */
export const FUNCTIONAL_RESPONSE_EXPONENT = measured(1.2, 'physiology_williamsMartinez2004');

/** Total food density at half-maximal ingestion: water mg COD/L, land mg COD/m². */
export const FOOD_HALF_SATURATION: Readonly<
  Record<FoodClass, { readonly water: Sourced; readonly land: Sourced }>
> = {
  detritus: {
    water: estimated(5, 'deposit feeding is near-linear in organic content'),
    land: estimated(50000, 'leaf litter and soil organic matter; near-linear response'),
  },
  feed: {
    water: estimated(1, 'uneaten feed'),
    land: estimated(1000, 'uneaten feed on land'),
  },
  plant: {
    water: derived(
      0.77,
      'physiology_mulderHendriks2013',
      'arthropods on algae 2.7 mg wet/L × 0.2 dry × 1.42',
    ),
    land: estimated(10000, 'plant tissue'),
  },
  microbe: {
    water: derived(1.48, 'physiology_mulderHendriks2013', 'rotifers 5.2 mg wet/L × 0.2 dry × 1.42'),
    land: estimated(5000, 'soil microbes and fungi'),
  },
  animal: {
    water: derived(
      0.48,
      'physiology_mulderHendriks2013',
      'fish on animal prey 1.7 mg wet/L × 0.2 dry × 1.42',
    ),
    land: derived(
      57,
      'physiology_mulderHendriks2013',
      'lizards on grasshoppers 200 mg wet/m² × 0.2 dry × 1.42',
    ),
  },
};

/** docs/04 §5.7 constant hazard of `negligible` senescence, d⁻¹ */
export const NEGLIGIBLE_SENESCENCE_HAZARD = derived(
  1.65e-5,
  'aquatic_small_lhHydra',
  'Hydra mortality 0.6% per year: −ln(1 − 0.006) / 365',
);

/** docs/04 §5.5 coral–zooxanthellae symbiosis */
export const CORAL_SYMBIOSIS = {
  /** photosynthate passed to the host at full symbiont density and light, d⁻¹ of host COD */
  photosynthatePerHostCod: derived(
    0.115,
    'physiology_tremblay2013',
    '61 µg C cm⁻² d⁻¹ translocated ÷ 371 µg host C at 25 °C ÷ 1.072^5',
  ),
  /** PAR above which symbionts are expelled, µmol·m⁻²·s⁻¹ */
  bleachingPpfd: estimated(
    600,
    '≈ 2 × summer saturating irradiance 228–534',
    'physiology_nitschke2018',
  ),
  /** mg Ca deposited as skeleton per mg host COD formed */
  calciumPerHostCod: estimated(2.8, 'skeleton ≈ 10 × tissue dry mass, 40% Ca in CaCO3, ÷ 1.42'),
} as const;

/** docs/04 §5.3 sediment nutrients and rooted uptake */
export const SEDIMENT = {
  /** share of the exchangeable pool dissolved in porewater */
  porewaterShare: derived(
    0.15,
    'physiology_barko1988',
    'porewater held < 15% of the exchangeable pool; upper bound',
  ),
  /** porewater volume per substrate volume */
  porosity: estimated(0.4, 'packed granular substrate'),
  /** d⁻¹, porewater ↔ water exchange of ammonium */
  exchangeTan: derived(
    0.05,
    'physiology_aqionDiffusion',
    'D0 1.71 cm²/d × tortuosity 0.5 ÷ (path 2.5 cm × depth 5 cm) = 0.07, checked against Barko 1988 losses',
  ),
  /** d⁻¹, porewater ↔ water exchange of phosphate */
  exchangePo4: derived(
    0.03,
    'physiology_aqionDiffusion',
    'D0 0.73 cm²/d × tortuosity 0.5 ÷ (path 2.5 cm × depth 5 cm)',
  ),
  /** root uptake share = A / (1 + B × (porewater / water)^C) / 100 */
  rootShareA: measured(99.8, 'physiology_carignan1982'),
  rootShareB: measured(2.66, 'physiology_carignan1982'),
  rootShareC: measured(-0.83, 'physiology_carignan1982'),
  /** mg P/L of porewater at half-maximal root uptake */
  rootHalfSatP: derived(
    0.13,
    'physiology_christiansen2016',
    'median elodeid root Km ≈ 4.3 µmol/L × 0.03097 mg/µmol',
  ),
  /** mg N/L of porewater at half-maximal root uptake */
  rootHalfSatN: estimated(0.3, 'no root NH4+ Km found; ≈ 20 µmol/L like phosphate'),
} as const;
