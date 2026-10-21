import type { Archetype } from '../content/archetype';
import type { ArchetypeId } from '../content/archetypeIds';
import { lociFor, type LocusDef, type LocusId } from './loci';

/** `${archetypeId}:${base36 mixed-radix index}` — species ID, signature and codex key. */
export type GenotypeCode = string;

export interface Genotype {
  readonly archetypeId: ArchetypeId;
  readonly alleles: readonly number[];
}

const RADIX = 36;

/** Number of distinct genotypes for an archetype (docs/05 §2.4). */
export function speciesSpaceSize(archetype: Archetype): number {
  return lociFor(archetype).reduce((product, locus) => product * locus.labelsZh.length, 1);
}

/** Mixed-radix index with the first locus as the least significant digit. */
export function genotypeIndex(loci: readonly LocusDef[], alleles: readonly number[]): number {
  if (alleles.length !== loci.length) throw new Error('allele count does not match loci');
  let index = 0;
  let place = 1;
  loci.forEach((locus, position) => {
    const allele = alleles[position] ?? -1;
    if (!Number.isInteger(allele) || allele < 0 || allele >= locus.labelsZh.length) {
      throw new Error(`allele ${allele} out of range for locus ${locus.id}`);
    }
    index += allele * place;
    place *= locus.labelsZh.length;
  });
  return index;
}

export function allelesFromIndex(loci: readonly LocusDef[], index: number): number[] {
  let remainder = index;
  return loci.map((locus) => {
    const radix = locus.labelsZh.length;
    const allele = remainder % radix;
    remainder = Math.floor(remainder / radix);
    return allele;
  });
}

export function encodeGenotype(archetype: Archetype, alleles: readonly number[]): GenotypeCode {
  return `${archetype.id}:${genotypeIndex(lociFor(archetype), alleles).toString(RADIX)}`;
}

export function parseGenotypeCode(code: GenotypeCode): {
  readonly archetypeId: ArchetypeId;
  readonly index: number;
} {
  const separator = code.lastIndexOf(':');
  if (separator <= 0) throw new Error(`Invalid genotype code: ${code}`);
  const index = Number.parseInt(code.slice(separator + 1), RADIX);
  if (!Number.isSafeInteger(index)) throw new Error(`Invalid genotype index: ${code}`);
  return { archetypeId: code.slice(0, separator) as ArchetypeId, index };
}

export function decodeGenotype(archetype: Archetype, code: GenotypeCode): Genotype {
  const parsed = parseGenotypeCode(code);
  if (parsed.archetypeId !== archetype.id) throw new Error(`${code} is not a ${archetype.id}`);
  const loci = lociFor(archetype);
  if (parsed.index >= speciesSpaceSize(archetype)) throw new Error(`Index out of range: ${code}`);
  return { archetypeId: archetype.id, alleles: allelesFromIndex(loci, parsed.index) };
}

export function alleleOf(archetype: Archetype, alleles: readonly number[], id: LocusId): number {
  const position = lociFor(archetype).findIndex((locus) => locus.id === id);
  if (position < 0) throw new Error(`${archetype.id} has no locus ${id}`);
  return alleles[position] ?? 0;
}
