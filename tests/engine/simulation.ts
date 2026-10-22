import { createInitialState, populationCod, step } from '../../src/engine/index';
import type { SimEvent, SimulationState, TankConfig } from '../../src/engine/types';

export interface DailySample {
  readonly day: number;
  readonly tanMgL: number;
  readonly no2MgL: number;
  readonly no3MgL: number;
}

export interface RunResult {
  readonly initial: SimulationState;
  readonly final: SimulationState;
  readonly events: readonly SimEvent[];
  readonly daily: readonly DailySample[];
  readonly minima: { readonly pool: number; readonly volume: number };
  readonly finite: boolean;
}

const POOL_KEYS = [
  'o2',
  'co2',
  'tan',
  'no2',
  'no3',
  'po4',
  'alkalinityMg',
  'substrateCod',
] as const;

/** Runs whole days, feeding once a day at `feedHour` when `feedMg` > 0. */
export function runDays(
  config: TankConfig,
  seed: string,
  days: number,
  feedMg: number,
  feedHour: number,
): RunResult {
  const initial = createInitialState(config, seed);
  let state = initial;
  const events: SimEvent[] = [];
  const daily: DailySample[] = [];
  let poolMinimum = Infinity;
  let volumeMinimum = Infinity;
  let finite = true;
  for (let day = 0; day < days; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      const commands =
        feedMg > 0 && hour === feedHour ? [{ type: 'feed' as const, dryMassMg: feedMg }] : [];
      const result = step(state, commands);
      state = result.state;
      events.push(...result.events);
      for (const key of POOL_KEYS) {
        const value = state.water[key];
        poolMinimum = Math.min(poolMinimum, value);
        if (!Number.isFinite(value)) finite = false;
      }
      volumeMinimum = Math.min(volumeMinimum, state.water.volumeL);
      for (const population of state.populations) {
        const cod = populationCod(population);
        poolMinimum = Math.min(poolMinimum, cod);
        if (!Number.isFinite(cod)) finite = false;
      }
      if (
        ![state.water.temperatureC, state.land.humidity, state.land.soilMoisture].every(
          Number.isFinite,
        )
      ) {
        finite = false;
      }
    }
    const volume = state.water.volumeL;
    daily.push({
      day: day + 1,
      tanMgL: volume > 0 ? state.water.tan / volume : 0,
      no2MgL: volume > 0 ? state.water.no2 / volume : 0,
      no3MgL: volume > 0 ? state.water.no3 / volume : 0,
    });
  }
  return {
    initial,
    final: state,
    events,
    daily,
    minima: { pool: poolMinimum, volume: volumeMinimum },
    finite,
  };
}

export function peakDay(daily: readonly DailySample[], key: 'tanMgL' | 'no2MgL'): number {
  return daily.reduce((best, sample) => (sample[key] > best[key] ? sample : best)).day;
}
