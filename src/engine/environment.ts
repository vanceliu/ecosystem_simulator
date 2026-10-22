import type { ParameterSet } from '../content/parameters';
import { carbonatePh, freeAmmoniaFraction, oxygenSaturation, pressureAtm } from './atmosphere';
import type { SimulationState } from './types';

export function salinityPpt(state: SimulationState): number {
  const volume = state.water.volumeL;
  return volume > 0 ? state.substances.water_salt / 1000 / volume : 0;
}

export function khDkh(params: ParameterSet, state: SimulationState): number {
  const volume = state.water.volumeL;
  return volume > 0
    ? state.substances.water_alkalinity / params.stoichiometry.base.caco3PerDkh.value / volume
    : 0;
}

export function waterPh(params: ParameterSet, state: SimulationState): number {
  const volume = state.water.volumeL;
  if (volume <= 0) return 7;
  return carbonatePh(params, khDkh(params, state), state.substances.water_co2 / volume);
}

export function o2SaturationMgL(state: SimulationState): number {
  return oxygenSaturation(
    state.water.temperatureC,
    salinityPpt(state),
    pressureAtm(state.config.location.altitudeM),
  );
}

export function freeAmmoniaMgL(params: ParameterSet, state: SimulationState): number {
  const volume = state.water.volumeL;
  if (volume <= 0) return 0;
  return (
    (state.substances.water_tan / volume) *
    freeAmmoniaFraction(state.water.temperatureC, waterPh(params, state))
  );
}

/** docs/04 §4 and docs/11 §7 */
export function updateWaterTemperature(
  params: ParameterSet,
  state: SimulationState,
  dtTicks: number,
): void {
  const water = state.water;
  if (water.volumeL <= 0) return;
  const config = state.config;
  const rates = params.mechanics.water;
  if (config.placement === 'outdoor') {
    const tauDays = rates.outdoorTauBaseDays + rates.outdoorTauPerCm * config.waterDepthCm;
    water.temperatureC +=
      ((state.climate.ambientDayMeanC - water.temperatureC) * dtTicks) / (tauDays * 24);
  } else if (config.heaterSetpointC === null) {
    water.temperatureC +=
      (config.roomTemperatureC - water.temperatureC) * rates.passiveRatePerTick * dtTicks;
  }
  if (config.heaterSetpointC !== null && water.temperatureC < config.heaterSetpointC) {
    water.temperatureC +=
      (config.heaterSetpointC - water.temperatureC) * rates.heaterRatePerTick * dtTicks;
  }
  if (config.placement === 'outdoor') {
    if (water.temperatureC <= 0 && state.climate.ambientDayMeanC < 0) water.iceCover = true;
    if (water.iceCover && state.climate.ambientDayMeanC > 0) water.iceCover = false;
    if (!water.iceCover) water.snowOnIce = false;
  }
  water.temperatureC = Math.max(0, water.temperatureC);
}

/** docs/04 §4 gas exchange toward air saturation. */
export function exchangeGases(params: ParameterSet, state: SimulationState, dtTicks: number): void {
  const water = state.water;
  const substances = state.substances;
  const volume = water.volumeL;
  if (volume <= 0) return;
  const flow = params.tankOptions.filters[state.config.filter].flow.value;
  const rates = params.mechanics.water;
  const kla =
    (rates.klaBase + rates.klaAeration * state.config.aeration + rates.klaFlow * flow) *
    (water.iceCover ? rates.iceGasTransferFactor : 1);
  const fraction = Math.min(1, kla * dtTicks);
  substances.water_o2 += (o2SaturationMgL(state) * volume - substances.water_o2) * fraction;
  substances.water_co2 +=
    (params.physics.co2EquilibriumMgL.value * volume - substances.water_co2) * fraction;
}

/** Lamp or natural PPFD at the water surface for the current hour. */
export function lampPpfd(state: SimulationState, hour: number): number {
  const config = state.config;
  const photoperiod = config.seasonalLighting ? state.climate.dayLengthH : config.photoperiodH;
  const on = 12 - photoperiod / 2;
  const off = 12 + photoperiod / 2;
  return hour + 0.5 >= on && hour + 0.5 < off ? config.lightPpfd : 0;
}
