/** Standard lapse rate, °C per m (ISA). */
export const LAPSE_RATE_C_PER_M = 0.0065;
/** pK1 of carbonic acid at 25 °C. */
export const CARBONIC_PK1 = 6.35;
/** mmol HCO3⁻ per litre per dKH. */
export const HCO3_MMOL_PER_DKH = 0.357;
export const CO2_MG_PER_MMOL = 44.01;
/** Air-equilibrium dissolved CO2, mg/L. */
export const CO2_EQUILIBRIUM_MG_L = 0.5;
export const PH_MIN = 3.5;
export const PH_MAX = 9.5;

/** ISA troposphere pressure, atm. */
export function pressureAtm(altitudeM: number): number {
  return Math.pow(1 - 2.25577e-5 * altitudeM, 5.25588);
}

export function lapseAdjustedTemperature(
  temperatureC: number,
  fromAltitudeM: number,
  toAltitudeM: number,
): number {
  return temperatureC - LAPSE_RATE_C_PER_M * (toAltitudeM - fromAltitudeM);
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
export function carbonatePh(khDkh: number, co2MgL: number): number {
  const bicarbonate = Math.max(khDkh, 0.001) * HCO3_MMOL_PER_DKH;
  const carbonDioxide = Math.max(co2MgL, 1e-6) / CO2_MG_PER_MMOL;
  const ph = CARBONIC_PK1 + Math.log10(bicarbonate / carbonDioxide);
  return Math.min(PH_MAX, Math.max(PH_MIN, ph));
}
