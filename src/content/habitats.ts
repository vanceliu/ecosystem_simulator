import type { AltitudeBand, LatitudeZone, Moisture } from './location';
import type { HardscapeId, LandSubstrateId, SubstrateId } from './tankOptions';
import type { WaterSourceId } from './waterSources';

/** docs/11 §5 habitats; specs live in ref_param `habitats.specs.<id>`. */
export const HABITAT_IDS = [
  'stream',
  'lake',
  'pond_wetland',
  'blackwater',
  'rainforest_floor',
  'cloud_forest',
  'mangrove',
  'intertidal',
  'coral_reef',
  'desert',
  'savanna_pond',
  'temperate_woodland',
  'cave_spring',
  'peat_bog',
  'alpine_stream',
] as const;

export type HabitatId = (typeof HABITAT_IDS)[number];

export interface Range {
  readonly min: number;
  readonly max: number;
}

export type LightClass = 'none' | 'low' | 'medium' | 'high' | 'very_high';

export interface HabitatSpec {
  readonly id: HabitatId;
  readonly nameZh: string;
  readonly landPercent: Range;
  readonly waterDepthCm: Range;
  /** null when the habitat has no water body */
  readonly waterTempC: Range | null;
  /** temperate/tropical split for habitats with both */
  readonly waterTempTropicalC?: Range;
  readonly ph: Range | null;
  readonly khDkh: Range | null;
  readonly salinityPpt: Range;
  /** 0 still – 1 strong */
  readonly flow: number;
  readonly airTempC: Range | null;
  readonly humidityPercent: Range | null;
  readonly mistingPerDay: Range;
  readonly landSubstrate: LandSubstrateId | null;
  readonly baskingC: number | null;
  readonly light: LightClass;
  readonly photoperiodH: Range;
  readonly tide: boolean;
  readonly seasonalDrying: boolean;
  readonly allowedZones: readonly LatitudeZone[];
  readonly allowedAltitudes: readonly AltitudeBand[];
  readonly allowedMoistures: readonly Moisture[];
  /** boreal and polar zones also allow lowland (alpine stream) */
  readonly highLatitudeLowlandAllowed?: boolean;
  /** natural water collected from this habitat */
  readonly wildWater: WaterSourceId;
  readonly recommendedSubstrate: SubstrateId;
  readonly recommendedHardscape: readonly HardscapeId[];
  /** fields marked（估）in docs/11 §5.1 */
  readonly estimatedFields: readonly string[];
}
