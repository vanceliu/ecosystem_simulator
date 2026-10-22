import type { ParameterSet } from '../content/parameters';

const DEG = Math.PI / 180;

/** Forsythe et al. 1995 CBM model, hours of daylight; latitude negative in the south. */
export function dayLengthHours(latitudeDeg: number, dayOfYear: number): number {
  const theta = 0.2163108 + 2 * Math.atan(0.9671396 * Math.tan(0.0086 * (dayOfYear - 186)));
  const phi = Math.asin(0.39795 * Math.cos(theta));
  const lat = latitudeDeg * DEG;
  const argument =
    (Math.sin(0.8333 * DEG) + Math.sin(lat) * Math.sin(phi)) / (Math.cos(lat) * Math.cos(phi));
  const clamped = Math.min(1, Math.max(-1, argument));
  return 24 - (24 / Math.PI) * Math.acos(clamped);
}

/** FAO-56 solar declination, radians. */
export function solarDeclination(dayOfYear: number): number {
  return 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
}

/** Clear-sky global irradiance at solar noon (Laue 1970), W/m². */
export function noonClearSkyIrradiance(
  latitudeDeg: number,
  dayOfYear: number,
  altitudeM: number,
): number {
  const zenith = Math.abs(latitudeDeg * DEG - solarDeclination(dayOfYear));
  if (zenith >= Math.PI / 2) return 0;
  const airMass = 1 / Math.cos(zenith);
  const heightKm = altitudeM / 1000;
  const direct =
    1.353 * ((1 - 0.14 * heightKm) * Math.pow(0.7, Math.pow(airMass, 0.678)) + 0.14 * heightKm);
  return 1.1 * direct * 1000;
}

/** Clear-sky PPFD at a local solar hour, sinusoidal between sunrise and sunset. */
export function clearSkyPpfd(
  params: ParameterSet,
  latitudeDeg: number,
  dayOfYear: number,
  hour: number,
  altitudeM: number,
): number {
  const dayLength = dayLengthHours(latitudeDeg, dayOfYear);
  if (dayLength <= 0) return 0;
  const sunrise = 12 - dayLength / 2;
  const progress = (hour + 0.5 - sunrise) / dayLength;
  if (progress <= 0 || progress >= 1) return 0;
  const noon =
    noonClearSkyIrradiance(latitudeDeg, dayOfYear, altitudeM) * params.physics.ppfdPerWatt.value;
  return noon * Math.sin(Math.PI * progress);
}
