import type { HabitatId } from '../content/habitats';
import type {
  AltitudeBand,
  Continentality,
  Hemisphere,
  LatitudeZone,
  Moisture,
  RealmCode,
} from '../content/location';
import type { ArchetypeId } from '../content/archetypeIds';
import type { Vector } from '../content/archetype';
import type { GenotypeCode, SpeciesRecord } from '../generation/index';
import type {
  FilterId,
  HardscapeId,
  LandSubstrateId,
  MaterialSource,
  SubstrateId,
} from '../content/tankOptions';
import type { WaterSourceId } from '../content/waterSources';

export interface LocationConfig {
  readonly hemisphere: Hemisphere;
  readonly latitudeZone: LatitudeZone;
  readonly altitudeBand: AltitudeBand;
  readonly moisture: Moisture;
  readonly continentality: Continentality;
  readonly habitat: HabitatId;
  readonly realm: RealmCode;
  readonly latitudeDeg: number;
  readonly altitudeM: number;
}

export type Placement = 'indoor' | 'outdoor';

export interface HardscapeItem {
  readonly type: HardscapeId;
  readonly source: MaterialSource;
}

export interface TankConfig {
  readonly location: LocationConfig;
  readonly placement: Placement;
  readonly startDayOfYear: number;
  readonly lengthCm: number;
  readonly widthCm: number;
  readonly heightCm: number;
  readonly waterDepthCm: number;
  /** 0–1 */
  readonly landFraction: number;
  /** target salinity; natural salt water is diluted with RO water or topped up with sea salt */
  readonly salinityPpt: number;
  readonly waterSource: WaterSourceId;
  /** where wild water was collected */
  readonly waterRealm: RealmCode;
  readonly substrate: SubstrateId;
  readonly substrateDepthCm: number;
  readonly substrateSource: MaterialSource;
  readonly hardscape: readonly HardscapeItem[];
  readonly filter: FilterId;
  /** 0–1 */
  readonly aeration: number;
  /** null = no heater */
  readonly heaterSetpointC: number | null;
  readonly roomTemperatureC: number;
  /** µmol·m⁻²·s⁻¹ while lamps are on */
  readonly lightPpfd: number;
  readonly photoperiodH: number;
  readonly seasonalLighting: boolean;
  /** 0–0.9, outdoor */
  readonly shading: number;
  readonly landSubstrate: LandSubstrateId | null;
  readonly landSubstrateDepthCm: number;
  readonly landSubstrateSource: MaterialSource;
  readonly mistingPerDay: number;
  /** null = no basking lamp */
  readonly baskingC: number | null;
  readonly uvb: boolean;
  readonly lid: boolean;
  readonly tide: boolean;
  readonly seasonalDrying: boolean;
  /** connected to a pond or the sea; enables `open_inflow` */
  readonly openInflow: boolean;
}

/** Organic matter as COD with its nitrogen and phosphorus, all in mg. */
export interface OrganicPool {
  cod: number;
  n: number;
  p: number;
}

/** Water pools are total masses (mg) so volume changes conserve mass. */
export interface WaterState {
  volumeL: number;
  temperatureC: number;
  saltMg: number;
  /** alkalinity as mg CaCO3 */
  alkalinityMg: number;
  o2: number;
  co2: number;
  /** mg N */
  tan: number;
  /** mg N */
  no2: number;
  /** mg N */
  no3: number;
  /** mg P */
  po4: number;
  sio2: number;
  ca: number;
  /** readily biodegradable dissolved COD */
  substrateCod: number;
  food: OrganicPool;
  detritus: OrganicPool;
  inert: OrganicPool;
  /** exchangeable ammonium in the substrate, mg N */
  sedimentTan: number;
  /** exchangeable phosphate in the substrate, mg P */
  sedimentPo4: number;
  iceCover: boolean;
  snowOnIce: boolean;
}

export interface LandState {
  airTemperatureC: number;
  /** % */
  humidity: number;
  /** 0–1 */
  soilMoisture: number;
  litter: OrganicPool;
  /** dissolved soil organic COD released by litter decay */
  soilSubstrateCod: number;
  /** mg N */
  soilTan: number;
  /** mg P */
  soilPo4: number;
}

export interface ClimateState {
  dayOfYear: number;
  ambientTemperatureC: number;
  ambientDayMeanC: number;
  ambientHumidity: number;
  dayLengthH: number;
  ppfd: number;
  rainTodayMm: number;
  evaporationTodayMm: number;
  sunshine: number;
  wetSeason: boolean | null;
}

interface PopulationBase {
  readonly id: string;
  readonly speciesId: GenotypeCode;
  readonly archetypeId: ArchetypeId;
  /** arrival route (docs/02 §1) */
  readonly vector: Vector;
  readonly arrivedTick: number;
  /** tick the establishment check passed (docs/04 §7); null before */
  establishedTick: number | null;
  /** consecutive game days of net growth */
  growthStreakDays: number;
  /** total biomass at the start of the current game day, mg COD */
  dayStartCod: number;
  /** size at the start of each of the last 3 game days: individuals (cohort) or mg COD */
  recentDaySize: number[];
}

/** docs/04 §5.6: microbes, algae, protists, plants, fungi. */
export interface BiomassPopulation extends PopulationBase {
  readonly kind: 'biomass';
  /** mg COD */
  cod: number;
  /** clonal_aging: divisions since the last sexual reproduction */
  clonalGenerations: number;
  /** clonal_aging: collapse already reported */
  collapsed: boolean;
}

/** docs/04 §5.6: individuals born on the same game day. */
export interface AgeCohort {
  readonly birthTick: number;
  /** individuals; fractional counts are expected values */
  count: number;
  /** mg dry mass per individual */
  meanMassMg: number;
  /** largest meanMassMg reached; starvation reference */
  peakMassMg: number;
  /** eggs and larvae of water-breeding amphibians, aquatic insect stages */
  aquatic: boolean;
  /** semelparous parents: tick they bred; all die within 3 game days */
  spentTick: number | null;
}

export interface CohortPopulation extends PopulationBase {
  readonly kind: 'cohort';
  cohorts: AgeCohort[];
  /** reproductive reserve held by adults, mg COD */
  reserveCod: number;
  lastClutchTick: number | null;
  /** corals: zooxanthellae density Z, 0–1 (docs/04 §5.5) */
  symbiontDensity: number | null;
  /** corals: consecutive game days with Z < 0.2 */
  lowSymbiontDays: number;
}

export type Population = BiomassPopulation | CohortPopulation;

/** Ring buffers for docs/04 §10; index = game day modulo length. */
export interface Records {
  /** game day the current buckets belong to */
  day: number;
  /** `${preyNode}>${predatorSpeciesId}` → 7 daily mg COD */
  feeding: Record<string, number[]>;
  /** `${speciesId}|${kind}` → 7 daily mg */
  chemistry: Record<string, number[]>;
  /** speciesId → 30 daily means (cohort: individuals; biomass: mg COD) */
  history: Record<string, number[]>;
  /** speciesId → current-day running sum and sample count for the history mean */
  historyAccumulator: Record<string, [number, number]>;
  /** speciesId → trophic level (docs/04 §6) */
  trophicLevels: Record<string, number>;
}

/** Cumulative element exchange with the outside, mg. */
export interface Ledger {
  nIn: number;
  nOut: number;
  pIn: number;
  pOut: number;
}

/** docs/06 §4: no_load → cycling → complete */
export type CycleStatus = 'no_load' | 'cycling' | 'complete';

export interface Tracking {
  cycleStatus: CycleStatus;
  cycledDays: number;
  /** cumulative ammonia nitrogen oxidised by AOB, mg */
  nitrifiedN: number;
  nitrifiedAtDayStart: number;
  ammoniaAlert: boolean;
  nitriteAlert: boolean;
  hypoxiaAlert: boolean;
  droughtAlert: boolean;
  dayLengthAbove12: boolean;
  /** consecutive game days with reptiles present and UVB off */
  uvbOffDays: number;
  uvbAlert: boolean;
  dryAirAlert: boolean;
  /** docs/04 §9.2: emergence paused at the population limit */
  saturated: boolean;
  /** highest trophic-level milestone reported (docs/06 §4) */
  trophicMilestone: number;
  /** substeps used by the previous tick; the next tick starts from half (docs/04 §9) */
  substeps: number;
}

export interface SimulationState {
  readonly schema: 1;
  readonly worldSeed: string;
  readonly seedHash: number;
  tick: number;
  readonly config: TankConfig;
  water: WaterState;
  land: LandState;
  climate: ClimateState;
  /** every species that has lived in this tank, including extinct ones */
  species: Record<GenotypeCode, SpeciesRecord>;
  populations: Population[];
  nextPopulationId: number;
  records: Records;
  ledger: Ledger;
  tracking: Tracking;
}

export type Command =
  | { readonly type: 'feed'; readonly dryMassMg: number }
  | {
      readonly type: 'release';
      readonly archetypeId: ArchetypeId;
      /** codex species; omitted = new species drawn from base weights */
      readonly speciesId?: GenotypeCode;
      /** adults released; default and upper bound per docs/06 §2 */
      readonly count?: number;
    };

export type SimEventType =
  | 'cycle_started'
  | 'cycle_complete'
  | 'ammonia_spike'
  | 'nitrite_spike'
  | 'hypoxia'
  | 'freeze'
  | 'thaw'
  | 'drought'
  | 'wet_season_start'
  | 'dry_season_start'
  | 'equinox'
  | 'species_established'
  | 'species_extinct'
  | 'mutant_established'
  | 'legendary_established'
  | 'invader_established'
  | 'feeder_established'
  | 'algae_bloom'
  | 'bacterial_bloom'
  | 'population_boom'
  | 'coral_bleaching'
  | 'emergence_exit'
  | 'metamorphosis'
  | 'trophic_milestone'
  | 'clonal_collapse'
  | 'ecosystem_saturated'
  | 'dry_air'
  | 'uvb_missing'
  | 'release_rejected';

export type SimEventLevel = 'info' | 'notice' | 'major';

export interface SimEvent {
  readonly tick: number;
  readonly type: SimEventType;
  readonly level: SimEventLevel;
  readonly speciesId?: GenotypeCode;
  /** trophic milestone level, or rejection reason code */
  readonly detail?: string;
}

export interface StepResult {
  readonly state: SimulationState;
  readonly events: readonly SimEvent[];
}
