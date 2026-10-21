import { describe, expect, it } from 'vitest';
import { computeGeometry, totalNitrogen } from '../../src/engine/index';
import { TIDE_AMPLITUDE } from '../../src/engine/hydrology';
import { tank } from './fixtures';
import { runDays } from './simulation';

describe('tides (docs/11 §5.3)', () => {
  const config = tank(
    { zone: 'tropical', moisture: 'humid', habitat: 'mangrove', realm: 'IM' },
    'indoor',
  );
  const nominal = computeGeometry(config).nominalWaterVolumeL;
  const run = runDays(config, 'tide', 3, 0, 9);

  it('moves the water level within the tidal amplitude', () => {
    expect(config.tide).toBe(true);
    expect(run.minima.volume).toBeLessThan(nominal * 0.7);
    expect(run.minima.volume).toBeGreaterThanOrEqual(nominal * (1 - TIDE_AMPLITUDE) - 1e-6);
  });

  it('accounts for nitrogen exchanged with the sea', () => {
    const expected = totalNitrogen(run.initial) + run.final.ledger.nIn - run.final.ledger.nOut;
    expect(Math.abs(totalNitrogen(run.final) - expected) / expected).toBeLessThan(1e-9);
  });
});

describe('indoor seasonal drying (docs/11 §5.3)', () => {
  it('lowers the water in the dry season and refills it in the wet season', () => {
    const config = tank(
      { zone: 'tropical', moisture: 'seasonal', habitat: 'savanna_pond', realm: 'AT' },
      'indoor',
      { startDayOfYear: 1 },
    );
    const nominal = computeGeometry(config).nominalWaterVolumeL;
    const dry = runDays(config, 'drying', 60, 0, 9);
    expect(dry.final.water.volumeL).toBeLessThan(nominal * 0.1);
    const wet = runDays({ ...config, startDayOfYear: 152 }, 'refill', 60, 0, 9);
    expect(wet.final.water.volumeL).toBeCloseTo(nominal, 6);
  });
});

describe('outdoor evaporation (docs/11 §7)', () => {
  it('dries an arid outdoor pond and raises the drought event', () => {
    const config = tank(
      { zone: 'subtropical', moisture: 'arid', habitat: 'lake', realm: 'PA' },
      'outdoor',
      { waterDepthCm: 10, startDayOfYear: 182 },
    );
    const run = runDays(config, 'arid', 30, 0, 9);
    expect(run.final.water.volumeL).toBeLessThan(run.initial.water.volumeL);
    expect(run.events.some((event) => event.type === 'drought')).toBe(true);
  });
});
