import { describe, expect, it } from 'vitest';
import { totalNitrogen, totalPhosphorus } from '../../src/engine/index';
import type { Placement } from '../../src/engine/types';
import { tank, type LocationSpec } from './fixtures';
import { runDays } from './simulation';

const YEAR = 365;
const FEED_MG = 30;
const TIMEOUT_MS = 120_000;

export interface BoundaryCase {
  readonly name: string;
  readonly location: LocationSpec;
  readonly landFraction: number;
  readonly waterDepthCm: number;
}

/** docs/00 M1: tank types × indoor/outdoor, one year, no NaN and no negative pools. */
export function describeBoundaryYear(climate: string, cases: readonly BoundaryCase[]): void {
  describe(`one-year boundary runs: ${climate}`, () => {
    for (const testCase of cases) {
      for (const placement of ['indoor', 'outdoor'] as const satisfies readonly Placement[]) {
        it(
          `${testCase.name} (${placement})`,
          () => {
            const config = tank(testCase.location, placement, {
              landFraction: testCase.landFraction,
              waterDepthCm: testCase.waterDepthCm,
              landSubstrate: testCase.landFraction > 0 ? 'leaf_litter' : null,
              landSubstrateDepthCm: testCase.landFraction > 0 ? 8 : 0,
              substrate: testCase.landFraction < 1 ? 'fine_sand' : 'bare',
              substrateDepthCm: testCase.landFraction < 1 ? 5 : 0,
              filter: testCase.landFraction < 1 ? 'sponge' : 'none',
            });
            const run = runDays(
              config,
              `${climate}-${testCase.name}-${placement}`,
              YEAR,
              FEED_MG,
              9,
            );
            expect(run.finite).toBe(true);
            expect(run.minima.pool).toBeGreaterThanOrEqual(0);
            expect(run.minima.volume).toBeGreaterThanOrEqual(0);
            const nExpected =
              totalNitrogen(run.initial) + run.final.ledger.nIn - run.final.ledger.nOut;
            const pExpected =
              totalPhosphorus(run.initial) + run.final.ledger.pIn - run.final.ledger.pOut;
            expect(Math.abs(totalNitrogen(run.final) - nExpected)).toBeLessThan(
              1e-6 * Math.max(1, nExpected),
            );
            expect(Math.abs(totalPhosphorus(run.final) - pExpected)).toBeLessThan(
              1e-6 * Math.max(1, pExpected),
            );
            if (placement === 'outdoor' && climate === 'polar' && testCase.landFraction < 1) {
              expect(run.events.some((event) => event.type === 'freeze')).toBe(true);
            }
          },
          TIMEOUT_MS,
        );
      }
    }
  });
}

export function boundaryCases(location: LocationSpec): BoundaryCase[] {
  return [
    { name: 'aquarium', location, landFraction: 0, waterDepthCm: 30 },
    { name: 'half land', location, landFraction: 0.5, waterDepthCm: 20 },
    { name: 'terrarium', location, landFraction: 1, waterDepthCm: 0 },
  ];
}
