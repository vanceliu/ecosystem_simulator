import { computeGeometry } from './geometry';
import type { SimulationState } from './types';

/** First daytime misting hour; mists are spread over 12 daylight hours. */
const MIST_START_HOUR = 8;
const MIST_HUMIDITY_GAIN = 10;
const MIST_SOIL_GAIN = 0.05;
/** soil moisture gained per mm of rain on land */
const RAIN_SOIL_GAIN_PER_MM = 0.01;
const HUMIDITY_RATE_PER_TICK = 0.1;
const SOIL_RATE_PER_TICK = 0.02;
const AIR_TEMPERATURE_RATE_PER_TICK = 0.05;
/** docs/04 §4.1: daily runoff fractions from land to water */
export const RUNOFF_SOLUBLE_PER_DAY = 0.05;
export const RUNOFF_LITTER_PER_DAY = 0.01;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** docs/04 §4.1 */
export function targetHumidity(state: SimulationState): number {
  const config = state.config;
  if (config.placement === 'outdoor' && !config.lid) return state.climate.ambientHumidity;
  return clamp(
    40 + 45 * (1 - config.landFraction) + 5 * config.mistingPerDay + (config.lid ? 15 : 0),
    30,
    100,
  );
}

/** docs/04 §4.1 */
export function targetSoilMoisture(state: SimulationState): number {
  return clamp(
    0.3 + (0.4 * state.land.humidity) / 100 + (state.config.landFraction < 1 ? 0.1 : 0),
    0,
    1,
  );
}

export function isMistingHour(mistingPerDay: number, hour: number): boolean {
  if (mistingPerDay <= 0) return false;
  for (let index = 0; index < mistingPerDay; index += 1) {
    if (hour === MIST_START_HOUR + Math.floor((index * 12) / mistingPerDay)) return true;
  }
  return false;
}

export function updateLandClimate(
  state: SimulationState,
  hour: number,
  dtTicks: number,
  isFirstSubstep: boolean,
): void {
  if (computeGeometry(state.config).landAreaM2 <= 0) return;
  const land = state.land;
  const config = state.config;
  if (config.placement === 'outdoor') {
    land.airTemperatureC = state.climate.ambientTemperatureC;
  } else {
    land.airTemperatureC +=
      (config.roomTemperatureC - land.airTemperatureC) * AIR_TEMPERATURE_RATE_PER_TICK * dtTicks;
  }
  land.humidity += (targetHumidity(state) - land.humidity) * HUMIDITY_RATE_PER_TICK * dtTicks;
  land.soilMoisture +=
    (targetSoilMoisture(state) - land.soilMoisture) * SOIL_RATE_PER_TICK * dtTicks;
  if (config.placement === 'outdoor') {
    land.soilMoisture += (state.climate.rainTodayMm / 24) * RAIN_SOIL_GAIN_PER_MM * dtTicks;
  }
  if (isFirstSubstep && isMistingHour(config.mistingPerDay, hour)) {
    land.humidity += MIST_HUMIDITY_GAIN;
    land.soilMoisture += MIST_SOIL_GAIN;
  }
  land.humidity = clamp(land.humidity, 0, 100);
  land.soilMoisture = clamp(land.soilMoisture, 0, 1);
}

/** Moves soluble nutrients and litter from land to water; docs/04 §4.1. */
export function applyRunoff(state: SimulationState, dtDays: number): void {
  if (state.water.volumeL <= 0) return;
  const land = state.land;
  const water = state.water;
  const soluble = Math.min(1, RUNOFF_SOLUBLE_PER_DAY * dtDays);
  const tan = land.soilTan * soluble;
  const po4 = land.soilPo4 * soluble;
  land.soilTan -= tan;
  land.soilPo4 -= po4;
  water.tan += tan;
  water.po4 += po4;
  const litterFraction = Math.min(1, RUNOFF_LITTER_PER_DAY * dtDays);
  for (const element of ['cod', 'n', 'p'] as const) {
    const moved = land.litter[element] * litterFraction;
    land.litter[element] -= moved;
    water.detritus[element] += moved;
  }
}
