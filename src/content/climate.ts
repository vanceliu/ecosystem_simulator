import type { Continentality, LatitudeZone, Moisture } from './location';
import { derived, estimated, measured, type Sourced } from './sourced';
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

const STATION: Provenance = { basis: 'measured', source: 'stationNormals' };

type ClimateKey = `${LatitudeZone}:${Moisture}` | `${LatitudeZone}:${Moisture}:${Continentality}`;

/** docs/11 §2; combinations absent from this table are not selectable. */
export const CLIMATES: Readonly<Partial<Record<ClimateKey, ClimateNormal>>> = {
  'tropical:humid': {
    koppen: 'Af',
    station: 'Singapore',
    stationElevationM: 15,
    tAnnual: 27.8,
    tWarm: 28.6,
    tCold: 26.8,
    warmMonth: 5,
    dtr: 6.6,
    rhWet: 86,
    rhDry: 81,
    precipAnnualMm: 2113,
    wetMonths: [],
    frostDays: 0,
    provenance: STATION,
    estimatedFields: ['stationElevationM'],
  },
  'tropical:seasonal': {
    koppen: 'Aw',
    station: 'Darwin',
    stationElevationM: 30,
    tAnnual: 27.9,
    tWarm: 29.6,
    tCold: 25.2,
    warmMonth: 5,
    dtr: 9.1,
    rhWet: 70,
    rhDry: 40,
    precipAnnualMm: 1832,
    wetMonths: [6, 7, 8, 9],
    frostDays: 0,
    provenance: STATION,
    estimatedFields: ['tWarm', 'stationElevationM'],
  },
  'tropical:semiarid': {
    koppen: 'BSh',
    station: 'Niamey',
    stationElevationM: 207,
    tAnnual: 29.9,
    tWarm: 34.7,
    tCold: 24.6,
    warmMonth: 4,
    dtr: 13.3,
    rhWet: 65,
    rhDry: 25,
    precipAnnualMm: 554,
    wetMonths: [6, 7, 8, 9],
    frostDays: 0,
    provenance: STATION,
    estimatedFields: ['stationElevationM'],
  },
  'tropical:arid': {
    koppen: 'BWh',
    station: 'Khartoum',
    stationElevationM: 380,
    tAnnual: 30.4,
    tWarm: 35.0,
    tCold: 23.6,
    warmMonth: 5,
    dtr: 13.9,
    rhWet: 48,
    rhDry: 20,
    precipAnnualMm: 120,
    wetMonths: [7, 8, 9],
    frostDays: 0,
    provenance: STATION,
    estimatedFields: [],
  },
  'subtropical:humid': {
    koppen: 'Cfa',
    station: 'New Orleans',
    stationElevationM: 0,
    tAnnual: 21.4,
    tWarm: 28.9,
    tCold: 12.4,
    warmMonth: 8,
    dtr: 8.9,
    rhWet: 76,
    rhDry: 76,
    precipAnnualMm: 1609,
    wetMonths: [],
    frostDays: 5,
    provenance: STATION,
    estimatedFields: ['frostDays'],
  },
  'subtropical:seasonal': {
    koppen: 'Cwa',
    station: 'Hong Kong',
    stationElevationM: 32,
    tAnnual: 23.5,
    tWarm: 28.9,
    tCold: 16.5,
    warmMonth: 7,
    dtr: 4.4,
    rhWet: 82,
    rhDry: 71,
    precipAnnualMm: 2431,
    wetMonths: [5, 6, 7, 8, 9],
    frostDays: 0,
    provenance: STATION,
    estimatedFields: ['stationElevationM'],
  },
  'subtropical:mediterranean': {
    koppen: 'Csa',
    station: 'Perth',
    stationElevationM: 0,
    tAnnual: 19.0,
    tWarm: 25.1,
    tCold: 13.3,
    warmMonth: 8,
    dtr: 11.9,
    rhWet: 56,
    rhDry: 39,
    precipAnnualMm: 724,
    wetMonths: [11, 12, 1, 2],
    frostDays: 1,
    provenance: STATION,
    estimatedFields: ['frostDays'],
  },
  'subtropical:semiarid': {
    koppen: 'BSh',
    station: '—',
    stationElevationM: 0,
    tAnnual: 23.5,
    tWarm: 31.5,
    tCold: 15,
    warmMonth: 7,
    dtr: 13,
    rhWet: 50,
    rhDry: 25,
    precipAnnualMm: 375,
    wetMonths: [7, 8],
    frostDays: 2,
    provenance: {
      basis: 'estimated',
      note: 'interpolated between tropical BSh and subtropical BWh',
    },
    estimatedFields: [],
  },
  'subtropical:arid': {
    koppen: 'BWh',
    station: 'Riyadh',
    stationElevationM: 600,
    tAnnual: 26.9,
    tWarm: 36.9,
    tCold: 14.6,
    warmMonth: 8,
    dtr: 13.0,
    rhWet: 47,
    rhDry: 10,
    precipAnnualMm: 100,
    wetMonths: [1, 2, 3, 4],
    frostDays: 0,
    provenance: STATION,
    estimatedFields: [],
  },
  'temperate:humid:maritime': {
    koppen: 'Cfb',
    station: 'London',
    stationElevationM: 0,
    tAnnual: 12.0,
    tWarm: 18.9,
    tCold: 6.0,
    warmMonth: 7,
    dtr: 7.7,
    rhWet: 85,
    rhDry: 75,
    precipAnnualMm: 563,
    wetMonths: [],
    humidMonths: [10, 11, 12, 1, 2, 3],
    frostDays: 30,
    provenance: STATION,
    estimatedFields: ['rhWet', 'rhDry', 'frostDays'],
  },
  'temperate:humid:continental': {
    koppen: 'Dfb',
    station: 'Minneapolis',
    stationElevationM: 256,
    tAnnual: 8.3,
    tWarm: 23.5,
    tCold: -8.8,
    warmMonth: 7,
    dtr: 9.4,
    rhWet: 67.5,
    rhDry: 67.5,
    precipAnnualMm: 803,
    wetMonths: [5, 6, 7, 8],
    frostDays: 150,
    provenance: STATION,
    estimatedFields: ['stationElevationM', 'frostDays'],
  },
  'temperate:seasonal': {
    koppen: 'Dwa',
    station: 'Beijing',
    stationElevationM: 31,
    tAnnual: 13.3,
    tWarm: 27.2,
    tCold: -2.7,
    warmMonth: 7,
    dtr: 10.2,
    rhWet: 70,
    rhDry: 41.5,
    precipAnnualMm: 528,
    wetMonths: [6, 7, 8],
    frostDays: 120,
    provenance: STATION,
    estimatedFields: ['frostDays'],
  },
  'temperate:mediterranean': {
    koppen: 'Csa',
    station: 'Rome',
    stationElevationM: 20,
    tAnnual: 15.8,
    tWarm: 25.4,
    tCold: 7.5,
    warmMonth: 8,
    dtr: 10.1,
    rhWet: 75,
    rhDry: 64,
    precipAnnualMm: 752,
    wetMonths: [10, 11, 12],
    frostDays: 15,
    provenance: STATION,
    estimatedFields: ['stationElevationM', 'frostDays'],
  },
  'temperate:semiarid': {
    koppen: 'BSk',
    station: 'Astrakhan',
    stationElevationM: -25,
    tAnnual: 10.9,
    tWarm: 26.1,
    tCold: -3.6,
    warmMonth: 7,
    dtr: 10.2,
    rhWet: 85,
    rhDry: 58,
    precipAnnualMm: 231,
    wetMonths: [],
    humidMonths: [11, 12, 1, 2, 3],
    frostDays: 110,
    provenance: STATION,
    estimatedFields: ['frostDays'],
  },
  'temperate:arid': {
    koppen: 'BWk',
    station: 'Ashgabat',
    stationElevationM: 220,
    tAnnual: 17.5,
    tWarm: 31.7,
    tCold: 3.9,
    warmMonth: 7,
    dtr: 12.2,
    rhWet: 77.5,
    rhDry: 34,
    precipAnnualMm: 221,
    wetMonths: [12, 1, 2, 3, 4],
    frostDays: 50,
    provenance: STATION,
    estimatedFields: ['frostDays'],
  },
  'boreal:humid:maritime': {
    koppen: 'Dfc',
    station: 'Arkhangelsk',
    stationElevationM: 13,
    tAnnual: 1.9,
    tWarm: 16.5,
    tCold: -11.6,
    warmMonth: 7,
    dtr: 8.0,
    rhWet: 89,
    rhDry: 68,
    precipAnnualMm: 636,
    wetMonths: [7, 8, 9, 10],
    humidMonths: [10, 11, 12, 1, 2],
    frostDays: 190,
    provenance: STATION,
    estimatedFields: ['stationElevationM', 'humidMonths', 'frostDays'],
  },
  'boreal:humid:continental': {
    koppen: 'Dfc',
    station: 'Fairbanks',
    stationElevationM: 136,
    tAnnual: -2.1,
    tWarm: 17.2,
    tCold: -22.4,
    warmMonth: 7,
    dtr: 11.3,
    rhWet: 65,
    rhDry: 65,
    precipAnnualMm: 296,
    wetMonths: [6, 7, 8, 9],
    frostDays: 245,
    provenance: STATION,
    estimatedFields: ['stationElevationM', 'frostDays'],
  },
  'boreal:seasonal': {
    koppen: 'Dwc',
    station: '—',
    stationElevationM: 0,
    tAnnual: -3,
    tWarm: 16,
    tCold: -25,
    warmMonth: 7,
    dtr: 12,
    rhWet: 70,
    rhDry: 60,
    precipAnnualMm: 400,
    wetMonths: [6, 7, 8],
    frostDays: 230,
    provenance: { basis: 'estimated', note: 'no representative station retrieved' },
    estimatedFields: [],
  },
  'polar:humid': {
    koppen: 'ET',
    station: 'Utqiaġvik',
    stationElevationM: 9,
    tAnnual: -10.2,
    tWarm: 5.4,
    tCold: -24.4,
    warmMonth: 7,
    dtr: 6.1,
    rhWet: 89,
    rhDry: 72,
    precipAnnualMm: 137,
    wetMonths: [7, 8, 9],
    humidMonths: [6, 7, 8, 9],
    frostDays: 330,
    provenance: STATION,
    estimatedFields: ['stationElevationM'],
  },
  'polar:arid': {
    koppen: 'ET/EF',
    station: 'Eureka',
    stationElevationM: 10,
    tAnnual: -18.1,
    tWarm: 6.8,
    tCold: -36.8,
    warmMonth: 7,
    dtr: 6.6,
    rhWet: 70,
    rhDry: 70,
    precipAnnualMm: 78,
    wetMonths: [7, 8],
    frostDays: 340,
    provenance: STATION,
    estimatedFields: ['stationElevationM', 'frostDays'],
  },
};

const HAS_CONTINENTALITY: ReadonlySet<string> = new Set(['temperate:humid', 'boreal:humid']);

export function climateKey(
  zone: LatitudeZone,
  moisture: Moisture,
  continentality: Continentality,
): ClimateKey {
  const base = `${zone}:${moisture}` as const;
  return HAS_CONTINENTALITY.has(base) ? `${base}:${continentality}` : base;
}

export function climateFor(
  zone: LatitudeZone,
  moisture: Moisture,
  continentality: Continentality,
): ClimateNormal | undefined {
  return CLIMATES[climateKey(zone, moisture, continentality)];
}

export function hasContinentality(zone: LatitudeZone, moisture: Moisture): boolean {
  return HAS_CONTINENTALITY.has(`${zone}:${moisture}`);
}

export interface EvaporationProfile {
  /** mm/day in the warmest month */
  readonly warm: Sourced;
  /** mm/day in the coldest month */
  readonly cold: Sourced;
}

const EVAP_ARID: EvaporationProfile = {
  warm: measured(6.5, 'evaporationArid'),
  cold: estimated(2.0, 'cold-season desert evaporation'),
};
const EVAP_SEMIARID: EvaporationProfile = {
  warm: measured(4.4, 'evaporationSemiArid'),
  cold: estimated(2.0, 'cold-season semi-arid evaporation'),
};
const TROPICAL_EVAP = derived(
  5.0,
  'evaporationHumidTropics',
  'humid-tropics pan 4–10 mm/d × lake coefficient 0.75',
);
const EVAP_TROPICAL: EvaporationProfile = { warm: TROPICAL_EVAP, cold: TROPICAL_EVAP };

/** docs/11 §4 */
export function evaporationProfile(zone: LatitudeZone, moisture: Moisture): EvaporationProfile {
  if (moisture === 'arid') return EVAP_ARID;
  if (moisture === 'semiarid') return EVAP_SEMIARID;
  switch (zone) {
    case 'tropical':
      return EVAP_TROPICAL;
    case 'subtropical':
      return { warm: estimated(4, 'subtropical humid'), cold: estimated(2, 'subtropical winter') };
    case 'temperate':
      return { warm: estimated(3.5, 'temperate summer'), cold: estimated(0.5, 'temperate winter') };
    case 'boreal':
      return { warm: estimated(2.5, 'boreal summer'), cold: estimated(0, 'frozen surface') };
    case 'polar':
      return { warm: estimated(1, 'polar summer'), cold: estimated(0, 'frozen surface') };
  }
}

/** Fraction of possible sunshine; docs/11 §4. */
export const SUNSHINE_FRACTION = {
  wetSeason: estimated(0.4, 'cloudy rainy season'),
  drySeason: estimated(0.8, 'clear dry season'),
  evenRain: estimated(0.5, 'climates without a distinct rainy season'),
} as const;

/** Rain-day probability = min(0.9, monthly mm / this); docs/11 §4. */
export const RAIN_DAY_DIVISOR_MM = estimated(300, 'monthly rainfall at which most days are wet');
