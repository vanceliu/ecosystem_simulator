import { climateFor, evaporationProfile, type ClimateNormal } from '../content/climate';
import type { ParameterSet } from '../content/parameters';
import { lapseAdjustedTemperature } from './atmosphere';
import { clearSkyPpfd, dayLengthHours } from './astronomy';
import type { Rng } from './rng';
import type { LocationConfig } from './types';

export const DAYS_PER_YEAR = 365;
const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;

export interface DailyClimate {
  readonly dayOfYear: number;
  readonly meanTemperatureC: number;
  readonly dtr: number;
  readonly humidity: number;
  readonly monthlyPrecipMm: number;
  readonly wetSeason: boolean | null;
  readonly sunshine: number;
  readonly evaporationMmPerDay: number;
  readonly dayLengthH: number;
}

export function requireClimate(params: ParameterSet, location: LocationConfig): ClimateNormal {
  const normal = climateFor(
    params.climate,
    location.latitudeZone,
    location.moisture,
    location.continentality,
  );
  if (normal === undefined) {
    throw new Error(`No climate for ${location.latitudeZone} × ${location.moisture}`);
  }
  return normal;
}

/** Signed latitude: negative in the southern hemisphere. */
export function signedLatitude(location: LocationConfig): number {
  return location.hemisphere === 'south' ? -location.latitudeDeg : location.latitudeDeg;
}

/** Day of year → northern-hemisphere-equivalent month (1–12). */
export function equivalentMonth(dayOfYear: number, location: LocationConfig): number {
  const calendarMonth = Math.min(12, Math.floor((dayOfYear - 1) / DAYS_PER_MONTH) + 1);
  return location.hemisphere === 'south' ? ((calendarMonth + 5) % 12) + 1 : calendarMonth;
}

function monthMidDay(month: number): number {
  return (month - 0.5) * DAYS_PER_MONTH;
}

function seasonalTemperature(
  params: ParameterSet,
  normal: ClimateNormal,
  location: LocationConfig,
  dayOfYear: number,
): number {
  const centre = (normal.tWarm + normal.tCold) / 2;
  const amplitude = (normal.tWarm - normal.tCold) / 2;
  const warmDay =
    monthMidDay(normal.warmMonth) + (location.hemisphere === 'south' ? DAYS_PER_YEAR / 2 : 0);
  const seaLevelEquivalent =
    centre + amplitude * Math.cos((2 * Math.PI * (dayOfYear - warmDay)) / DAYS_PER_YEAR);
  return lapseAdjustedTemperature(
    params,
    seaLevelEquivalent,
    normal.stationElevationM,
    location.altitudeM,
  );
}

function monthlyPrecipitation(params: ParameterSet, normal: ClimateNormal, month: number): number {
  if (normal.wetMonths.length === 0) return normal.precipAnnualMm / 12;
  const wetShare = params.mechanics.climate.wetSeasonShare;
  const isWet = normal.wetMonths.includes(month);
  return isWet
    ? (normal.precipAnnualMm * wetShare) / normal.wetMonths.length
    : (normal.precipAnnualMm * (1 - wetShare)) / (12 - normal.wetMonths.length);
}

function humidity(
  params: ParameterSet,
  normal: ClimateNormal,
  location: LocationConfig,
  dayOfYear: number,
): number {
  const humidMonths = normal.humidMonths ?? normal.wetMonths;
  if (humidMonths.length === 0) return (normal.rhWet + normal.rhDry) / 2;
  let humidDays = 0;
  const transition = params.mechanics.climate.humidityTransitionDays;
  const window = 2 * transition + 1;
  for (let offset = -transition; offset <= transition; offset += 1) {
    const day = ((((dayOfYear - 1 + offset) % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR) + 1;
    if (humidMonths.includes(equivalentMonth(day, location))) humidDays += 1;
  }
  return normal.rhDry + ((normal.rhWet - normal.rhDry) * humidDays) / window;
}

/** docs/11 §4 */
export function dailyClimate(
  params: ParameterSet,
  location: LocationConfig,
  dayOfYear: number,
): DailyClimate {
  const normal = requireClimate(params, location);
  const sunshineFraction = params.climate.sunshineFraction;
  const month = equivalentMonth(dayOfYear, location);
  const meanTemperatureC = seasonalTemperature(params, normal, location, dayOfYear);
  const wetSeason = normal.wetMonths.length === 0 ? null : normal.wetMonths.includes(month);
  const sunshine =
    wetSeason === null
      ? sunshineFraction.evenRain.value
      : wetSeason
        ? sunshineFraction.wetSeason.value
        : sunshineFraction.drySeason.value;
  const evaporation = evaporationProfile(params.climate, location.latitudeZone, location.moisture);
  const warm = lapseAdjustedTemperature(
    params,
    normal.tWarm,
    normal.stationElevationM,
    location.altitudeM,
  );
  const cold = lapseAdjustedTemperature(
    params,
    normal.tCold,
    normal.stationElevationM,
    location.altitudeM,
  );
  const warmth =
    warm > cold ? Math.min(1, Math.max(0, (meanTemperatureC - cold) / (warm - cold))) : 1;
  return {
    dayOfYear,
    meanTemperatureC,
    dtr: normal.dtr,
    humidity: humidity(params, normal, location, dayOfYear),
    monthlyPrecipMm: monthlyPrecipitation(params, normal, month),
    wetSeason,
    sunshine,
    evaporationMmPerDay:
      evaporation.cold.value + (evaporation.warm.value - evaporation.cold.value) * warmth,
    dayLengthH: dayLengthHours(signedLatitude(location), dayOfYear),
  };
}

export function hourlyAmbientTemperature(
  params: ParameterSet,
  daily: DailyClimate,
  hour: number,
): number {
  const peak = params.mechanics.climate.peakTemperatureHour;
  return daily.meanTemperatureC + (daily.dtr / 2) * Math.cos((2 * Math.PI * (hour - peak)) / 24);
}

/** Daily rainfall draw, mm. */
export function drawRainfall(params: ParameterSet, daily: DailyClimate, rng: Rng): number {
  const expectedDaily = daily.monthlyPrecipMm / DAYS_PER_MONTH;
  const probability = Math.min(
    params.mechanics.climate.maxRainDayProbability,
    daily.monthlyPrecipMm / params.climate.rainDayDivisorMm.value,
  );
  if (probability <= 0) return 0;
  return rng.next() < probability ? expectedDaily / probability : 0;
}

export function naturalPpfd(
  params: ParameterSet,
  location: LocationConfig,
  daily: DailyClimate,
  hour: number,
): number {
  const clear = clearSkyPpfd(
    params,
    signedLatitude(location),
    daily.dayOfYear,
    hour,
    location.altitudeM,
  );
  return clear * (0.25 + 0.75 * daily.sunshine);
}

export function dayOfYearAt(startDayOfYear: number, tick: number): number {
  return ((startDayOfYear - 1 + Math.floor(tick / 24)) % DAYS_PER_YEAR) + 1;
}
