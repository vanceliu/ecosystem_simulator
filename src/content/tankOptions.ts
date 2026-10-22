import type { RealmCode } from './location';
import type { Sourced } from './sourced';

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
  /** g dry substrate per cm³ */
  readonly bulkDensity: Sourced;
  /** exchangeable NH4-N, mg per kg dry substrate, as bought */
  readonly exchangeableN: Sourced;
  /** plant-available P, mg per kg dry substrate, as bought */
  readonly exchangeableP: Sourced;
}

export interface FilterSpec {
  /** m² colonisable media surface */
  readonly mediaSurfaceM2: Sourced;
  /** 0–1 */
  readonly flow: Sourced;
}

export interface LandSubstrateSpec {
  /** g dry litter per m² in a bagged (clean) product */
  readonly initialLitterDryG: Sourced;
}
