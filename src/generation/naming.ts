import type { Archetype } from '../content/archetype';
import { allelesFromIndex, decodeGenotype, encodeGenotype, type GenotypeCode } from './genotype';
import {
  BIOMASS_PIGMENTS_ZH,
  COHORT_PIGMENTS_ZH,
  lociFor,
  MUTATION_LABELS_ZH,
  MUTATIONS,
  type LocusDef,
  type LocusId,
} from './loci';

/** docs/05 §4.1: shared links appended to the archetype stem, chosen by diet or metabolism. */
export const GENUS_LINKS = ['ra', 'li', 'mo', 'ne'] as const;
export const SIZE_SYLLABLES = ['pi', 'mi', 'ta', 'ro', 'ma', 'gra', 'gi'] as const;
export const COHORT_SUFFIXES = ['ella', 'opsis'] as const;
export const BIOMASS_SUFFIXES = [
  'ella',
  'ina',
  'ula',
  'ia',
  'ium',
  'opsis',
  'ites',
  'ora',
] as const;
const CONSONANTS = [
  'b',
  'c',
  'd',
  'f',
  'g',
  'l',
  'm',
  'n',
  'p',
  'r',
  's',
  't',
  'v',
  'qu',
  'th',
  'ph',
];
const VOWELS = ['a', 'e', 'i', 'o'];
const SYLLABLES = CONSONANTS.flatMap((consonant) => VOWELS.map((vowel) => consonant + vowel));
const EPITHET_SYLLABLES = { cohort: 4, biomass: 3 } as const;
const NEUTER_SUFFIXES: ReadonlySet<string> = new Set(['ium']);
const MASCULINE_SUFFIXES: ReadonlySet<string> = new Set(['ites']);
export const VARIETY_NAMES = [
  '',
  'albina',
  'melanica',
  'gigantea',
  'nana',
  'lucifera',
  'longaeva',
  'fecunda',
  'eurytherma',
  'euryhalina',
  'resistens',
] as const;

const GENUS_LOCI: Readonly<Record<'cohort' | 'biomass', readonly LocusId[]>> = {
  cohort: ['diet', 'size', 'habitat'],
  biomass: ['metabolism', 'size', 'morphology'],
};

interface NameParts {
  readonly genus: string;
  readonly epithet: string;
  readonly variety: string;
}

function epithetLoci(archetype: Archetype): LocusDef[] {
  const excluded = new Set<LocusId>([...GENUS_LOCI[archetype.kind], 'mutation']);
  return lociFor(archetype).filter((locus) => !excluded.has(locus.id));
}

function ending(suffix: string): string {
  if (NEUTER_SUFFIXES.has(suffix)) return 'um';
  if (MASCULINE_SUFFIXES.has(suffix)) return 'us';
  return 'a';
}

function genusName(archetype: Archetype, link: number, size: number, suffix: number): string {
  const suffixes = archetype.kind === 'cohort' ? COHORT_SUFFIXES : BIOMASS_SUFFIXES;
  return `${archetype.latinStem}${GENUS_LINKS[link] ?? ''}${SIZE_SYLLABLES[size] ?? ''}${suffixes[suffix] ?? ''}`;
}

function nameParts(archetype: Archetype, code: GenotypeCode): NameParts {
  const loci = lociFor(archetype);
  const { alleles } = decodeGenotype(archetype, code);
  const value = (id: LocusId): number => alleles[loci.findIndex((locus) => locus.id === id)] ?? 0;
  const [linkLocus, sizeLocus, suffixLocus] = GENUS_LOCI[archetype.kind] as [
    LocusId,
    LocusId,
    LocusId,
  ];
  const suffixes = archetype.kind === 'cohort' ? COHORT_SUFFIXES : BIOMASS_SUFFIXES;
  const suffix = suffixes[value(suffixLocus)] ?? '';
  let index = 0;
  let place = 1;
  for (const locus of epithetLoci(archetype)) {
    index += value(locus.id) * place;
    place *= locus.labelsZh.length;
  }
  const syllables: string[] = [];
  for (let position = 0; position < EPITHET_SYLLABLES[archetype.kind]; position += 1) {
    syllables.push(SYLLABLES[index % SYLLABLES.length] ?? '');
    index = Math.floor(index / SYLLABLES.length);
  }
  return {
    genus: genusName(archetype, value(linkLocus), value(sizeLocus), value(suffixLocus)),
    epithet: syllables.join('') + ending(suffix),
    variety: VARIETY_NAMES[value('mutation')] ?? '',
  };
}

/** Bijective Latin name for a genotype (docs/05 §4.1). */
export function scientificName(archetype: Archetype, code: GenotypeCode): string {
  const parts = nameParts(archetype, code);
  const binomial = `${parts.genus} ${parts.epithet}`;
  return parts.variety === '' ? binomial : `${binomial} var. ${parts.variety}`;
}

/** Inverse of scientificName within one archetype. */
export function genotypeFromScientificName(archetype: Archetype, name: string): GenotypeCode {
  const match = /^(\S+) (\S+)(?: var\. (\S+))?$/.exec(name);
  if (match === null) throw new Error(`Malformed name: ${name}`);
  const [, genus = '', epithet = '', variety = ''] = match;
  const loci = lociFor(archetype);
  const alleles = Array<number>(loci.length).fill(0);
  const set = (id: LocusId, allele: number): void => {
    alleles[loci.findIndex((locus) => locus.id === id)] = allele;
  };
  const [linkLocus, sizeLocus, suffixLocus] = GENUS_LOCI[archetype.kind] as [
    LocusId,
    LocusId,
    LocusId,
  ];
  const suffixes = archetype.kind === 'cohort' ? COHORT_SUFFIXES : BIOMASS_SUFFIXES;
  let found = false;
  for (let link = 0; link < GENUS_LINKS.length && !found; link += 1) {
    for (let size = 0; size < SIZE_SYLLABLES.length && !found; size += 1) {
      for (let suffix = 0; suffix < suffixes.length && !found; suffix += 1) {
        if (genusName(archetype, link, size, suffix) === genus) {
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
  const stem = epithet.slice(0, epithet.length - ending(suffix).length);
  let index = 0;
  let place = 1;
  for (const digit of parseSyllables(stem, EPITHET_SYLLABLES[archetype.kind])) {
    index += digit * place;
    place *= SYLLABLES.length;
  }
  const epithetAlleles = allelesFromIndex(epithetLoci(archetype), index);
  epithetLoci(archetype).forEach((locus, position) => set(locus.id, epithetAlleles[position] ?? 0));
  const mutation = VARIETY_NAMES.indexOf((variety || '') as (typeof VARIETY_NAMES)[number]);
  if (mutation < 0) throw new Error(`Unknown variety: ${variety}`);
  set('mutation', mutation);
  return encodeGenotype(archetype, alleles);
}

/** Splits an epithet stem into syllable indices; syllables are consonant(s) + one vowel. */
function parseSyllables(stem: string, count: number): number[] {
  const digits: number[] = [];
  let rest = stem;
  for (let position = 0; position < count; position += 1) {
    const match = SYLLABLES.map((syllable, index) => ({ syllable, index }))
      .filter(({ syllable }) => rest.startsWith(syllable))
      .sort((a, b) => b.syllable.length - a.syllable.length)[0];
    if (match === undefined) throw new Error(`Cannot parse epithet syllables: ${stem}`);
    digits.push(match.index);
    rest = rest.slice(match.syllable.length);
  }
  if (rest.length > 0) throw new Error(`Trailing epithet text: ${stem}`);
  return digits;
}

const MUTATION_MODIFIER_ZH: Readonly<Record<(typeof MUTATIONS)[number], string>> = {
  ...MUTATION_LABELS_ZH,
  none: '',
  gigantism: '巨型',
  dwarfism: '侏儒',
  bioluminescent: '螢光',
};
const PATTERN_MODIFIER_ZH = ['', '斑', '紋', '環', '網', '虎', '漸', '擬'];
const BIOMASS_PIGMENT_MODIFIER_ZH = ['綠', '褐', '紅', '藍綠', '金', '白'];
const DEFENSE_MODIFIER_ZH: Readonly<Record<string, string>> = {
  shell: '甲',
  armor: '甲',
  spines: '棘',
  toxin: '毒',
  venom: '毒',
};
const MAX_MODIFIERS = 2;

/** Descriptive Chinese name (docs/05 §4.2); not unique. */
export function commonName(archetype: Archetype, code: GenotypeCode): string {
  const loci = lociFor(archetype);
  const { alleles } = decodeGenotype(archetype, code);
  const value = (id: LocusId): number => alleles[loci.findIndex((locus) => locus.id === id)] ?? 0;
  const mutation = MUTATIONS[value('mutation')] ?? 'none';
  const modifiers: string[] = [];
  const add = (modifier: string | undefined): void => {
    if (modifier !== undefined && modifier !== '' && modifiers.length < MAX_MODIFIERS) {
      modifiers.push(modifier);
    }
  };
  add(MUTATION_MODIFIER_ZH[mutation]);
  const size = value('size');
  if (size === 0) add('微');
  if (size === SIZE_SYLLABLES.length - 1) add('巨');
  if (mutation !== 'albino' && mutation !== 'melanistic') {
    if (archetype.kind === 'cohort') {
      const pigment = COHORT_PIGMENTS_ZH[value('pigment')];
      add(pigment === '透明' ? '透' : pigment);
    } else {
      add(BIOMASS_PIGMENT_MODIFIER_ZH[value('pigment')]);
    }
  }
  if (archetype.kind === 'cohort') {
    add(PATTERN_MODIFIER_ZH[value('pattern')]);
    if (value('activity') === 1) add('夜');
    const defenses = archetype.defenses[value('defense')] ?? [];
    add(
      defenses.map((defense) => DEFENSE_MODIFIER_ZH[defense]).find((label) => label !== undefined),
    );
  }
  const thermal = value('thermal');
  if (thermal === 0) add('寒');
  if (thermal === 4) add('熱');
  return `${modifiers.join('')}${archetype.nounZh}`;
}

export const BIOMASS_PIGMENT_COUNT = BIOMASS_PIGMENTS_ZH.length;
