import type { Archetype } from '../content/archetype';
import type { ArchetypeId } from '../content/archetypeIds';
import { CAPACITY_CONVERSION } from '../content/stoichiometry';
import { WILD_MATERIALS } from '../content/tankOptions';
import type { Phenotype } from '../generation/index';
import { COD_PER_DRY_MASS } from './biota';
import type { Geometry } from './geometry';
import { microbialCapacities } from './geometry';
import type { TankConfig } from './types';

const ML_PER_L = 1000;
const CM2_PER_M2 = 1e4;
const MG_PER_G = 1000;
const PERCENT = 100;
const MM_PER_CM = 10;
/** docs/09 §7: tank length ≥ snake body length */
const SNAKES: ReadonlySet<ArchetypeId> = new Set(['garter_water_snake', 'small_python']);

/** Microbes sharing a docs/04 §5.2 habitat capacity instead of a docs/09 density. */
export const MICROBIAL_CAPACITY_GROUP: Readonly<
  Partial<Record<ArchetypeId, 'free' | 'attached' | 'substrate' | 'soil'>>
> = {
  heterotroph: 'free',
  aob: 'attached',
  nob: 'attached',
  denitrifier: 'substrate',
  soil_bacteria: 'soil',
  saprotrophic_fungus: 'soil',
};

export interface Space {
  readonly geometry: Geometry;
  readonly waterVolumeL: number;
  readonly landSubstrateDepthCm: number;
}

/** Shared capacity of a docs/04 §5.2 microbial habitat, mg COD. */
export function microbialCapacity(
  group: 'free' | 'attached' | 'substrate' | 'soil',
  space: Space,
): number {
  return microbialCapacities(space.geometry, space.waterVolumeL, space.landSubstrateDepthCm)[group];
}

/** Area an archetype's per-m² density applies to (docs/09 §7). */
function areaFor(archetype: Archetype, space: Space): number {
  const geometry = space.geometry;
  if (archetype.zone === 'T') return geometry.landAreaM2;
  if (archetype.kind === 'biomass' && archetype.niche === 'surface') return geometry.surfaceAreaM2;
  if (archetype.zone === 'A') return geometry.landAreaM2 + geometry.waterFloorAreaM2;
  return geometry.waterFloorAreaM2;
}

/** How many minimum enclosures fit (docs/09 §7); undefined fields do not limit. */
export function enclosureMultiple(archetype: Archetype, space: Space): number {
  const minimum = archetype.minEnclosure;
  if (minimum === undefined) return 1;
  const ratios: number[] = [];
  const water = minimum.waterVolumeL?.value;
  const land = minimum.landAreaM2?.value;
  if (water !== undefined && water > 0 && archetype.zone !== 'T')
    ratios.push(space.waterVolumeL / water);
  if (land !== undefined && land > 0 && archetype.zone !== 'W')
    ratios.push(space.geometry.landAreaM2 / land);
  if (ratios.length === 0) return 1;
  return Math.floor(Math.min(...ratios));
}

/** docs/09 §7 carrying capacity in individuals (cohort) or modules/cells (biomass). */
export function capacityUnits(archetype: Archetype, space: Space): number {
  const max = archetype.density.max.value;
  const geometry = space.geometry;
  switch (archetype.density.unit) {
    case 'cells_per_mL':
      return max * ML_PER_L * space.waterVolumeL;
    case 'cells_per_cm2':
      return max * CM2_PER_M2 * areaFor(archetype, space);
    case 'cells_per_g_soil': {
      const soilG =
        geometry.landAreaM2 *
        CM2_PER_M2 *
        space.landSubstrateDepthCm *
        WILD_MATERIALS.soilBulkDensity.value;
      return max * soilG;
    }
    case 'individuals_per_L':
      return max * space.waterVolumeL;
    case 'individuals_per_m2':
      return max * areaFor(archetype, space);
    case 'individuals_per_100L':
      return space.waterVolumeL > 0 ? Math.max(1, (max * space.waterVolumeL) / 100) : 0;
    case 'individuals_per_enclosure':
      return max * enclosureMultiple(archetype, space);
    case 'mg_chl_a_per_m2':
    case 'g_dry_per_m2':
    case 'cover_percent':
      return 0;
  }
}

/** docs/09 §7 carrying capacity as biomass, mg COD. */
export function capacityCod(archetype: Archetype, phenotype: Phenotype, space: Space): number {
  const max = archetype.density.max.value;
  const area = areaFor(archetype, space);
  switch (archetype.density.unit) {
    case 'mg_chl_a_per_m2':
      return max * CAPACITY_CONVERSION.dryMassPerChlorophyll.value * area * COD_PER_DRY_MASS;
    case 'g_dry_per_m2':
      return max * MG_PER_G * area * COD_PER_DRY_MASS;
    case 'cover_percent':
      return (
        (max / PERCENT) *
        CAPACITY_CONVERSION.fullCoverDryGPerM2.value *
        MG_PER_G *
        area *
        COD_PER_DRY_MASS
      );
    default:
      return capacityUnits(archetype, space) * phenotype.adultMassMg * COD_PER_DRY_MASS;
  }
}

export type EnclosureProblem =
  | 'no_water'
  | 'no_land'
  | 'tank_too_short'
  | 'too_little_water'
  | 'too_little_land'
  | 'tank_too_low';

/** docs/09 §7 minimum enclosure; null when the tank fits. */
export function enclosureProblem(
  archetype: Archetype,
  phenotype: Phenotype,
  config: TankConfig,
  space: Space,
): EnclosureProblem | null {
  const needsWater = archetype.zone === 'W' || archetype.flags.includes('needs_water_to_breed');
  const needsLand = archetype.zone === 'T' || archetype.flags.includes('needs_land');
  if (archetype.zone === 'W' && space.waterVolumeL <= 0) return 'no_water';
  if (archetype.zone === 'T' && space.geometry.landAreaM2 <= 0) return 'no_land';
  if (archetype.zone === 'A' && needsLand && space.geometry.landAreaM2 <= 0) return 'no_land';
  if (archetype.zone === 'A' && needsWater && space.waterVolumeL <= 0) return 'no_water';
  if (SNAKES.has(archetype.id) && config.lengthCm * MM_PER_CM < phenotype.lengthMm)
    return 'tank_too_short';
  const minimum = archetype.minEnclosure;
  if (minimum === undefined) return null;
  const lengthScale = phenotype.lengthMm / archetype.typicalLengthMm.value;
  if (minimum.lengthCm !== undefined && config.lengthCm < minimum.lengthCm.value * lengthScale)
    return 'tank_too_short';
  if (minimum.waterVolumeL !== undefined && space.waterVolumeL < minimum.waterVolumeL.value)
    return 'too_little_water';
  if (minimum.landAreaM2 !== undefined && space.geometry.landAreaM2 < minimum.landAreaM2.value)
    return 'too_little_land';
  if (minimum.heightCm !== undefined && config.heightCm < minimum.heightCm.value)
    return 'tank_too_low';
  return null;
}
