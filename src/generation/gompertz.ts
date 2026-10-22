import type { ParameterSet } from '../content/parameters';

export interface GompertzParams {
  /** daily hazard at age 0 */
  readonly a: number;
  /** per day; 0 means constant hazard */
  readonly g: number;
}

const BISECTION_STEPS = 200;

/** S(age) = exp(−(a/g)(e^{g·age} − 1)); constant hazard when g = 0. */
export function gompertzSurvival(params: GompertzParams, ageDays: number): number {
  if (params.g === 0) return Math.exp(-params.a * ageDays);
  return Math.exp(-(params.a / params.g) * Math.expm1(params.g * ageDays));
}

export function gompertzHazard(params: GompertzParams, ageDays: number): number {
  return params.a * Math.exp(params.g * ageDays);
}

/**
 * Solves a and g so that S(typical) and S(max) hit the calibration targets. When typical/max is
 * too small for a positive g, a constant hazard matching S(typical) is returned.
 */
export function fitGompertz(
  params: ParameterSet,
  typicalDays: number,
  maxDays: number,
): GompertzParams {
  const { survivalAtTypical, survivalAtMax } = params.generation.gompertz;
  if (!(typicalDays > 0) || !(maxDays > typicalDays)) {
    throw new Error(`Invalid lifespan: typical ${typicalDays}, max ${maxDays}`);
  }
  const target = Math.log(survivalAtTypical) / Math.log(survivalAtMax);
  const ratioAt = (g: number): number => Math.expm1(g * typicalDays) / Math.expm1(g * maxDays);
  if (typicalDays / maxDays <= target) {
    return { a: -Math.log(survivalAtTypical) / typicalDays, g: 0 };
  }
  let low = 1e-12;
  let high = 1 / typicalDays;
  while (ratioAt(high) > target) high *= 2;
  for (let step = 0; step < BISECTION_STEPS; step += 1) {
    const mid = (low + high) / 2;
    if (ratioAt(mid) > target) low = mid;
    else high = mid;
  }
  const g = (low + high) / 2;
  const a = (-Math.log(survivalAtTypical) * g) / Math.expm1(g * typicalDays);
  return { a, g };
}
