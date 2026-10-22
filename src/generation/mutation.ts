import type { Archetype } from '../content/archetype';
import type { ParameterSet } from '../content/parameters';
import { decodeGenotype, encodeGenotype, type GenotypeCode } from './genotype';
import type { RandomSource } from './hash';
import { lociFor } from './loci';

const NO_MUTATION = 0;

const randomIndex = (count: number, random: RandomSource): number =>
  Math.min(count - 1, Math.floor(random.next() * count));

/** Returns a mutated genotype that differs from `code` at one or two loci. */
export function mutateGenotype(
  params: ParameterSet,
  archetype: Archetype,
  code: GenotypeCode,
  random: RandomSource,
): GenotypeCode {
  const shares = params.generation.mutation;
  const loci = lociFor(params, archetype);
  const alleles = [...decodeGenotype(params, archetype, code).alleles];
  const mutationPosition = loci.findIndex((locus) => locus.id === 'mutation');

  if (random.next() < shares.mutationLocusShare) {
    const current = alleles[mutationPosition] ?? NO_MUTATION;
    const kinds = loci[mutationPosition]?.labelsZh.length ?? 1;
    if (current !== NO_MUTATION && random.next() < shares.revertShare) {
      alleles[mutationPosition] = NO_MUTATION;
    } else {
      let next = 1 + randomIndex(kinds - 1, random);
      if (next === current) next = (next % (kinds - 1)) + 1;
      alleles[mutationPosition] = next;
    }
    return encodeGenotype(params, archetype, alleles);
  }

  const candidates = loci.map((_, index) => index).filter((index) => index !== mutationPosition);
  const changes = random.next() < shares.twoLociShare ? 2 : 1;
  const chosen = new Set<number>();
  while (chosen.size < changes) chosen.add(candidates[randomIndex(candidates.length, random)] ?? 0);
  for (const position of chosen) {
    const locus = loci[position];
    if (locus === undefined) continue;
    const count = locus.labelsZh.length;
    const current = alleles[position] ?? 0;
    if (locus.ordered) {
      const step = random.next() < 0.5 ? -1 : 1;
      const next = current + step;
      alleles[position] = next < 0 || next >= count ? current - step : next;
    } else {
      const offset = 1 + randomIndex(count - 1, random);
      alleles[position] = (current + offset) % count;
    }
  }
  return encodeGenotype(params, archetype, alleles);
}
