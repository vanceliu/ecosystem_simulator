import { climateFor, hasContinentality } from '../content/climate';
import { HABITATS, LIGHT_PPFD, type HabitatSpec, type Range } from '../content/habitats';
import { ALTITUDE_RANGE, LATITUDE_RANGE } from '../content/location';
import type { HardscapeId, MaterialSource, SubstrateId } from '../content/tankOptions';
import type { WaterSourceId } from '../content/waterSources';
import { lapseAdjustedTemperature } from '../engine/atmosphere';
import type { LocationConfig, Placement, TankConfig } from '../engine/types';

/** docs/11 §4: default start day = spring equinox of the hemisphere. */
export const SPRING_EQUINOX_DAY = { north: 80, south: 263 } as const;
export const DEFAULT_ROOM_TEMPERATURE_C = 22;
const DEFAULT_OUTDOOR_SHADING = 0.3;
const DEFAULT_SUBSTRATE_DEPTH_CM = 5;
const DEFAULT_LAND_SUBSTRATE_DEPTH_CM = 8;
const HUMID_LID_THRESHOLD = 70;
const SALT_WATER_MIN_PPT = 5;
const CANISTER_MIN_VOLUME_L = 30;
const STILL_WATER_FLOW = 0.3;

const midpoint = (range: Range): number => (range.min + range.max) / 2;
const clampTo = (value: number, range: Range): number =>
  Math.min(range.max, Math.max(range.min, value));

/** Representative latitude and altitude for a location; docs/11 §1. */
export function representativeLocation(
  location: Omit<LocationConfig, 'latitudeDeg' | 'altitudeM'>,
): LocationConfig {
  return {
    ...location,
    latitudeDeg: LATITUDE_RANGE[location.latitudeZone].representative,
    altitudeM: ALTITUDE_RANGE[location.altitudeBand].representative,
  };
}

/** Reasons a location cannot be selected; empty when valid. docs/11 §2 and §5.2. */
export function validateLocation(location: LocationConfig): string[] {
  const errors: string[] = [];
  const latitude = LATITUDE_RANGE[location.latitudeZone];
  const altitude = ALTITUDE_RANGE[location.altitudeBand];
  if (location.latitudeDeg < latitude.min || location.latitudeDeg > latitude.max) {
    errors.push('latitude outside the selected zone');
  }
  if (location.altitudeM < altitude.min || location.altitudeM > altitude.max) {
    errors.push('altitude outside the selected band');
  }
  if (climateFor(location.latitudeZone, location.moisture, location.continentality) === undefined) {
    errors.push(`climate ${location.latitudeZone} × ${location.moisture} does not exist`);
  }
  if (
    !hasContinentality(location.latitudeZone, location.moisture) &&
    location.continentality !== 'maritime'
  ) {
    errors.push('continentality applies only to temperate and boreal humid climates');
  }
  const habitat = HABITATS[location.habitat];
  if (!habitat.allowedZones.includes(location.latitudeZone)) {
    errors.push(`${habitat.nameZh} does not occur in this latitude zone`);
  }
  const highLatitude = location.latitudeZone === 'boreal' || location.latitudeZone === 'polar';
  const altitudeAllowed =
    habitat.allowedAltitudes.includes(location.altitudeBand) ||
    (habitat.highLatitudeLowlandAllowed === true && highLatitude);
  if (!altitudeAllowed) errors.push(`${habitat.nameZh} does not occur at this altitude`);
  if (!habitat.allowedMoistures.includes(location.moisture)) {
    errors.push(`${habitat.nameZh} does not occur in this moisture regime`);
  }
  return errors;
}

interface Enclosure {
  readonly lengthCm: number;
  readonly widthCm: number;
  readonly heightCm: number;
}

function defaultEnclosure(habitat: HabitatSpec): Enclosure {
  const land = midpoint(habitat.landPercent);
  if (land >= 85) return { lengthCm: 45, widthCm: 45, heightCm: 60 };
  if (land >= 20) return { lengthCm: 90, widthCm: 45, heightCm: 45 };
  if (habitat.waterDepthCm.min >= 40) return { lengthCm: 90, widthCm: 45, heightCm: 55 };
  return { lengthCm: 60, widthCm: 30, heightCm: 36 };
}

const SUBSTRATE_BY_HABITAT: Partial<Record<HabitatSpec['id'], SubstrateId>> = {
  coral_reef: 'fine_sand',
  intertidal: 'fine_sand',
  mangrove: 'mud',
  peat_bog: 'mud',
  pond_wetland: 'mud',
  stream: 'gravel',
  alpine_stream: 'gravel',
  cave_spring: 'gravel',
};

const HARDSCAPE_BY_HABITAT: Partial<Record<HabitatSpec['id'], readonly HardscapeId[]>> = {
  coral_reef: ['reef_rock'],
  intertidal: ['reef_rock'],
  stream: ['rock'],
  alpine_stream: ['rock'],
  cave_spring: ['rock'],
  blackwater: ['driftwood'],
  mangrove: ['driftwood'],
};

/** Natural water collected from each habitat; docs/11 §5.1. */
const WILD_WATER_BY_HABITAT: Readonly<Record<HabitatSpec['id'], WaterSourceId>> = {
  stream: 'river',
  alpine_stream: 'river',
  lake: 'lake',
  pond_wetland: 'pond',
  savanna_pond: 'pond',
  peat_bog: 'pond',
  rainforest_floor: 'pond',
  cloud_forest: 'river',
  temperate_woodland: 'pond',
  desert: 'spring',
  blackwater: 'blackwater',
  cave_spring: 'spring',
  mangrove: 'estuary',
  intertidal: 'seawater',
  coral_reef: 'seawater',
};

/** Indoor tanks start from treated water and clean materials; outdoor tanks from local wild ones. */
function recommendedWaterSource(
  habitat: HabitatSpec,
  placement: Placement,
  salinityPpt: number,
): WaterSourceId {
  if (placement === 'outdoor') return WILD_WATER_BY_HABITAT[habitat.id];
  return salinityPpt >= SALT_WATER_MIN_PPT ? 'ro' : 'tap';
}

function waterTemperatureRange(habitat: HabitatSpec, location: LocationConfig): Range | null {
  const warmZone = location.latitudeZone === 'tropical' || location.latitudeZone === 'subtropical';
  return warmZone && habitat.waterTempTropicalC !== undefined
    ? habitat.waterTempTropicalC
    : habitat.waterTempC;
}

/** Recommended tank settings for a location; docs/11 §5.1. */
export function recommendTankConfig(location: LocationConfig, placement: Placement): TankConfig {
  const errors = validateLocation(location);
  if (errors.length > 0) throw new Error(`Invalid location: ${errors.join('; ')}`);
  const habitat = HABITATS[location.habitat];
  const climate = climateFor(location.latitudeZone, location.moisture, location.continentality);
  if (climate === undefined) throw new Error('Missing climate');
  const warmMonthC = lapseAdjustedTemperature(
    climate.tWarm,
    climate.stationElevationM,
    location.altitudeM,
  );
  const enclosure = defaultEnclosure(habitat);
  const landFraction = midpoint(habitat.landPercent) / 100;
  const waterDepthCm = Math.min(enclosure.heightCm, midpoint(habitat.waterDepthCm));
  const temperatureRange = waterTemperatureRange(habitat, location);
  const recommendedWaterC =
    temperatureRange === null ? null : clampTo(warmMonthC, temperatureRange);
  const waterVolumeL =
    (enclosure.lengthCm * enclosure.widthCm * (1 - landFraction) * waterDepthCm) / 1000;
  const salinityPpt = midpoint(habitat.salinityPpt);
  const humidity = habitat.humidityPercent === null ? null : midpoint(habitat.humidityPercent);
  const materials: MaterialSource = {
    origin: placement === 'outdoor' ? 'wild' : 'clean',
    realm: location.realm,
  };
  return {
    location,
    placement,
    startDayOfYear: SPRING_EQUINOX_DAY[location.hemisphere],
    ...enclosure,
    waterDepthCm,
    landFraction,
    salinityPpt,
    waterSource: recommendedWaterSource(habitat, placement, salinityPpt),
    waterRealm: location.realm,
    substrate: waterVolumeL > 0 ? (SUBSTRATE_BY_HABITAT[habitat.id] ?? 'fine_sand') : 'bare',
    substrateDepthCm: waterVolumeL > 0 ? DEFAULT_SUBSTRATE_DEPTH_CM : 0,
    substrateSource: materials,
    hardscape: (HARDSCAPE_BY_HABITAT[habitat.id] ?? []).map((type) => ({
      type,
      source: materials,
    })),
    filter:
      waterVolumeL <= 0 ? 'none' : waterVolumeL >= CANISTER_MIN_VOLUME_L ? 'canister' : 'sponge',
    aeration: waterVolumeL > 0 && habitat.flow < STILL_WATER_FLOW ? 0.5 : 0,
    heaterSetpointC:
      recommendedWaterC !== null && recommendedWaterC > DEFAULT_ROOM_TEMPERATURE_C
        ? recommendedWaterC
        : null,
    roomTemperatureC: DEFAULT_ROOM_TEMPERATURE_C,
    lightPpfd: LIGHT_PPFD[habitat.light],
    photoperiodH: midpoint(habitat.photoperiodH),
    seasonalLighting: false,
    shading: placement === 'outdoor' ? DEFAULT_OUTDOOR_SHADING : 0,
    landSubstrate: landFraction > 0 ? (habitat.landSubstrate ?? 'soil_mix') : null,
    landSubstrateSource: materials,
    landSubstrateDepthCm: landFraction > 0 ? DEFAULT_LAND_SUBSTRATE_DEPTH_CM : 0,
    mistingPerDay: Math.round(midpoint(habitat.mistingPerDay)),
    baskingC: habitat.baskingC,
    uvb: habitat.baskingC !== null,
    lid: humidity !== null && humidity >= HUMID_LID_THRESHOLD,
    tide: habitat.tide,
    seasonalDrying: habitat.seasonalDrying,
  };
}
