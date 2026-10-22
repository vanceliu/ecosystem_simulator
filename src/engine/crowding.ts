import type { ArchetypeId } from '../content/archetypeIds';
import type { ParameterSet } from '../content/parameters';
import { codPerDryMass, phenotypeOf, populationCod } from './biota';
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
function occupiedUnits(params: ParameterSet, population: Population): number {
  const archetype = params.archetypes[population.archetypeId];
  const cod = populationCod(params, population);
  if (
    MICROBIAL_CAPACITY_GROUP[archetype.id] !== undefined ||
    MASS_UNITS.has(archetype.density.unit)
  )
    return cod;
  return cod / (phenotypeOf(params, population.speciesId).adultMassMg * codPerDryMass(params));
}

function groupCapacity(params: ParameterSet, population: Population, space: Space): number {
  const archetype = params.archetypes[population.archetypeId];
  const microbial = MICROBIAL_CAPACITY_GROUP[archetype.id];
  if (microbial !== undefined) return microbialCapacity(params, microbial, space);
  if (MASS_UNITS.has(archetype.density.unit))
    return capacityCod(params, archetype, phenotypeOf(params, population.speciesId), space);
  return capacityUnits(params, archetype, space);
}

export function computeOccupancy(
  params: ParameterSet,
  populations: readonly Population[],
  space: Space,
): Occupancy {
  const used = new Map<string, number>();
  const capacity = new Map<string, number>();
  for (const population of populations) {
    const group = capacityGroup(population.archetypeId);
    used.set(group, (used.get(group) ?? 0) + occupiedUnits(params, population));
    if (!capacity.has(group)) capacity.set(group, groupCapacity(params, population, space));
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
