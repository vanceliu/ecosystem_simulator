/** Substance pools held in the simulation state, mg (ref_substance; docs/04 §3). */
export const STATE_SUBSTANCE_IDS = [
  'water_o2',
  'water_co2',
  'water_tan',
  'water_no2',
  'water_no3',
  'water_po4',
  'water_sio2',
  'water_ca',
  'sediment_tan',
  'sediment_po4',
  'water_alkalinity',
  'water_substrate',
  'soil_tan',
  'soil_po4',
  'soil_substrate',
  'food_cod',
  'food_n',
  'food_p',
  'detritus_cod',
  'detritus_n',
  'detritus_p',
  'inert_cod',
  'inert_n',
  'inert_p',
  'litter_cod',
  'litter_n',
  'litter_p',
  'water_salt',
] as const;

/** Per-substep accounts of mass leaving or entering across the tank boundary, mg. */
export const BOUNDARY_SUBSTANCE_IDS = [
  'out_n2',
  'out_n',
  'out_p',
  'meter_nitrified',
  'meter_fixed_n',
] as const;

export const SUBSTANCE_IDS = [...STATE_SUBSTANCE_IDS, ...BOUNDARY_SUBSTANCE_IDS] as const;

export type StateSubstanceId = (typeof STATE_SUBSTANCE_IDS)[number];
export type BoundarySubstanceId = (typeof BOUNDARY_SUBSTANCE_IDS)[number];
export type SubstanceId = StateSubstanceId | BoundarySubstanceId;

export type SubstanceMedium = 'water' | 'sediment' | 'land' | 'boundary';
export type SubstanceForm = 'dissolved' | 'particulate';
export type SubstanceElement = 'N' | 'P';

export interface SubstanceSpec {
  readonly id: SubstanceId;
  readonly nameZh: string;
  readonly medium: SubstanceMedium;
  /** null for boundary accounts */
  readonly form: SubstanceForm | null;
  readonly unit: string;
  /** element the mass is expressed as; null when not N or P */
  readonly element: SubstanceElement | null;
}

/** Organic matter pool expressed as COD with its nitrogen and phosphorus. */
export interface OrganicIds {
  readonly cod: StateSubstanceId;
  readonly n: StateSubstanceId;
  readonly p: StateSubstanceId;
}

export const FOOD: OrganicIds = { cod: 'food_cod', n: 'food_n', p: 'food_p' };
export const DETRITUS: OrganicIds = { cod: 'detritus_cod', n: 'detritus_n', p: 'detritus_p' };
export const INERT: OrganicIds = { cod: 'inert_cod', n: 'inert_n', p: 'inert_p' };
export const LITTER: OrganicIds = { cod: 'litter_cod', n: 'litter_n', p: 'litter_p' };
