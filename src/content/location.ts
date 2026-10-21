export type Hemisphere = 'north' | 'south';
export type LatitudeZone = 'tropical' | 'subtropical' | 'temperate' | 'boreal' | 'polar';
export type AltitudeBand = 'lowland' | 'hill' | 'montane' | 'alpine';
export type Moisture = 'humid' | 'seasonal' | 'mediterranean' | 'semiarid' | 'arid';
export type Continentality = 'maritime' | 'continental';
export type RealmCode = 'NA' | 'NT' | 'PA' | 'AT' | 'IM' | 'AU' | 'OC' | 'AN';
export type OceanRegion = 'IP' | 'ATL' | 'EP' | 'SO';

export const LATITUDE_ZONES: readonly LatitudeZone[] = [
  'tropical',
  'subtropical',
  'temperate',
  'boreal',
  'polar',
];
export const ALTITUDE_BANDS: readonly AltitudeBand[] = ['lowland', 'hill', 'montane', 'alpine'];
export const MOISTURES: readonly Moisture[] = [
  'humid',
  'seasonal',
  'mediterranean',
  'semiarid',
  'arid',
];

/** docs/11 §1 */
export const LATITUDE_RANGE: Readonly<
  Record<LatitudeZone, { min: number; max: number; representative: number }>
> = {
  tropical: { min: 0, max: 23.5, representative: 10 },
  subtropical: { min: 23.5, max: 35, representative: 28 },
  temperate: { min: 35, max: 55, representative: 45 },
  boreal: { min: 55, max: 66.5, representative: 62 },
  polar: { min: 66.5, max: 90, representative: 72 },
};

/** docs/11 §1 */
export const ALTITUDE_RANGE: Readonly<
  Record<AltitudeBand, { min: number; max: number; representative: number }>
> = {
  lowland: { min: 0, max: 300, representative: 100 },
  hill: { min: 300, max: 1000, representative: 600 },
  montane: { min: 1000, max: 2500, representative: 1800 },
  alpine: { min: 2500, max: 5000, representative: 3500 },
};

/** docs/11 §6.1 */
export const REALM_OCEANS: Readonly<Record<RealmCode, readonly OceanRegion[]>> = {
  NA: ['ATL', 'EP'],
  NT: ['ATL', 'EP'],
  PA: ['ATL', 'IP'],
  AT: ['ATL', 'IP'],
  IM: ['IP'],
  AU: ['IP'],
  OC: ['IP', 'EP'],
  AN: ['SO'],
};
