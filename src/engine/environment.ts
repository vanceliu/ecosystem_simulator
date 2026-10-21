import { STOICHIOMETRY } from '../content/stoichiometry';
import {
  CO2_EQUILIBRIUM_MG_L,
  carbonatePh,
  freeAmmoniaFraction,
  oxygenSaturation,
  pressureAtm,
} from './atmosphere';
import { FILTERS } from '../content/tankOptions';
import type { SimulationState } from './types';

const HEATER_RATE_PER_TICK = 0.2;
const PASSIVE_RATE_PER_TICK = 0.05;
const KLA_BASE = 0.02;
const KLA_AERATION = 0.2;
const KLA_FLOW = 0.1;
/** docs/11 §7: gas transfer under ice ≈ 5% of open water */
export const ICE_GAS_TRANSFER_FACTOR = 0.05;
/** docs/11 §7: outdoor water time constant = 3 + 0.1 × depth (cm) days */
const OUTDOOR_TAU_BASE_DAYS = 3;
const OUTDOOR_TAU_PER_CM = 0.1;

export function salinityPpt(state: SimulationState): number {
  const volume = state.water.volumeL;
  return volume > 0 ? state.water.saltMg / 1000 / volume : 0;
}

export function khDkh(state: SimulationState): number {
  const volume = state.water.volumeL;
  return volume > 0 ? state.water.alkalinityMg / STOICHIOMETRY.caco3PerDkh.value / volume : 0;
}

export function waterPh(state: SimulationState): number {
  const volume = state.water.volumeL;
  if (volume <= 0) return 7;
  return carbonatePh(khDkh(state), state.water.co2 / volume);
}

export function o2SaturationMgL(state: SimulationState): number {
  return oxygenSaturation(
    state.water.temperatureC,
    salinityPpt(state),
    pressureAtm(state.config.location.altitudeM),
  );
}

export function freeAmmoniaMgL(state: SimulationState): number {
  const volume = state.water.volumeL;
  if (volume <= 0) return 0;
  return (state.water.tan / volume) * freeAmmoniaFraction(state.water.temperatureC, waterPh(state));
}

/** docs/04 §4 and docs/11 §7 */
export function updateWaterTemperature(state: SimulationState, dtTicks: number): void {
  const water = state.water;
  if (water.volumeL <= 0) return;
  const config = state.config;
  if (config.placement === 'outdoor') {
    const tauDays = OUTDOOR_TAU_BASE_DAYS + OUTDOOR_TAU_PER_CM * config.waterDepthCm;
    water.temperatureC +=
      ((state.climate.ambientDayMeanC - water.temperatureC) * dtTicks) / (tauDays * 24);
  } else if (config.heaterSetpointC === null) {
    water.temperatureC +=
      (config.roomTemperatureC - water.temperatureC) * PASSIVE_RATE_PER_TICK * dtTicks;
  }
  if (config.heaterSetpointC !== null && water.temperatureC < config.heaterSetpointC) {
    water.temperatureC +=
      (config.heaterSetpointC - water.temperatureC) * HEATER_RATE_PER_TICK * dtTicks;
  }
  if (config.placement === 'outdoor') {
    if (water.temperatureC <= 0 && state.climate.ambientDayMeanC < 0) water.iceCover = true;
    if (water.iceCover && state.climate.ambientDayMeanC > 0) water.iceCover = false;
    if (!water.iceCover) water.snowOnIce = false;
  }
  water.temperatureC = Math.max(0, water.temperatureC);
}

/** docs/04 §4 gas exchange toward air saturation. */
export function exchangeGases(state: SimulationState, dtTicks: number): void {
  const water = state.water;
  const volume = water.volumeL;
  if (volume <= 0) return;
  const flow = FILTERS[state.config.filter].flow.value;
  const kla =
    (KLA_BASE + KLA_AERATION * state.config.aeration + KLA_FLOW * flow) *
    (water.iceCover ? ICE_GAS_TRANSFER_FACTOR : 1);
  const fraction = Math.min(1, kla * dtTicks);
  water.o2 += (o2SaturationMgL(state) * volume - water.o2) * fraction;
  water.co2 += (CO2_EQUILIBRIUM_MG_L * volume - water.co2) * fraction;
}

/** Lamp or natural PPFD at the water surface for the current hour. */
export function lampPpfd(state: SimulationState, hour: number): number {
  const config = state.config;
  const photoperiod = config.seasonalLighting ? state.climate.dayLengthH : config.photoperiodH;
  const on = 12 - photoperiod / 2;
  const off = 12 + photoperiod / 2;
  return hour + 0.5 >= on && hour + 0.5 < off ? config.lightPpfd : 0;
}
