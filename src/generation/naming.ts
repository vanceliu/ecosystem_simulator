import type { Archetype } from '../content/archetype';
import type { NamingParams } from '../content/genetics';
import type { ParameterSet } from '../content/parameters';
import { allelesFromIndex, decodeGenotype, encodeGenotype, type GenotypeCode } from './genotype';
import { lociFor, MUTATIONS, type LocusDef, type LocusId } from './loci';

const GENUS_LOCI: Readonly<Record<'cohort' | 'biomass', readonly LocusId[]>> = {
  cohort: ['diet', 'size', 'habitat'],
  biomass: ['metabolism', 'size', 'morphology'],
};

interface NameParts {
  readonly genus: string;
  readonly epithet: string;
  readonly variety: string;
}

const syllableCache = new WeakMap<NamingParams, readonly string[]>();

/** Epithet syllables: every consonant followed by every vowel. */
function syllables(naming: NamingParams): readonly string[] {
  const cached = syllableCache.get(naming);
  if (cached !== undefined) return cached;
  const list = naming.consonants.flatMap((consonant) =>
    naming.vowels.map((vowel) => consonant + vowel),
  );
  syllableCache.set(naming, list);
  return list;
}

const suffixesOf = (naming: NamingParams, archetype: Archetype): readonly string[] =>
  archetype.kind === 'cohort' ? naming.cohortSuffixes : naming.biomassSuffixes;

function epithetLoci(params: ParameterSet, archetype: Archetype): LocusDef[] {
  const excluded = new Set<LocusId>([...GENUS_LOCI[archetype.kind], 'mutation']);
  return lociFor(params, archetype).filter((locus) => !excluded.has(locus.id));
}

function ending(naming: NamingParams, suffix: string): string {
  if (naming.neuterSuffixes.includes(suffix)) return 'um';
  if (naming.masculineSuffixes.includes(suffix)) return 'us';
  return 'a';
}

function genusName(
  naming: NamingParams,
  archetype: Archetype,
  link: number,
  size: number,
  suffix: number,
): string {
  const suffixes = suffixesOf(naming, archetype);
  return `${archetype.latinStem}${naming.genusLinks[link] ?? ''}${naming.sizeSyllables[size] ?? ''}${suffixes[suffix] ?? ''}`;
}

function nameParts(params: ParameterSet, archetype: Archetype, code: GenotypeCode): NameParts {
  const naming = params.naming;
  const loci = lociFor(params, archetype);
  const { alleles } = decodeGenotype(params, archetype, code);
  const value = (id: LocusId): number => alleles[loci.findIndex((locus) => locus.id === id)] ?? 0;
  const [linkLocus, sizeLocus, suffixLocus] = GENUS_LOCI[archetype.kind] as [
    LocusId,
    LocusId,
    LocusId,
  ];
  const suffix = suffixesOf(naming, archetype)[value(suffixLocus)] ?? '';
  const table = syllables(naming);
  let index = 0;
  let place = 1;
  for (const locus of epithetLoci(params, archetype)) {
    index += value(locus.id) * place;
    place *= locus.labelsZh.length;
  }
  const picked: string[] = [];
  for (let position = 0; position < naming.epithetSyllables[archetype.kind]; position += 1) {
    picked.push(table[index % table.length] ?? '');
    index = Math.floor(index / table.length);
  }
  return {
    genus: genusName(naming, archetype, value(linkLocus), value(sizeLocus), value(suffixLocus)),
    epithet: picked.join('') + ending(naming, suffix),
    variety: naming.varietyNames[value('mutation')] ?? '',
  };
}

/** Bijective Latin name for a genotype (docs/05 §4.1). */
export function scientificName(
  params: ParameterSet,
  archetype: Archetype,
  code: GenotypeCode,
): string {
  const parts = nameParts(params, archetype, code);
  const binomial = `${parts.genus} ${parts.epithet}`;
  return parts.variety === '' ? binomial : `${binomial} var. ${parts.variety}`;
}

/** Inverse of scientificName within one archetype. */
export function genotypeFromScientificName(
  params: ParameterSet,
  archetype: Archetype,
  name: string,
): GenotypeCode {
  const naming = params.naming;
  const match = /^(\S+) (\S+)(?: var\. (\S+))?$/.exec(name);
  if (match === null) throw new Error(`Malformed name: ${name}`);
  const [, genus = '', epithet = '', variety = ''] = match;
  const loci = lociFor(params, archetype);
  const alleles = Array<number>(loci.length).fill(0);
  const set = (id: LocusId, allele: number): void => {
    alleles[loci.findIndex((locus) => locus.id === id)] = allele;
  };
  const [linkLocus, sizeLocus, suffixLocus] = GENUS_LOCI[archetype.kind] as [
    LocusId,
    LocusId,
    LocusId,
  ];
  const suffixes = suffixesOf(naming, archetype);
  let found = false;
  for (let link = 0; link < naming.genusLinks.length && !found; link += 1) {
    for (let size = 0; size < naming.sizeSyllables.length && !found; size += 1) {
      for (let suffix = 0; suffix < suffixes.length && !found; suffix += 1) {
        if (genusName(naming, archetype, link, size, suffix) === genus) {
          set(linkLocus, link);
          set(sizeLocus, size);
          set(suffixLocus, suffix);
          found = true;
        }
      }
    }
  }
  if (!found) throw new Error(`Unknown genus for ${archetype.id}: ${genus}`);
  const suffix = suffixes[alleles[loci.findIndex((locus) => locus.id === suffixLocus)] ?? 0] ?? '';
  const stem = epithet.slice(0, epithet.length - ending(naming, suffix).length);
  const table = syllables(naming);
  let index = 0;
  let place = 1;
  for (const digit of parseSyllables(table, stem, naming.epithetSyllables[archetype.kind])) {
    index += digit * place;
    place *= table.length;
  }
  const epithetAlleles = allelesFromIndex(epithetLoci(params, archetype), index);
  epithetLoci(params, archetype).forEach((locus, position) =>
    set(locus.id, epithetAlleles[position] ?? 0),
  );
  const mutation = naming.varietyNames.indexOf(variety || '');
  if (mutation < 0) throw new Error(`Unknown variety: ${variety}`);
  set('mutation', mutation);
  return encodeGenotype(params, archetype, alleles);
}

/** Splits an epithet stem into syllable indices; syllables are consonant(s) + one vowel. */
function parseSyllables(table: readonly string[], stem: string, count: number): number[] {
  const digits: number[] = [];
  let rest = stem;
  for (let position = 0; position < count; position += 1) {
    const match = table
      .map((syllable, index) => ({ syllable, index }))
      .filter(({ syllable }) => rest.startsWith(syllable))
      .sort((a, b) => b.syllable.length - a.syllable.length)[0];
    if (match === undefined) throw new Error(`Cannot parse epithet syllables: ${stem}`);
    digits.push(match.index);
    rest = rest.slice(match.syllable.length);
  }
  if (rest.length > 0) throw new Error(`Trailing epithet text: ${stem}`);
  return digits;
}

/** Descriptive Chinese name (docs/05 §4.2); not unique. */
export function commonName(params: ParameterSet, archetype: Archetype, code: GenotypeCode): string {
  const naming = params.naming;
  const loci = lociFor(params, archetype);
  const { alleles } = decodeGenotype(params, archetype, code);
  const value = (id: LocusId): number => alleles[loci.findIndex((locus) => locus.id === id)] ?? 0;
  const mutation = MUTATIONS[value('mutation')] ?? 'none';
  const modifiers: string[] = [];
  const add = (modifier: string | undefined): void => {
    if (modifier !== undefined && modifier !== '' && modifiers.length < naming.maxModifiers) {
      modifiers.push(modifier);
    }
  };
  add(naming.mutationModifierZh[value('mutation')]);
  const size = value('size');
  if (size === 0) add(naming.modifierZh.smallest);
  if (size === naming.sizeSyllables.length - 1) add(naming.modifierZh.largest);
  if (mutation !== 'albino' && mutation !== 'melanistic') {
    add(
      (archetype.kind === 'cohort'
        ? naming.cohortPigmentModifierZh
        : naming.biomassPigmentModifierZh)[value('pigment')],
    );
  }
  if (archetype.kind === 'cohort') {
    add(naming.patternModifierZh[value('pattern')]);
    if (value('activity') === 1) add(naming.modifierZh.nocturnal);
    const defenses = archetype.defenses[value('defense')] ?? [];
    add(
      defenses
        .map((defense) => naming.defenseModifierZh[defense])
        .find((label) => label !== undefined),
    );
  }
  const thermal = value('thermal');
  if (thermal === 0) add(naming.modifierZh.cold);
  if (thermal === 4) add(naming.modifierZh.hot);
  return `${modifiers.join('')}${archetype.nounZh}`;
}
