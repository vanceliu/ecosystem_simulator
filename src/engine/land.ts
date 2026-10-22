import type { ParameterSet } from '../content/parameters';
import { LITTER, DETRITUS } from '../content/substances';
import { computeGeometry } from './geometry';
import type { SimulationState } from './types';

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

/** Mists are spread over 12 daylight hours from the first misting hour. */
export function isMistingHour(startHour: number, mistingPerDay: number, hour: number): boolean {
  if (mistingPerDay <= 0) return false;
  for (let index = 0; index < mistingPerDay; index += 1) {
    if (hour === startHour + Math.floor((index * 12) / mistingPerDay)) return true;
  }
  return false;
}

export function updateLandClimate(
  params: ParameterSet,
  state: SimulationState,
  hour: number,
  dtTicks: number,
  isFirstSubstep: boolean,
): void {
  if (computeGeometry(params, state.config).landAreaM2 <= 0) return;
  const land = state.land;
  const config = state.config;
  const rates = params.mechanics.land;
  if (config.placement === 'outdoor') {
    land.airTemperatureC = state.climate.ambientTemperatureC;
  } else {
    land.airTemperatureC +=
      (config.roomTemperatureC - land.airTemperatureC) * rates.airTemperatureRatePerTick * dtTicks;
  }
  land.humidity += (targetHumidity(state) - land.humidity) * rates.humidityRatePerTick * dtTicks;
  land.soilMoisture +=
    (targetSoilMoisture(state) - land.soilMoisture) * rates.soilRatePerTick * dtTicks;
  if (config.placement === 'outdoor') {
    land.soilMoisture += (state.climate.rainTodayMm / 24) * rates.rainSoilGainPerMm * dtTicks;
  }
  if (isFirstSubstep && isMistingHour(rates.mistStartHour, config.mistingPerDay, hour)) {
    land.humidity += rates.mistHumidityGain;
    land.soilMoisture += rates.mistSoilGain;
  }
  land.humidity = clamp(land.humidity, 0, 100);
  land.soilMoisture = clamp(land.soilMoisture, 0, 1);
}

/** Moves soluble nutrients and litter from land to water; docs/04 §4.1. */
export function applyRunoff(params: ParameterSet, state: SimulationState, dtDays: number): void {
  if (state.water.volumeL <= 0) return;
  const substances = state.substances;
  const rates = params.mechanics.land;
  const soluble = Math.min(1, rates.runoffSolublePerDay * dtDays);
  const tan = substances.soil_tan * soluble;
  const po4 = substances.soil_po4 * soluble;
  substances.soil_tan -= tan;
  substances.soil_po4 -= po4;
  substances.water_tan += tan;
  substances.water_po4 += po4;
  const litterFraction = Math.min(1, rates.runoffLitterPerDay * dtDays);
  for (const element of ['cod', 'n', 'p'] as const) {
    const moved = substances[LITTER[element]] * litterFraction;
    substances[LITTER[element]] -= moved;
    substances[DETRITUS[element]] += moved;
  }
}
