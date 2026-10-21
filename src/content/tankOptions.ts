import type { LatitudeZone, RealmCode } from './location';
import { derived, estimated, measured, type Sourced } from './sourced';

export type SubstrateId = 'bare' | 'fine_sand' | 'gravel' | 'aquasoil' | 'mud';
/** reef_rock collected wild is "live rock"; clean reef_rock is "dry rock". */
export type HardscapeId = 'rock' | 'driftwood' | 'reef_rock';
export type FilterId = 'none' | 'sponge' | 'canister' | 'sump';
export type LandSubstrateId = 'soil_mix' | 'coco_fiber' | 'leaf_litter' | 'moss' | 'bark';

/** clean = bought and rinsed/boiled; wild = collected outdoors in `realm`. */
export type MaterialOrigin = 'clean' | 'wild';

export interface MaterialSource {
  readonly origin: MaterialOrigin;
  readonly realm: RealmCode;
}

export interface SubstrateSpec {
  /** m² colonisable surface per m² of water floor per cm depth */
  readonly surfacePerFloorPerCm: Sourced;
  /** added to the anoxic fraction */
  readonly anoxicBonus: Sourced;
}

export const SUBSTRATES: Readonly<Record<SubstrateId, SubstrateSpec>> = {
  bare: {
    surfacePerFloorPerCm: estimated(0, 'no substrate'),
    anoxicBonus: estimated(0, 'no substrate'),
  },
  fine_sand: {
    surfacePerFloorPerCm: estimated(1.0, 'grain surface reachable by biofilm'),
    anoxicBonus: estimated(0, 'docs/04 §4'),
  },
  gravel: {
    surfacePerFloorPerCm: estimated(0.4, 'coarse grains'),
    anoxicBonus: estimated(0, 'docs/04 §4'),
  },
  aquasoil: {
    surfacePerFloorPerCm: estimated(1.0, 'porous granules'),
    anoxicBonus: estimated(0, 'docs/04 §4'),
  },
  mud: {
    surfacePerFloorPerCm: estimated(1.0, 'fine sediment'),
    anoxicBonus: estimated(0.2, 'docs/04 §4'),
  },
};

/** docs/04 §4: wild substrate carries burrowing fauna and an established anoxic layer. */
export const WILD_SUBSTRATE_ANOXIC_BONUS = estimated(0.2, 'docs/04 §4 live sand');

/** m² colonisable surface per m² of water floor */
export const HARDSCAPE_SURFACE: Readonly<Record<HardscapeId, Sourced>> = {
  rock: estimated(1.0, 'rock faces'),
  driftwood: estimated(0.5, 'wood surface'),
  reef_rock: estimated(3.0, 'porous reef rock'),
};

export interface FilterSpec {
  /** m² colonisable media surface */
  readonly mediaSurfaceM2: Sourced;
  /** 0–1 */
  readonly flow: Sourced;
}

export const FILTERS: Readonly<Record<FilterId, FilterSpec>> = {
  none: { mediaSurfaceM2: estimated(0, 'no filter'), flow: estimated(0, 'no filter') },
  sponge: { mediaSurfaceM2: estimated(0.5, 'sponge filter'), flow: estimated(0.2, 'air-driven') },
  canister: {
    mediaSurfaceM2: estimated(2, 'canister with ceramic media'),
    flow: estimated(0.5, 'canister pump'),
  },
  sump: { mediaSurfaceM2: estimated(5, 'sump media chamber'), flow: estimated(0.7, 'return pump') },
};

export interface LandSubstrateSpec {
  /** g dry litter per m² in a bagged (clean) product */
  readonly initialLitterDryG: Sourced;
}

export const LAND_SUBSTRATES: Readonly<Record<LandSubstrateId, LandSubstrateSpec>> = {
  soil_mix: { initialLitterDryG: estimated(100, 'organic fraction of bioactive soil mix') },
  coco_fiber: { initialLitterDryG: estimated(80, 'coconut fibre') },
  leaf_litter: { initialLitterDryG: estimated(300, 'bagged dried leaf litter') },
  moss: { initialLitterDryG: estimated(50, 'moss mat') },
  bark: { initialLitterDryG: estimated(150, 'bark chips') },
};

/** Organic matter and microbes carried on wild-collected materials; docs/04 §5.2. */
export const WILD_MATERIALS = {
  /** mg COD per m² of submerged surface (periphyton, EPS, trapped detritus) */
  biofilmOrganicPerM2: derived(
    7100,
    'periphytonAfdm',
    '5 g/m² AFDM (midpoint of 2–10) × 1.42 COD/dry mass',
  ),
  /** cells per cm² of submerged surface */
  biofilmBacteriaPerCm2: derived(1e7, 'biofilmDensity', 'geometric mean of 10⁶–10⁸ cells/cm²'),
  /** fraction of biofilm bacteria that oxidise ammonia (the same share oxidises nitrite) */
  nitrifierShare: estimated(0.05, 'nitrifier share of a mature stream biofilm'),
  /** fraction of substrate biofilm bacteria that denitrify */
  denitrifierShare: estimated(0.02, 'facultative anaerobes in surface sediment'),
  /** cm of wild substrate whose surface carries organic biofilm */
  organicSubstrateDepthCm: estimated(1, 'only the oxic top layer accumulates periphyton'),
  /** cells per g of wild soil */
  soilBacteriaPerG: derived(3e8, 'soilBacteria', 'geometric mean of 10⁸–10⁹ cells/g'),
  /** g/cm³ */
  soilBulkDensity: estimated(0.8, 'organic-rich topsoil'),
  /** fungal biomass relative to bacterial biomass in wild soil */
  fungusToBacteriaRatio: estimated(0.5, 'temperate forest soil'),
} as const;

/** g dry litter per m² on a wild forest floor; docs/11 §6. */
export const WILD_LITTER_STOCK: Readonly<Record<LatitudeZone, Sourced>> = {
  tropical: estimated(275, 'dry tropical forest floor 150–400 g/m²', 'litterStockTropical'),
  subtropical: measured(367.5, 'litterStockSubtropical'),
  temperate: derived(650, 'litterStockTemperate', 'midpoint of deciduous 500–800 g/m²'),
  boreal: estimated(1000, 'slow decomposition accumulates thick litter'),
  polar: estimated(150, 'sparse tundra litter'),
};
