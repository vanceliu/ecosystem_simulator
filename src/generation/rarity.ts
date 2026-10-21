import type { Archetype } from '../content/archetype';
import { decodeGenotype, type GenotypeCode } from './genotype';
import { lociFor } from './loci';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export const RARITY_LABELS_ZH: Readonly<Record<RarityTier, string>> = {
  common: '常見',
  uncommon: '少見',
  rare: '稀有',
  legendary: '傳說',
};

/** docs/05 §6 tier thresholds on −log10(P_base / P_max) */
const UNCOMMON_FROM = 2;
const RARE_FROM = 4;
const LEGENDARY_FROM = 6;

export function rarityScore(archetype: Archetype, code: GenotypeCode): number {
  const { alleles } = decodeGenotype(archetype, code);
  let score = 0;
  lociFor(archetype).forEach((locus, position) => {
    const weight = locus.baseWeights[alleles[position] ?? 0] ?? 0;
    const best = Math.max(...locus.baseWeights);
    score += Math.log10(best / weight);
  });
  return score;
}

export function rarityTier(score: number): RarityTier {
  if (score >= LEGENDARY_FROM) return 'legendary';
  if (score >= RARE_FROM) return 'rare';
  if (score >= UNCOMMON_FROM) return 'uncommon';
  return 'common';
}
