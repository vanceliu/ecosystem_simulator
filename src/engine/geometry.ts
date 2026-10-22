import type { ParameterSet } from '../content/parameters';
import type { TankConfig } from './types';

export interface Geometry {
  readonly floorAreaM2: number;
  readonly landAreaM2: number;
  readonly waterFloorAreaM2: number;
  readonly nominalWaterVolumeL: number;
  readonly maxWaterVolumeL: number;
  readonly glassAreaM2: number;
  readonly substrateSurfaceM2: number;
  /** colonisable surface for attached microbes */
  readonly surfaceAreaM2: number;
  readonly anoxicFraction: number;
  readonly totalVolumeL: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** docs/04 §3.1 */
export function computeGeometry(params: ParameterSet, config: TankConfig): Geometry {
  const options = params.tankOptions;
  const floorAreaM2 = (config.lengthCm * config.widthCm) / 1e4;
  const landFraction = clamp(config.landFraction, 0, 1);
  const landAreaM2 = floorAreaM2 * landFraction;
  const waterFloorAreaM2 = floorAreaM2 - landAreaM2;
  const depthCm = clamp(config.waterDepthCm, 0, config.heightCm);
  const nominalWaterVolumeL = waterFloorAreaM2 * depthCm * 10;
  const maxWaterVolumeL = waterFloorAreaM2 * config.heightCm * 10;
  const glassAreaM2 =
    waterFloorAreaM2 +
    (2 * (config.lengthCm + config.widthCm) * depthCm * (1 - landFraction)) / 1e4;
  const hasWater = nominalWaterVolumeL > 0;
  const substrate = options.substrates[config.substrate];
  const substrateSurfaceM2 = hasWater
    ? waterFloorAreaM2 * substrate.surfacePerFloorPerCm.value * config.substrateDepthCm
    : 0;
  const hardscapeSurfaceM2 = hasWater
    ? config.hardscape.reduce((sum, item) => sum + options.hardscapeSurface[item.type].value, 0) *
      waterFloorAreaM2
    : 0;
  const wildBonus =
    config.substrate !== 'bare' && config.substrateSource.origin === 'wild'
      ? options.wildSubstrateAnoxicBonus.value
      : 0;
  const filterSurfaceM2 = hasWater ? options.filters[config.filter].mediaSurfaceM2.value : 0;
  const anoxicBase =
    config.substrate === 'bare' ? 0 : clamp((config.substrateDepthCm - 3) / 7, 0, 1);
  return {
    floorAreaM2,
    landAreaM2,
    waterFloorAreaM2,
    nominalWaterVolumeL,
    maxWaterVolumeL,
    glassAreaM2,
    substrateSurfaceM2,
    surfaceAreaM2: glassAreaM2 + substrateSurfaceM2 + hardscapeSurfaceM2 + filterSurfaceM2,
    anoxicFraction: hasWater
      ? clamp(anoxicBase + substrate.anoxicBonus.value + wildBonus, 0, 1)
      : 0,
    totalVolumeL: (config.lengthCm * config.widthCm * config.heightCm) / 1000,
  };
}

/** mg COD each habitat can hold; docs/04 §5.2. */
export function microbialCapacities(
  params: ParameterSet,
  geometry: Geometry,
  waterVolumeL: number,
  landSubstrateDepthCm: number,
) {
  const processes = params.microbes.processes;
  const soilGrams =
    geometry.landAreaM2 *
    1e4 *
    landSubstrateDepthCm *
    params.tankOptions.wildMaterials.soilBulkDensity.value;
  return {
    attached: processes.biofilmCapacityPerM2.value * geometry.surfaceAreaM2,
    substrate:
      processes.biofilmCapacityPerM2.value * geometry.substrateSurfaceM2 * geometry.anoxicFraction,
    free: processes.freeBacteriaCapacity.value * waterVolumeL,
    soil: processes.soilMicrobeCodPerG.value * soilGrams,
  };
}
