import { describe, expect, it } from 'vitest';
import { cloneState, totalNitrogen, totalPhosphorus } from '../../src/engine/index';
import { CYCLING_TANK, DAILY_FEED_MG, FEED_HOUR } from './fixtures';
import { peakDay, runDays } from './simulation';

const DAYS = 70;
const result = runDays(CYCLING_TANK, 'cycle-seed', DAYS, DAILY_FEED_MG, FEED_HOUR);

describe('fishless cycle (docs/06 §4, docs/00 M1)', () => {
  it('completes the nitrogen cycle within 4–8 game weeks', () => {
    const complete = result.events.find((event) => event.type === 'cycle_complete');
    expect(complete).toBeDefined();
    const day = (complete?.tick ?? 0) / 24;
    expect(day).toBeGreaterThanOrEqual(28);
    expect(day).toBeLessThanOrEqual(56);
  });

  it('peaks ammonia before nitrite', () => {
    expect(peakDay(result.daily, 'tanMgL')).toBeLessThan(peakDay(result.daily, 'no2MgL'));
  });

  it('accumulates nitrate once cycled', () => {
    const last = result.daily.at(-1);
    expect(last?.no3MgL ?? 0).toBeGreaterThan(3);
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
