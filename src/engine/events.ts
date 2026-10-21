import { freeAmmoniaMgL } from './environment';
import { computeGeometry } from './geometry';
import type { SimEvent, SimEventLevel, SimEventType, SimulationState } from './types';

/** docs/06 §4 thresholds */
export const CYCLE_TAN_MAX_MG_L = 0.25;
export const CYCLE_NO2_MAX_MG_L = 0.25;
export const CYCLE_REQUIRED_DAYS = 7;
/** mg N/L oxidised in total before the cycle can complete */
export const CYCLE_MIN_TOTAL_NITRIFIED_MG_L = 0.5;
export const AMMONIA_SPIKE_NH3_MG_L = 0.05;
export const NITRITE_SPIKE_MG_L = 1;
export const HYPOXIA_O2_MG_L = 3;
export const DROUGHT_VOLUME_FRACTION = 0.1;

const LEVEL: Readonly<Record<SimEventType, SimEventLevel>> = {
  cycle_started: 'info',
  cycle_complete: 'major',
  ammonia_spike: 'notice',
  nitrite_spike: 'notice',
  hypoxia: 'major',
  freeze: 'notice',
  thaw: 'info',
  drought: 'major',
  wet_season_start: 'info',
  dry_season_start: 'info',
  equinox: 'info',
};

export function makeEvent(type: SimEventType, tick: number): SimEvent {
  return { tick, type, level: LEVEL[type] };
}

/** docs/06 §4: evaluated at the first tick of each day for the day that just ended. */
export function dayEndEvents(state: SimulationState): SimEvent[] {
  const events: SimEvent[] = [];
  const water = state.water;
  const tracking = state.tracking;
  const volume = water.volumeL;
  if (volume > 0 && tracking.cycleStatus !== 'complete') {
    const tan = water.tan / volume;
    const no2 = water.no2 / volume;
    const settled = tan < CYCLE_TAN_MAX_MG_L && no2 < CYCLE_NO2_MAX_MG_L;
    tracking.cycledDays = settled ? tracking.cycledDays + 1 : 0;
    const enoughProcessed = tracking.nitrifiedN / volume >= CYCLE_MIN_TOTAL_NITRIFIED_MG_L;
    if (tracking.cycledDays >= CYCLE_REQUIRED_DAYS && enoughProcessed) {
      tracking.cycleStatus = 'complete';
      events.push(makeEvent('cycle_complete', state.tick));
    }
  }
  tracking.nitrifiedAtDayStart = tracking.nitrifiedN;
  return events;
}

export function seasonEvents(
  state: SimulationState,
  previousWetSeason: boolean | null,
): SimEvent[] {
  const events: SimEvent[] = [];
  const climate = state.climate;
  if (
    previousWetSeason !== null &&
    climate.wetSeason !== null &&
    previousWetSeason !== climate.wetSeason
  ) {
    events.push(makeEvent(climate.wetSeason ? 'wet_season_start' : 'dry_season_start', state.tick));
  }
  const above = climate.dayLengthH > 12;
  if (above !== state.tracking.dayLengthAbove12) {
    state.tracking.dayLengthAbove12 = above;
    events.push(makeEvent('equinox', state.tick));
  }
  return events;
}

export function hourlyEvents(state: SimulationState, wasIceCovered: boolean): SimEvent[] {
  const events: SimEvent[] = [];
  const water = state.water;
  const tracking = state.tracking;
  const tick = state.tick;
  if (water.volumeL > 0) {
    const loaded =
      water.tan / water.volumeL > CYCLE_TAN_MAX_MG_L ||
      water.no2 / water.volumeL > CYCLE_NO2_MAX_MG_L;
    if (loaded && tracking.cycleStatus === 'no_load') {
      tracking.cycleStatus = 'cycling';
      events.push(makeEvent('cycle_started', tick));
    }
    const ammonia = freeAmmoniaMgL(state) > AMMONIA_SPIKE_NH3_MG_L;
    if (ammonia && !tracking.ammoniaAlert) events.push(makeEvent('ammonia_spike', tick));
    tracking.ammoniaAlert = ammonia;
    const nitrite = water.no2 / water.volumeL > NITRITE_SPIKE_MG_L;
    if (nitrite && !tracking.nitriteAlert) events.push(makeEvent('nitrite_spike', tick));
    tracking.nitriteAlert = nitrite;
    const hypoxia = water.o2 / water.volumeL < HYPOXIA_O2_MG_L;
    if (hypoxia && !tracking.hypoxiaAlert) events.push(makeEvent('hypoxia', tick));
    tracking.hypoxiaAlert = hypoxia;
  }
  if (water.iceCover !== wasIceCovered) {
    events.push(makeEvent(water.iceCover ? 'freeze' : 'thaw', tick));
  }
  if (state.config.placement === 'outdoor') {
    const nominal = computeGeometry(state.config).nominalWaterVolumeL;
    const drought = nominal > 0 && water.volumeL < nominal * DROUGHT_VOLUME_FRACTION;
    if (drought && !tracking.droughtAlert) events.push(makeEvent('drought', tick));
    tracking.droughtAlert = drought;
  }
  return events;
}
