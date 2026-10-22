import type { Archetype, FoodKind, MetabolicClass } from './archetype';
import { ARCHETYPE_IDS, type ArchetypeId } from './archetypeIds';
import type { ClimateNormal, EvaporationProfile } from './climate';
import { HABITAT_IDS, type HabitatId, type HabitatSpec, type LightClass } from './habitats';
import type { AltitudeBand, LatitudeZone, OceanRegion, RealmCode } from './location';
import type { GenerationParams, NamingParams } from './genetics';
import type { MechanicsParams, PhysicsParams, SetupParams } from './mechanics';
import { MICROBE_IDS, type MicrobeId } from './microbes';
import { nestLeaves, type LeafRow } from './parameterTree';
import type { BodyComposition, ConsumerClass, FoodClass, MetabolicScaling } from './physiology';
import type { NativeRange } from './realms';
import type { Sourced } from './sourced';
import type { Source } from './sources';
import { SUBSTANCE_IDS, type SubstanceId, type SubstanceSpec } from './substances';
import type {
  FilterId,
  FilterSpec,
  HardscapeId,
  LandSubstrateId,
  LandSubstrateSpec,
  SubstrateId,
  SubstrateSpec,
} from './tankOptions';
import type { WaterSourceId, WaterSourceSpec } from './waterSources';

type Group<K extends string> = Readonly<Record<K, Sourced>>;

export interface StoichiometryParams {
  readonly base: Group<
    | 'codPerDryBiomass'
    | 'nPerBiomassCod'
    | 'nPerInertCod'
    | 'pPerBiomassCod'
    | 'inertFractionOfDecay'
    | 'cellDryMassMg'
    | 'o2PerNByAob'
    | 'o2PerNByNob'
    | 'alkalinityPerNEquivalent'
    | 'caco3PerDkh'
    | 'respiratoryQuotient'
  >;
  readonly food: Group<
    'proteinFraction' | 'nPerDryMass' | 'codPerDryMass' | 'pPerDryMass' | 'leachingPerDay'
  >;
  readonly litter: Group<'codPerDryMass' | 'nPerDryMass' | 'pPerDryMass'>;
  readonly capacity: Group<'dryMassPerChlorophyll' | 'fullCoverDryGPerM2'>;
  readonly production: Group<'silicaPerDiatomCod' | 'soilPorosity'>;
}

export interface MicrobeParams {
  readonly temperatureTheta: Sourced;
  readonly processes: Group<
    | 'hydrolysisRate'
    | 'hydrolysisHalfSat'
    | 'nitrateHalfSat'
    | 'litterDecayPerYear'
    | 'litterMoistureOptimum'
    | 'biofilmCapacityPerM2'
    | 'freeBacteriaCapacity'
    | 'soilMicrobeCodPerG'
    | 'soilSubstrateHalfSatPerM2'
    | 'soilActivityReference'
    | 'initialSoilMicrobeFraction'
  >;
  readonly backgroundSeeding: Readonly<Record<MicrobeId, Sourced>>;
}

export interface PhysiologyParams {
  readonly bodyComposition: Readonly<Record<MetabolicClass, BodyComposition>>;
  readonly metabolicScaling: Readonly<Record<ConsumerClass, MetabolicScaling>>;
  readonly metabolicQ10: Sourced;
  readonly maxIngestionMultiplier: Readonly<Record<ConsumerClass, Sourced>>;
  readonly foodClass: Readonly<Record<FoodKind, FoodClass>>;
  readonly assimilationEfficiency: Readonly<Record<FoodClass, Sourced>>;
  readonly functionalResponseExponent: Sourced;
  readonly foodHalfSaturation: Readonly<
    Record<FoodClass, { readonly water: Sourced; readonly land: Sourced }>
  >;
  readonly negligibleSenescenceHazard: Sourced;
  readonly coralSymbiosis: Group<'photosynthatePerHostCod' | 'bleachingPpfd' | 'calciumPerHostCod'>;
  readonly sediment: Group<
    | 'porewaterShare'
    | 'porosity'
    | 'exchangeTan'
    | 'exchangePo4'
    | 'rootShareA'
    | 'rootShareB'
    | 'rootShareC'
    | 'rootHalfSatP'
    | 'rootHalfSatN'
  >;
}

export interface TankOptionParams {
  readonly substrates: Readonly<Record<SubstrateId, SubstrateSpec>>;
  readonly wildSedimentNutrients: Group<'exchangeableN' | 'exchangeableP'>;
  readonly wildSubstrateAnoxicBonus: Sourced;
  readonly hardscapeSurface: Readonly<Record<HardscapeId, Sourced>>;
  readonly filters: Readonly<Record<FilterId, FilterSpec>>;
  readonly landSubstrates: Readonly<Record<LandSubstrateId, LandSubstrateSpec>>;
  readonly wildMaterials: Group<
    | 'biofilmOrganicPerM2'
    | 'biofilmBacteriaPerCm2'
    | 'nitrifierShare'
    | 'denitrifierShare'
    | 'organicSubstrateDepthCm'
    | 'soilBacteriaPerG'
    | 'soilBulkDensity'
    | 'fungusToBacteriaRatio'
  >;
  readonly wildLitterStock: Readonly<Record<LatitudeZone, Sourced>>;
}

export interface WaterSourceParams {
  readonly labileDocFraction: Sourced;
  readonly codPerOrganicCarbon: Sourced;
  readonly sources: Readonly<Record<WaterSourceId, WaterSourceSpec>>;
  readonly seaSaltMix: Group<'khAt35Ppt' | 'caAt35Ppt'>;
  readonly rainChemistry: Group<'ammoniumN' | 'nitrateN'>;
}

export type EvaporationKey = LatitudeZone | 'arid' | 'semiarid';

export interface ClimateParams {
  readonly normals: Readonly<Partial<Record<string, ClimateNormal>>>;
  /** `${zone}:${moisture}` keys split further by continentality */
  readonly continentalitySplit: readonly string[];
  readonly evaporation: Readonly<Record<EvaporationKey, EvaporationProfile>>;
  readonly sunshineFraction: Group<'wetSeason' | 'drySeason' | 'evenRain'>;
  readonly rainDayDivisorMm: Sourced;
}

export interface HabitatParams {
  readonly lightPpfd: Readonly<Record<LightClass, number>>;
  readonly specs: Readonly<Record<HabitatId, HabitatSpec>>;
}

export interface BandRange {
  readonly min: number;
  readonly max: number;
  readonly representative: number;
}

export interface LocationParams {
  readonly latitudeRange: Readonly<Record<LatitudeZone, BandRange>>;
  readonly altitudeRange: Readonly<Record<AltitudeBand, BandRange>>;
  readonly realmOceans: Readonly<Record<RealmCode, readonly OceanRegion[]>>;
  readonly realmNamesZh: Readonly<Record<RealmCode, string>>;
}

/** All reference data the simulation reads, keyed by id (docs/10 §2.1). */
export interface ParameterSet {
  readonly sources: Readonly<Record<string, Source>>;
  readonly substances: Readonly<Record<SubstanceId, SubstanceSpec>>;
  readonly archetypes: Readonly<Record<ArchetypeId, Archetype>>;
  readonly preyKinds: Readonly<Record<ArchetypeId, readonly FoodKind[]>>;
  readonly nativeRanges: Readonly<Record<ArchetypeId, NativeRange>>;
  readonly stoichiometry: StoichiometryParams;
  readonly microbes: MicrobeParams;
  readonly physiology: PhysiologyParams;
  readonly tankOptions: TankOptionParams;
  readonly waterSources: WaterSourceParams;
  readonly climate: ClimateParams;
  readonly habitats: HabitatParams;
  readonly location: LocationParams;
  readonly physics: PhysicsParams;
  readonly mechanics: MechanicsParams;
  readonly setup: SetupParams;
  readonly generation: GenerationParams;
  readonly naming: NamingParams;
}

export interface ArchetypeRow {
  readonly id: string;
  readonly nameZh: string;
  readonly layer: string;
  readonly zone: string;
  readonly kind: string;
  readonly category: string;
  readonly metabolicClass: string;
  readonly latinStem: string;
  readonly nounZh: string;
  readonly position: number;
}

export interface ArchetypeTagRow {
  readonly archetypeId: string;
  readonly tag: string;
  readonly position: number;
  readonly item: number;
  readonly value: string;
  readonly weight: number | null;
}

/** Rows read from the ref_ tables. */
export interface ReferenceRows {
  readonly sources: readonly {
    readonly id: string;
    readonly title: string;
    readonly url: string | null;
  }[];
  readonly substances: readonly SubstanceSpec[];
  readonly params: readonly LeafRow[];
  readonly archetypes: readonly ArchetypeRow[];
  readonly archetypeParams: readonly (LeafRow & { readonly archetypeId: string })[];
  readonly archetypeTags: readonly ArchetypeTagRow[];
}

const DIET_ALTERNATIVES = 4;
const DEFENSE_ALTERNATIVES = 4;
const HABITAT_ALTERNATIVES = 2;

/** Throws when any required id is missing from a record of reference data. */
function requireIds(label: string, record: object, ids: readonly string[]): void {
  const missing = ids.filter((id) => !(id in record));
  if (missing.length > 0) throw new Error(`Reference data lacks ${label}: ${missing.join(', ')}`);
}

function group<T>(tree: Record<string, unknown>, key: string): T {
  const value = tree[key];
  if (value === undefined) throw new Error(`Reference data lacks group ${key}`);
  return value as T;
}

function tagLists(rows: readonly ArchetypeTagRow[]) {
  const byTag = new Map<string, ArchetypeTagRow[]>();
  for (const row of rows) {
    const list = byTag.get(row.tag);
    if (list === undefined) byTag.set(row.tag, [row]);
    else list.push(row);
  }
  const sorted = (tag: string): ArchetypeTagRow[] =>
    [...(byTag.get(tag) ?? [])].sort((a, b) => a.position - b.position || a.item - b.item);
  const flat = (tag: string): string[] => sorted(tag).map((row) => row.value);
  const alternatives = (tag: string, count: number): string[][] =>
    Array.from({ length: count }, (_, position) =>
      sorted(tag)
        .filter((row) => row.position === position)
        .map((row) => row.value),
    );
  return { byTag, sorted, flat, alternatives };
}

function buildArchetype(
  row: ArchetypeRow,
  params: readonly LeafRow[],
  tags: readonly ArchetypeTagRow[],
): { archetype: Archetype; preyKinds: FoodKind[]; nativeRange: NativeRange } {
  const tree = nestLeaves(params);
  const lists = tagLists(tags);
  const nativeTree = (tree.nativeRange ?? {}) as { basis: NativeRange['basis']; source?: string };
  delete tree.nativeRange;
  const record: Record<string, unknown> = {
    id: row.id,
    nameZh: row.nameZh,
    layer: row.layer,
    zone: row.zone,
    kind: row.kind,
    category: row.category,
    metabolicClass: row.metabolicClass,
    salinityClasses: lists.flat('salinityClasses'),
    vectors: lists.flat('vectors'),
    latinStem: row.latinStem,
    nounZh: row.nounZh,
    flags: lists.flat('flags'),
    ...tree,
  };
  if (lists.byTag.has('extraVectors')) record.extraVectors = lists.flat('extraVectors');
  if (row.kind === 'biomass') {
    record.morphologies = lists.flat('morphologies');
    if (lists.byTag.has('prey')) record.prey = lists.flat('prey');
  } else {
    record.diets = Array.from({ length: DIET_ALTERNATIVES }, (_, position) =>
      Object.fromEntries(
        lists
          .sorted('diets')
          .filter((tag) => tag.position === position)
          .map((tag) => [tag.value, tag.weight ?? 0]),
      ),
    );
    record.defenses = lists.alternatives('defenses', DEFENSE_ALTERNATIVES);
    record.habitats = lists.alternatives('habitats', HABITAT_ALTERNATIVES);
  }
  const nativeRange: NativeRange =
    nativeTree.source === undefined
      ? {
          realms: lists.flat('nativeRealms') as RealmCode[],
          oceans: lists.flat('nativeOceans') as OceanRegion[],
          basis: nativeTree.basis,
        }
      : {
          realms: lists.flat('nativeRealms') as RealmCode[],
          oceans: lists.flat('nativeOceans') as OceanRegion[],
          basis: nativeTree.basis,
          source: nativeTree.source,
        };
  return {
    archetype: record as unknown as Archetype,
    preyKinds: lists.flat('preyKinds') as FoodKind[],
    nativeRange,
  };
}

/** Builds the typed parameter set from ref_ rows and checks that every archetype is present. */
export function buildParameterSet(rows: ReferenceRows): ParameterSet {
  const sources = Object.fromEntries(
    rows.sources.map((source) => [
      source.id,
      source.url === null ? { title: source.title } : { title: source.title, url: source.url },
    ]),
  );
  const paramsByArchetype = new Map<string, LeafRow[]>();
  for (const row of rows.archetypeParams) {
    const list = paramsByArchetype.get(row.archetypeId);
    if (list === undefined) paramsByArchetype.set(row.archetypeId, [row]);
    else list.push(row);
  }
  const tagsByArchetype = new Map<string, ArchetypeTagRow[]>();
  for (const row of rows.archetypeTags) {
    const list = tagsByArchetype.get(row.archetypeId);
    if (list === undefined) tagsByArchetype.set(row.archetypeId, [row]);
    else list.push(row);
  }
  const archetypes: Partial<Record<ArchetypeId, Archetype>> = {};
  const preyKinds: Partial<Record<ArchetypeId, readonly FoodKind[]>> = {};
  const nativeRanges: Partial<Record<ArchetypeId, NativeRange>> = {};
  for (const row of rows.archetypes) {
    const built = buildArchetype(
      row,
      paramsByArchetype.get(row.id) ?? [],
      tagsByArchetype.get(row.id) ?? [],
    );
    const id = row.id as ArchetypeId;
    archetypes[id] = built.archetype;
    preyKinds[id] = built.preyKinds;
    nativeRanges[id] = built.nativeRange;
  }
  requireIds('archetypes', archetypes, ARCHETYPE_IDS);
  const substances = Object.fromEntries(rows.substances.map((spec) => [spec.id, spec]));
  requireIds('substances', substances, SUBSTANCE_IDS);
  const tree = nestLeaves(rows.params);
  const habitats = group<HabitatParams>(tree, 'habitats');
  requireIds('habitats', habitats.specs, HABITAT_IDS);
  const microbes = group<MicrobeParams>(tree, 'microbes');
  requireIds('background seeding', microbes.backgroundSeeding, MICROBE_IDS);
  return {
    sources,
    substances: substances as Record<SubstanceId, SubstanceSpec>,
    archetypes: archetypes as Record<ArchetypeId, Archetype>,
    preyKinds: preyKinds as Record<ArchetypeId, readonly FoodKind[]>,
    nativeRanges: nativeRanges as Record<ArchetypeId, NativeRange>,
    stoichiometry: group(tree, 'stoichiometry'),
    microbes,
    physiology: group(tree, 'physiology'),
    tankOptions: group(tree, 'tankOptions'),
    waterSources: group(tree, 'waterSources'),
    climate: group(tree, 'climate'),
    habitats,
    location: group(tree, 'location'),
    physics: group(tree, 'physics'),
    mechanics: group(tree, 'mechanics'),
    setup: group(tree, 'setup'),
    generation: group(tree, 'generation'),
    naming: group(tree, 'naming'),
  };
}
