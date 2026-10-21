import { describe, expect, it } from 'vitest';
import {
  carbonatePh,
  freeAmmoniaFraction,
  lapseAdjustedTemperature,
  oxygenSaturation,
  pressureAtm,
} from '../../src/engine/atmosphere';
import { clearSkyPpfd, dayLengthHours, noonClearSkyIrradiance } from '../../src/engine/astronomy';
import { computeGeometry } from '../../src/engine/geometry';
import { CYCLING_TANK } from './fixtures';

describe('atmosphere (docs/11 §3)', () => {
  it.each([
    [300, 0.965],
    [1000, 0.887],
    [2500, 0.737],
    [4000, 0.608],
  ])('ISA pressure at %i m ≈ %f atm', (altitude, expected) => {
    expect(pressureAtm(altitude)).toBeCloseTo(expected, 2);
  });

  it.each([
    [0, 0, 14.62],
    [20, 0, 9.09],
    [20, 2500, 6.65],
    [30, 4000, 4.47],
  ])('Benson & Krause DO at %i °C, %i m ≈ %f mg/L', (temperature, altitude, expected) => {
    expect(oxygenSaturation(temperature, 0, pressureAtm(altitude))).toBeCloseTo(expected, 1);
  });

  it('lowers oxygen saturation in seawater', () => {
    expect(oxygenSaturation(25, 35, 1)).toBeLessThan(oxygenSaturation(25, 0, 1) * 0.85);
  });

  it('applies the 6.5 °C/km lapse rate', () => {
    expect(lapseAdjustedTemperature(20, 0, 2000)).toBeCloseTo(7, 6);
  });

  it('matches the Emerson free-ammonia fraction at pH 7, 25 °C', () => {
    expect(freeAmmoniaFraction(25, 7)).toBeCloseTo(0.0056, 3);
  });

  it('derives pH from carbonate hardness and CO2', () => {
    expect(carbonatePh(4, 3)).toBeCloseTo(7.67, 1);
    expect(carbonatePh(4, 30)).toBeLessThan(carbonatePh(4, 3));
  });
});

describe('astronomy (docs/11 §3.2)', () => {
  it('gives about 12 h of daylight at the equator', () => {
    expect(dayLengthHours(0, 80)).toBeCloseTo(12.1, 0);
  });

  it('gives long summer and short winter days at 45°N', () => {
    expect(dayLengthHours(45, 172)).toBeCloseTo(15.4, 0);
    expect(dayLengthHours(45, 355)).toBeCloseTo(8.8, 0);
  });

  it('produces polar day and polar night at 72°N', () => {
    expect(dayLengthHours(72, 172)).toBe(24);
    expect(dayLengthHours(72, 355)).toBe(0);
  });

  it('mirrors the seasons in the southern hemisphere', () => {
    expect(dayLengthHours(-45, 172)).toBeCloseTo(dayLengthHours(45, 355), 0);
  });

  it('reaches about 2000 µmol/m²/s at a tropical clear-sky noon', () => {
    const ppfd = clearSkyPpfd(10, 80, 12, 0);
    expect(ppfd).toBeGreaterThan(1700);
    expect(ppfd).toBeLessThan(2300);
    expect(clearSkyPpfd(10, 80, 2, 0)).toBe(0);
  });

  it('increases irradiance with altitude', () => {
    expect(noonClearSkyIrradiance(10, 80, 3000)).toBeGreaterThan(noonClearSkyIrradiance(10, 80, 0));
  });
});

describe('geometry (docs/04 §3.1)', () => {
  it('derives areas and volumes from tank dimensions', () => {
    const geometry = computeGeometry({
      ...CYCLING_TANK,
      lengthCm: 60,
      widthCm: 30,
      heightCm: 36,
      waterDepthCm: 30,
      landFraction: 0.5,
    });
    expect(geometry.floorAreaM2).toBeCloseTo(0.18, 10);
    expect(geometry.landAreaM2).toBeCloseTo(0.09, 10);
    expect(geometry.nominalWaterVolumeL).toBeCloseTo(27, 10);
    expect(geometry.maxWaterVolumeL).toBeCloseTo(32.4, 10);
  });

  it('has no water in a pure terrarium', () => {
    const geometry = computeGeometry({ ...CYCLING_TANK, landFraction: 1 });
    expect(geometry.nominalWaterVolumeL).toBe(0);
    expect(geometry.surfaceAreaM2).toBe(0);
  });
});
