import type { Archetype } from '../content/archetype';
import { encodeGenotype, type GenotypeCode } from './genotype';
import type { RandomSource } from './hash';
import { lociFor, type LocusDef } from './loci';
import { derivePhenotype, type ToleranceRange } from './phenotype';

/** docs/05 §3: minimum environmental weight factor */
const MIN_ENVIRONMENT_FACTOR = 0.05;

export interface SamplingEnvironment {
  readonly temperatureC: number;
  readonly salinityPpt: number;
  readonly ph: number;
  /** longest adult body the enclosure can hold (docs/09 §7); omit for no limit */
  readonly maxLengthMm?: number;
}

/** docs/04 §5.1 tolerance curve */
export function toleranceFactor(value: number, range: ToleranceRange): number {
  if (value < range.min || value > range.max) return 0;
  const width = (range.max - range.min) / 4;
  if (width <= 0) return value === range.opt ? 1 : 0;
  return Math.exp(-(((value - range.opt) / width) ** 2));
}

function pick(weights: readonly number[], random: RandomSource): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let threshold = random.next() * total;
  for (let index = 0; index < weights.length; index += 1) {
    threshold -= weights[index] ?? 0;
    if (threshold < 0) return index;
  }
  return weights.length - 1;
}

/** Phenotype of a genotype that differs from `alleles` only at `position`. */
function variantPhenotype(
  archetype: Archetype,
  alleles: readonly number[],
  position: number,
  allele: number,
) {
  const variant = [...alleles];
  variant[position] = allele;
  return derivePhenotype(archetype, encodeGenotype(archetype, variant));
}

function environmentWeights(
  archetype: Archetype,
  loci: readonly LocusDef[],
  alleles: readonly number[],
  position: number,
  environment: SamplingEnvironment,
): number[] {
  const locus = loci[position];
  if (locus === undefined) return [];
  return locus.baseWeights.map((weight, allele) => {
    if (weight === 0) return 0;
    const phenotype = variantPhenotype(archetype, alleles, position, allele);
    switch (locus.id) {
      case 'size':
        return environment.maxLengthMm !== undefined && phenotype.lengthMm > environment.maxLengthMm
          ? 0
          : weight;
      case 'thermal':
        return (
          weight *
          Math.max(
            MIN_ENVIRONMENT_FACTOR,
            toleranceFactor(environment.temperatureC, phenotype.temperatureC),
          )
        );
      case 'salinity':
        return phenotype.salinityPpt === undefined
          ? weight
          : weight *
              Math.max(
                MIN_ENVIRONMENT_FACTOR,
                toleranceFactor(environment.salinityPpt, phenotype.salinityPpt),
              );
      case 'ph':
        return (
          weight * Math.max(MIN_ENVIRONMENT_FACTOR, toleranceFactor(environment.ph, phenotype.ph))
        );
      default:
        return weight;
    }
  });
}

/**
 * Draws a genotype. With an environment, emergence weighting applies (docs/05 §3); without
 * one, base weights apply (player release). Returns null when no size fits the enclosure.
 */
export function sampleGenotype(
  archetype: Archetype,
  random: RandomSource,
  environment?: SamplingEnvironment,
): GenotypeCode | null {
  const loci = lociFor(archetype);
  const alleles = loci.map((locus) => pick(locus.baseWeights, random));
  if (environment === undefined) return encodeGenotype(archetype, alleles);
  for (const id of ['size', 'thermal', 'salinity', 'ph'] as const) {
    const position = loci.findIndex((locus) => locus.id === id);
    if (position < 0) continue;
    const weights = environmentWeights(archetype, loci, alleles, position, environment);
    if (weights.every((weight) => weight <= 0)) return null;
    alleles[position] = pick(weights, random);
  }
  const code = encodeGenotype(archetype, alleles);
  if (
    environment.maxLengthMm !== undefined &&
    derivePhenotype(archetype, code).lengthMm > environment.maxLengthMm
  ) {
    return null;
  }
  return code;
}
