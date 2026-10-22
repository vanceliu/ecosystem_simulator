import { describe, expect, it } from 'vitest';
import {
  DAYS_PER_YEAR,
  dailyClimate,
  drawRainfall,
  equivalentMonth,
  hourlyAmbientTemperature,
} from '../../src/engine/climate';
import { createRng } from '../../src/engine/rng';
import { location } from './fixtures';
import { params } from '../params';

const MID_JULY = 196;
const MID_JANUARY = 15;

describe('daily climate (docs/11 §4)', () => {
  const minneapolis = location({
    zone: 'temperate',
    moisture: 'humid',
    continentality: 'continental',
    habitat: 'lake',
  });

  it('reproduces warm- and cold-month means at the station altitude', () => {
    const atStation = { ...minneapolis, altitudeM: 256 };
    expect(dailyClimate(params, atStation, MID_JULY).meanTemperatureC).toBeCloseTo(23.5, 0);
    expect(dailyClimate(params, atStation, MID_JANUARY).meanTemperatureC).toBeCloseTo(-8.8, 0);
  });

  it('cools with altitude', () => {
    const high = { ...minneapolis, altitudeM: 2256 };
    const low = { ...minneapolis, altitudeM: 256 };
    expect(
      dailyClimate(params, low, MID_JULY).meanTemperatureC -
        dailyClimate(params, high, MID_JULY).meanTemperatureC,
    ).toBeCloseTo(13, 6);
  });

  it('flips the seasons in the southern hemisphere', () => {
    const south = { ...minneapolis, hemisphere: 'south' as const };
    expect(dailyClimate(params, south, MID_JANUARY).meanTemperatureC).toBeGreaterThan(
      dailyClimate(params, south, MID_JULY).meanTemperatureC,
    );
    expect(equivalentMonth(MID_JANUARY, south)).toBe(7);
  });

  it('peaks in mid-afternoon', () => {
    const daily = dailyClimate(params, minneapolis, MID_JULY);
    expect(hourlyAmbientTemperature(params, daily, 15)).toBeGreaterThan(
      hourlyAmbientTemperature(params, daily, 3),
    );
  });

  it('allocates monthly rainfall that sums to the annual total', () => {
    for (const [key, normal] of Object.entries(params.climate.normals)) {
      const [zone, moisture, continentality] = key.split(':');
      const place = {
        ...minneapolis,
        latitudeZone: zone as typeof minneapolis.latitudeZone,
        moisture: moisture as typeof minneapolis.moisture,
        continentality: (continentality ?? 'maritime') as typeof minneapolis.continentality,
      };
      let total = 0;
      for (let month = 1; month <= 12; month += 1) {
        total += dailyClimate(
          params,
          place,
          Math.round((month - 0.5) * (DAYS_PER_YEAR / 12)),
        ).monthlyPrecipMm;
      }
      expect(total, key).toBeCloseTo(normal?.precipAnnualMm ?? 0, 6);
    }
  });

  it('draws more rain in the wet season than the dry season', () => {
    const darwin = location({ zone: 'tropical', moisture: 'seasonal', habitat: 'savanna_pond' });
    const rng = createRng(1);
    let wet = 0;
    let dry = 0;
    for (let index = 0; index < 2000; index += 1) {
      wet += drawRainfall(params, dailyClimate(params, darwin, MID_JULY), rng);
      dry += drawRainfall(params, dailyClimate(params, darwin, MID_JANUARY), rng);
    }
    expect(wet).toBeGreaterThan(dry * 5);
  });
});
