import { describe, expect, it } from 'vitest';
import { CYCLE_MIN_TOTAL_NITRIFIED_MG_L } from '../../src/engine/events';
import { cloneState, totalNitrogen, totalPhosphorus } from '../../src/engine/index';
import { CYCLING_TANK, DAILY_FEED_MG, FEED_HOUR } from './fixtures';
import { peakDay, runDays } from './simulation';

const DAYS = 70;
/** docs/06 §6 judges cycle timing by the median over seeds */
const TIMING_SEEDS = ['cycle-seed', 'a', 'b', 'c', 'd'];
const runs = TIMING_SEEDS.map((seed) =>
  runDays(CYCLING_TANK, seed, DAYS, DAILY_FEED_MG, FEED_HOUR),
);
const result = runs[0] ?? runDays(CYCLING_TANK, 'cycle-seed', DAYS, DAILY_FEED_MG, FEED_HOUR);

function completionDay(run: (typeof runs)[number]): number {
  const complete = run.events.find((event) => event.type === 'cycle_complete');
  return complete === undefined ? Infinity : complete.tick / 24;
}

/** The run whose completion day is the median over the timing seeds. */
const medianRun = [...runs].sort((a, b) => completionDay(a) - completionDay(b))[
  Math.floor(runs.length / 2)
];

describe('fishless cycle (docs/06 §4, docs/00 M1)', () => {
  it('completes the nitrogen cycle within 4–8 game weeks (median over seeds)', () => {
    const day = medianRun === undefined ? Infinity : completionDay(medianRun);
    expect(day).toBeGreaterThanOrEqual(28);
    expect(day).toBeLessThanOrEqual(56);
  });

  it('peaks ammonia before nitrite in the median run', () => {
    expect(medianRun).toBeDefined();
    if (medianRun === undefined) return;
    expect(peakDay(medianRun.daily, 'tanMgL')).toBeLessThan(peakDay(medianRun.daily, 'no2MgL'));
  });

  it('keeps oxidising ammonia once cycled in the median run', () => {
    expect(medianRun).toBeDefined();
    if (medianRun === undefined) return;
    const last = medianRun.daily.at(-1);
    const volume = medianRun.final.water.volumeL;
    expect(medianRun.final.tracking.nitrifiedN / volume).toBeGreaterThanOrEqual(
      CYCLE_MIN_TOTAL_NITRIFIED_MG_L,
    );
    expect(last?.tanMgL ?? 1).toBeLessThan(0.25);
    expect(last?.no2MgL ?? 1).toBeLessThan(0.25);
  });

  it('conserves nitrogen and phosphorus', () => {
    const { initial, final } = result;
    const nExpected = totalNitrogen(initial) + final.ledger.nIn - final.ledger.nOut;
    const pExpected = totalPhosphorus(initial) + final.ledger.pIn - final.ledger.pOut;
    expect(Math.abs(totalNitrogen(final) - nExpected) / nExpected).toBeLessThan(1e-9);
    expect(Math.abs(totalPhosphorus(final) - pExpected) / pExpected).toBeLessThan(1e-9);
  });

  it('keeps every pool non-negative and finite', () => {
    expect(result.finite).toBe(true);
    expect(result.minima.pool).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic for the same seed and commands', () => {
    const repeat = runDays(CYCLING_TANK, 'cycle-seed', 10, DAILY_FEED_MG, FEED_HOUR);
    const again = runDays(CYCLING_TANK, 'cycle-seed', 10, DAILY_FEED_MG, FEED_HOUR);
    expect(JSON.stringify(again.final)).toBe(JSON.stringify(repeat.final));
    expect(cloneState(repeat.final)).toEqual(repeat.final);
  });
});
