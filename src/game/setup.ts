import { climateFor, hasContinentality } from '../content/climate';
import type { HabitatSpec, Range } from '../content/habitats';
import type { ParameterSet } from '../content/parameters';
import type { EnclosurePreset } from '../content/mechanics';
import type { MaterialSource } from '../content/tankOptions';
import type { WaterSourceId } from '../content/waterSources';
import { lapseAdjustedTemperature } from '../engine/atmosphere';
import type { LocationConfig, Placement, TankConfig } from '../engine/types';

const midpoint = (range: Range): number => (range.min + range.max) / 2;
const clampTo = (value: number, range: Range): number =>
  Math.min(range.max, Math.max(range.min, value));

/** Representative latitude and altitude for a location; docs/11 §1. */
export function representativeLocation(
  params: ParameterSet,
  location: Omit<LocationConfig, 'latitudeDeg' | 'altitudeM'>,
): LocationConfig {
  return {
    ...location,
    latitudeDeg: params.location.latitudeRange[location.latitudeZone].representative,
    altitudeM: params.location.altitudeRange[location.altitudeBand].representative,
  };
}

/** Reasons a location cannot be selected; empty when valid. docs/11 §2 and §5.2. */
export function validateLocation(params: ParameterSet, location: LocationConfig): string[] {
  const errors: string[] = [];
  const latitude = params.location.latitudeRange[location.latitudeZone];
  const altitude = params.location.altitudeRange[location.altitudeBand];
  if (location.latitudeDeg < latitude.min || location.latitudeDeg > latitude.max) {
    errors.push('latitude outside the selected zone');
  }
  if (location.altitudeM < altitude.min || location.altitudeM > altitude.max) {
    errors.push('altitude outside the selected band');
  }
  const climate = params.climate;
  const { latitudeZone, moisture, continentality } = location;
  if (climateFor(climate, latitudeZone, moisture, continentality) === undefined) {
    errors.push(`climate ${latitudeZone} × ${moisture} does not exist`);
  }
  if (!hasContinentality(climate, latitudeZone, moisture) && continentality !== 'maritime') {
    errors.push('continentality applies only to temperate and boreal humid climates');
  }
  const habitat = params.habitats.specs[location.habitat];
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

function defaultEnclosure(params: ParameterSet, habitat: HabitatSpec): EnclosurePreset {
  const presets = params.setup.enclosures;
  const land = midpoint(habitat.landPercent);
  if (land >= presets.terrarium.minLandPercent) return presets.terrarium;
  if (land >= presets.paludarium.minLandPercent) return presets.paludarium;
  if (habitat.waterDepthCm.min >= presets.deepWater.minWaterDepthCm) return presets.deepWater;
  return presets.aquarium;
}

/** Indoor tanks start from treated water and clean materials; outdoor tanks from local wild ones. */
function recommendedWaterSource(
  params: ParameterSet,
  habitat: HabitatSpec,
  placement: Placement,
  salinityPpt: number,
): WaterSourceId {
  if (placement === 'outdoor') return habitat.wildWater;
  return salinityPpt >= params.setup.saltWaterMinPpt ? 'ro' : 'tap';
}

function waterTemperatureRange(habitat: HabitatSpec, location: LocationConfig): Range | null {
  const warmZone = location.latitudeZone === 'tropical' || location.latitudeZone === 'subtropical';
  return warmZone && habitat.waterTempTropicalC !== undefined
    ? habitat.waterTempTropicalC
    : habitat.waterTempC;
}

/** Recommended tank settings for a location; docs/11 §5.1. */
export function recommendTankConfig(
  params: ParameterSet,
  location: LocationConfig,
  placement: Placement,
): TankConfig {
  const errors = validateLocation(params, location);
  if (errors.length > 0) throw new Error(`Invalid location: ${errors.join('; ')}`);
  const habitat = params.habitats.specs[location.habitat];
  const climate = climateFor(
    params.climate,
    location.latitudeZone,
    location.moisture,
    location.continentality,
  );
  if (climate === undefined) throw new Error('Missing climate');
  const warmMonthC = lapseAdjustedTemperature(
    params,
    climate.tWarm,
    climate.stationElevationM,
    location.altitudeM,
  );
  const setup = params.setup;
  const preset = defaultEnclosure(params, habitat);
  const enclosure = {
    lengthCm: preset.lengthCm,
    widthCm: preset.widthCm,
    heightCm: preset.heightCm,
  };
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
    startDayOfYear: setup.springEquinoxDay[location.hemisphere],
    ...enclosure,
    waterDepthCm,
    landFraction,
    salinityPpt,
    waterSource: recommendedWaterSource(params, habitat, placement, salinityPpt),
    waterRealm: location.realm,
    substrate: waterVolumeL > 0 ? habitat.recommendedSubstrate : 'bare',
    substrateDepthCm: waterVolumeL > 0 ? setup.defaultSubstrateDepthCm : 0,
    substrateSource: materials,
    hardscape: habitat.recommendedHardscape.map((type) => ({ type, source: materials })),
    filter:
      waterVolumeL <= 0 ? 'none' : waterVolumeL >= setup.canisterMinVolumeL ? 'canister' : 'sponge',
    aeration: waterVolumeL > 0 && habitat.flow < setup.stillWaterFlow ? setup.defaultAeration : 0,
    heaterSetpointC:
      recommendedWaterC !== null && recommendedWaterC > setup.defaultRoomTemperatureC
        ? recommendedWaterC
        : null,
    roomTemperatureC: setup.defaultRoomTemperatureC,
    lightPpfd: params.habitats.lightPpfd[habitat.light],
    photoperiodH: midpoint(habitat.photoperiodH),
    seasonalLighting: false,
    shading: placement === 'outdoor' ? setup.defaultOutdoorShading : 0,
    landSubstrate: landFraction > 0 ? (habitat.landSubstrate ?? 'soil_mix') : null,
    landSubstrateSource: materials,
    landSubstrateDepthCm: landFraction > 0 ? setup.defaultLandSubstrateDepthCm : 0,
    mistingPerDay: Math.round(midpoint(habitat.mistingPerDay)),
    baskingC: habitat.baskingC,
    uvb: habitat.baskingC !== null,
    lid: humidity !== null && humidity >= setup.humidLidThreshold,
    tide: habitat.tide,
    seasonalDrying: habitat.seasonalDrying,
    openInflow: false,
  };
}
