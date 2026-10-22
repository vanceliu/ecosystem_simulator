import type { ArchetypeId } from '../content/archetypeIds';
import { getArchetype } from '../content/archetypes/index';
import { COD_PER_DRY_MASS, phenotypeOf, populationCod } from './biota';
import {
  capacityCod,
  capacityUnits,
  MICROBIAL_CAPACITY_GROUP,
  microbialCapacity,
  type Space,
} from './capacity';
import type { Population } from './types';

const MASS_UNITS = new Set(['mg_chl_a_per_m2', 'g_dry_per_m2', 'cover_percent']);

/** Occupied share of carrying capacity per capacity group, docs/04 §5.2–5.3 and §5.6. */
export type Occupancy = ReadonlyMap<string, number>;

/** Capacity group of an archetype: a docs/04 §5.2 microbial habitat or the archetype itself. */
export function capacityGroup(id: ArchetypeId): string {
  return MICROBIAL_CAPACITY_GROUP[id] ?? id;
}

/** Biomass or individuals a population occupies, in its group's capacity units. */
function occupiedUnits(population: Population): number {
  const archetype = getArchetype(population.archetypeId);
  const cod = populationCod(population);
  if (
    MICROBIAL_CAPACITY_GROUP[archetype.id] !== undefined ||
    MASS_UNITS.has(archetype.density.unit)
  )
    return cod;
  return cod / (phenotypeOf(population.speciesId).adultMassMg * COD_PER_DRY_MASS);
}

function groupCapacity(population: Population, space: Space): number {
  const archetype = getArchetype(population.archetypeId);
  const microbial = MICROBIAL_CAPACITY_GROUP[archetype.id];
  if (microbial !== undefined) return microbialCapacity(microbial, space);
  if (MASS_UNITS.has(archetype.density.unit))
    return capacityCod(archetype, phenotypeOf(population.speciesId), space);
  return capacityUnits(archetype, space);
}

export function computeOccupancy(populations: readonly Population[], space: Space): Occupancy {
  const used = new Map<string, number>();
  const capacity = new Map<string, number>();
  for (const population of populations) {
    const group = capacityGroup(population.archetypeId);
    used.set(group, (used.get(group) ?? 0) + occupiedUnits(population));
    if (!capacity.has(group)) capacity.set(group, groupCapacity(population, space));
  }
  const occupancy = new Map<string, number>();
  for (const [group, units] of used) {
    const limit = capacity.get(group) ?? 0;
    occupancy.set(group, limit > 0 ? units / limit : Infinity);
  }
  return occupancy;
}

/** docs/04 §5.3 crowding term `1 − N/K`, floored at 0. */
export function crowdingFactor(occupancy: Occupancy, id: ArchetypeId): number {
  return Math.max(0, 1 - (occupancy.get(capacityGroup(id)) ?? 0));
}
