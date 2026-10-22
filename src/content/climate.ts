import type { Continentality, LatitudeZone, Moisture } from './location';
import type { ClimateParams } from './parameters';
import type { Sourced } from './sourced';
import type { SourceId } from './sources';

export type Provenance =
  | { readonly basis: 'measured'; readonly source: SourceId }
  | { readonly basis: 'estimated'; readonly note: string };

/** Months are northern-hemisphere equivalents (1 = January); southern locations shift by 6. */
export interface ClimateNormal {
  readonly koppen: string;
  readonly station: string;
  readonly stationElevationM: number;
  readonly tAnnual: number;
  readonly tWarm: number;
  readonly tCold: number;
  readonly warmMonth: number;
  readonly dtr: number;
  readonly rhWet: number;
  readonly rhDry: number;
  readonly precipAnnualMm: number;
  /** empty = precipitation spread evenly */
  readonly wetMonths: readonly number[];
  /** months using rhWet; defaults to wetMonths */
  readonly humidMonths?: readonly number[];
  readonly frostDays: number;
  readonly provenance: Provenance;
  readonly estimatedFields: readonly string[];
}

export interface EvaporationProfile {
  /** mm/day in the warmest month */
  readonly warm: Sourced;
  /** mm/day in the coldest month */
  readonly cold: Sourced;
}

/** Key of a climate normal; split by continentality where `continentalitySplit` lists it. */
export function climateKey(
  climate: ClimateParams,
  zone: LatitudeZone,
  moisture: Moisture,
  continentality: Continentality,
): string {
  const base = `${zone}:${moisture}`;
  return climate.continentalitySplit.includes(base) ? `${base}:${continentality}` : base;
}

/** docs/11 §2; combinations without a normal are not selectable. */
export function climateFor(
  climate: ClimateParams,
  zone: LatitudeZone,
  moisture: Moisture,
  continentality: Continentality,
): ClimateNormal | undefined {
  return climate.normals[climateKey(climate, zone, moisture, continentality)];
}

export function hasContinentality(
  climate: ClimateParams,
  zone: LatitudeZone,
  moisture: Moisture,
): boolean {
  return climate.continentalitySplit.includes(`${zone}:${moisture}`);
}

/** docs/11 §4 */
export function evaporationProfile(
  climate: ClimateParams,
  zone: LatitudeZone,
  moisture: Moisture,
): EvaporationProfile {
  if (moisture === 'arid') return climate.evaporation.arid;
  if (moisture === 'semiarid') return climate.evaporation.semiarid;
  return climate.evaporation[zone];
}
