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
