import type { Archetype } from '../content/archetype';
import type { ParameterSet } from '../content/parameters';
import { decodeGenotype, type GenotypeCode } from './genotype';
import { lociFor } from './loci';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export function rarityScore(
  params: ParameterSet,
  archetype: Archetype,
  code: GenotypeCode,
): number {
  const { alleles } = decodeGenotype(params, archetype, code);
  let score = 0;
  lociFor(params, archetype).forEach((locus, position) => {
    const weight = locus.baseWeights[alleles[position] ?? 0] ?? 0;
    const best = Math.max(...locus.baseWeights);
    score += Math.log10(best / weight);
  });
  return score;
}

/** docs/05 §6 tiers on −log10(P_base / P_max). */
export function rarityTier(params: ParameterSet, score: number): RarityTier {
  const thresholds = params.generation.rarity;
  if (score >= thresholds.legendaryFrom) return 'legendary';
  if (score >= thresholds.rareFrom) return 'rare';
  if (score >= thresholds.uncommonFrom) return 'uncommon';
  return 'common';
}
