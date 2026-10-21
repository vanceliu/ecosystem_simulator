import { MICROBIAL_PROCESSES } from '../content/microbes';
import {
  FILTERS,
  HARDSCAPE_SURFACE,
  SUBSTRATES,
  WILD_SUBSTRATE_ANOXIC_BONUS,
} from '../content/tankOptions';
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

export const MAX_TOTAL_VOLUME_L = 100_000;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** docs/04 §3.1 */
export function computeGeometry(config: TankConfig): Geometry {
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
  const substrate = SUBSTRATES[config.substrate];
  const substrateSurfaceM2 = hasWater
    ? waterFloorAreaM2 * substrate.surfacePerFloorPerCm.value * config.substrateDepthCm
    : 0;
  const hardscapeSurfaceM2 = hasWater
    ? config.hardscape.reduce((sum, item) => sum + HARDSCAPE_SURFACE[item.type].value, 0) *
      waterFloorAreaM2
    : 0;
  const wildBonus =
    config.substrate !== 'bare' && config.substrateSource.origin === 'wild'
      ? WILD_SUBSTRATE_ANOXIC_BONUS.value
      : 0;
  const filterSurfaceM2 = hasWater ? FILTERS[config.filter].mediaSurfaceM2.value : 0;
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
export function microbialCapacities(geometry: Geometry, waterVolumeL: number) {
  return {
    attached: MICROBIAL_PROCESSES.biofilmCapacityPerM2.value * geometry.surfaceAreaM2,
    substrate:
      MICROBIAL_PROCESSES.biofilmCapacityPerM2.value *
      geometry.substrateSurfaceM2 *
      geometry.anoxicFraction,
    free: MICROBIAL_PROCESSES.freeBacteriaCapacity.value * waterVolumeL,
    soil: MICROBIAL_PROCESSES.soilMicrobeCapacityPerM2.value * geometry.landAreaM2,
  };
}
