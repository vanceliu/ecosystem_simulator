import type { ParameterSet } from '../content/parameters';

/** ISA troposphere pressure, atm. */
export function pressureAtm(altitudeM: number): number {
  return Math.pow(1 - 2.25577e-5 * altitudeM, 5.25588);
}

export function lapseAdjustedTemperature(
  params: ParameterSet,
  temperatureC: number,
  fromAltitudeM: number,
  toAltitudeM: number,
): number {
  return temperatureC - params.physics.lapseRateCPerM.value * (toAltitudeM - fromAltitudeM);
}

/** Benson & Krause dissolved-oxygen saturation (USGS), mg/L; docs/11 §3.1. */
export function oxygenSaturation(temperatureC: number, salinityPpt: number, atm: number): number {
  const t = Math.max(0, temperatureC);
  const kelvin = t + 273.15;
  const base = Math.exp(
    -139.34411 +
      1.575701e5 / kelvin -
      6.642308e7 / kelvin ** 2 +
      1.2438e10 / kelvin ** 3 -
      8.621949e11 / kelvin ** 4,
  );
  const salinityFactor = Math.exp(
    -salinityPpt * (0.017674 - 10.754 / kelvin + 2140.7 / kelvin ** 2),
  );
  const vapour = Math.exp(11.8571 - 3840.7 / kelvin - 216961 / kelvin ** 2);
  const theta = 0.000975 - 1.426e-5 * t + 6.436e-8 * t ** 2;
  const pressureFactor = ((atm - vapour) * (1 - theta * atm)) / ((1 - vapour) * (1 - theta));
  return base * salinityFactor * pressureFactor;
}

/** Fraction of total ammonia nitrogen present as free NH3 (Emerson et al. 1975). */
export function freeAmmoniaFraction(temperatureC: number, ph: number): number {
  const pKa = 0.09018 + 2729.92 / (temperatureC + 273.15);
  return 1 / (1 + Math.pow(10, pKa - ph));
}

/** Carbonate equilibrium pH from carbonate hardness (dKH) and dissolved CO2 (mg/L). */
export function carbonatePh(params: ParameterSet, khDkh: number, co2MgL: number): number {
  const physics = params.physics;
  const numerics = params.mechanics.numerics;
  const bicarbonate = Math.max(khDkh, 0.001) * physics.hco3MmolPerDkh.value;
  const carbonDioxide = Math.max(co2MgL, 1e-6) / physics.co2MgPerMmol.value;
  const ph = physics.carbonicPk1.value + Math.log10(bicarbonate / carbonDioxide);
  return Math.min(numerics.phMax, Math.max(numerics.phMin, ph));
}
