import type { Archetype } from '../content/archetype';
import type { ParameterSet } from '../content/parameters';
import type { GenotypeCode } from './genotype';
import { commonName, scientificName } from './naming';
import { derivePhenotype, type Phenotype } from './phenotype';
import { rarityScore, rarityTier, type RarityTier } from './rarity';

export type SpeciesOrigin =
  | 'background'
  | 'water'
  | 'hitchhiker'
  | 'open_inflow'
  | 'outside'
  | 'feeder'
  | 'release'
  | 'mutation';

/** Persisted species record; everything else derives from the code (docs/05 §1). */
export interface SpeciesRecord {
  readonly id: GenotypeCode;
  readonly origin: SpeciesOrigin;
  readonly parentId?: GenotypeCode;
  /** collected from a realm other than the tank's own */
  readonly introduced: boolean;
}

export interface SpeciesView {
  readonly record: SpeciesRecord;
  readonly scientificName: string;
  readonly commonName: string;
  readonly rarityScore: number;
  readonly rarity: RarityTier;
  readonly phenotype: Phenotype;
}

export function describeSpecies(
  params: ParameterSet,
  archetype: Archetype,
  record: SpeciesRecord,
): SpeciesView {
  const score = rarityScore(params, archetype, record.id);
  return {
    record,
    scientificName: scientificName(params, archetype, record.id),
    commonName: commonName(params, archetype, record.id),
    rarityScore: score,
    rarity: rarityTier(params, score),
    phenotype: derivePhenotype(params, archetype, record.id),
  };
}

/** Registry kept in simulation state: plain object keyed by species ID. */
export type SpeciesRegistry = Readonly<Record<GenotypeCode, SpeciesRecord>>;

export function registerSpecies(registry: SpeciesRegistry, record: SpeciesRecord): SpeciesRegistry {
  return record.id in registry ? registry : { ...registry, [record.id]: record };
}
