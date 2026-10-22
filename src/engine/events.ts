import type { ParameterSet } from '../content/parameters';
import { freeAmmoniaMgL } from './environment';
import { computeGeometry } from './geometry';
import type { SimEvent, SimEventLevel, SimEventType, SimulationState } from './types';

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
  species_established: 'info',
  species_extinct: 'notice',
  mutant_established: 'notice',
  legendary_established: 'major',
  invader_established: 'notice',
  feeder_established: 'info',
  algae_bloom: 'notice',
  bacterial_bloom: 'notice',
  population_boom: 'notice',
  coral_bleaching: 'major',
  emergence_exit: 'info',
  metamorphosis: 'info',
  trophic_milestone: 'major',
  clonal_collapse: 'notice',
  ecosystem_saturated: 'major',
  dry_air: 'notice',
  uvb_missing: 'notice',
  release_rejected: 'info',
};

export function makeEvent(
  type: SimEventType,
  tick: number,
  extra: { readonly speciesId?: string; readonly detail?: string } = {},
): SimEvent {
  return { tick, type, level: LEVEL[type], ...extra };
}

/** docs/06 §4: evaluated at the first tick of each day for the day that just ended. */
export function dayEndEvents(params: ParameterSet, state: SimulationState): SimEvent[] {
  const events: SimEvent[] = [];
  const thresholds = params.mechanics.events;
  const substances = state.substances;
  const tracking = state.tracking;
  const volume = state.water.volumeL;
  if (volume > 0 && tracking.cycleStatus !== 'complete') {
    const tan = substances.water_tan / volume;
    const no2 = substances.water_no2 / volume;
    const settled = tan < thresholds.cycleTanMaxMgL && no2 < thresholds.cycleNo2MaxMgL;
    tracking.cycledDays = settled ? tracking.cycledDays + 1 : 0;
    const enoughProcessed = tracking.nitrifiedN / volume >= thresholds.cycleMinTotalNitrifiedMgL;
    if (tracking.cycledDays >= thresholds.cycleRequiredDays && enoughProcessed) {
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

export function hourlyEvents(
  params: ParameterSet,
  state: SimulationState,
  wasIceCovered: boolean,
): SimEvent[] {
  const events: SimEvent[] = [];
  const water = state.water;
  const substances = state.substances;
  const tracking = state.tracking;
  const tick = state.tick;
  const thresholds = params.mechanics.events;
  if (water.volumeL > 0) {
    const loaded =
      substances.water_tan / water.volumeL > thresholds.cycleTanMaxMgL ||
      substances.water_no2 / water.volumeL > thresholds.cycleNo2MaxMgL;
    if (loaded && tracking.cycleStatus === 'no_load') {
      tracking.cycleStatus = 'cycling';
      events.push(makeEvent('cycle_started', tick));
    }
    const ammonia = freeAmmoniaMgL(params, state) > thresholds.ammoniaSpikeNh3MgL;
    if (ammonia && !tracking.ammoniaAlert) events.push(makeEvent('ammonia_spike', tick));
    tracking.ammoniaAlert = ammonia;
    const nitrite = substances.water_no2 / water.volumeL > thresholds.nitriteSpikeMgL;
    if (nitrite && !tracking.nitriteAlert) events.push(makeEvent('nitrite_spike', tick));
    tracking.nitriteAlert = nitrite;
    const hypoxia = substances.water_o2 / water.volumeL < thresholds.hypoxiaO2MgL;
    if (hypoxia && !tracking.hypoxiaAlert) events.push(makeEvent('hypoxia', tick));
    tracking.hypoxiaAlert = hypoxia;
  }
  if (water.iceCover !== wasIceCovered) {
    events.push(makeEvent(water.iceCover ? 'freeze' : 'thaw', tick));
  }
  if (state.config.placement === 'outdoor') {
    const nominal = computeGeometry(params, state.config).nominalWaterVolumeL;
    const drought = nominal > 0 && water.volumeL < nominal * thresholds.droughtVolumeFraction;
    if (drought && !tracking.droughtAlert) events.push(makeEvent('drought', tick));
    tracking.droughtAlert = drought;
  }
  return events;
}
