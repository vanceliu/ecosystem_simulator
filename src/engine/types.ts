import type { HabitatId } from '../content/habitats';
import type {
  AltitudeBand,
  Continentality,
  Hemisphere,
  LatitudeZone,
  Moisture,
  RealmCode,
} from '../content/location';
import type { MicrobeId, MicrobeZone } from '../content/microbes';
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

export interface BiomassPopulation {
  readonly id: string;
  readonly speciesId: string;
  readonly archetypeId: MicrobeId;
  readonly zone: MicrobeZone;
  /** mg COD */
  cod: number;
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
  populations: BiomassPopulation[];
  ledger: Ledger;
  tracking: Tracking;
}

export type Command = { readonly type: 'feed'; readonly dryMassMg: number };

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
  | 'equinox';

export type SimEventLevel = 'info' | 'notice' | 'major';

export interface SimEvent {
  readonly tick: number;
  readonly type: SimEventType;
  readonly level: SimEventLevel;
}

export interface StepResult {
  readonly state: SimulationState;
  readonly events: readonly SimEvent[];
}
