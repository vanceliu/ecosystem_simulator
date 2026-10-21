import type { Archetype, ArchetypeData } from '../archetype';
import type { ArchetypeId } from '../archetypeIds';
import { MICROBES_AQUATIC } from './microbes_aquatic';
import { LAND_SOIL } from './land_soil';
import { LAND_ARTHROPODS } from './land_arthropods';
import { AQUATIC_SMALL } from './aquatic_small';
import { AQUATIC_BENTHIC } from './aquatic_benthic';
import { AMPHIBIANS_SEMI } from './amphibians_semi';
import { REPTILES_SMALL_FISH } from './reptiles_small_fish';
import { LARGE_FRESHWATER } from './large_freshwater';
import { LARGE_MARINE } from './large_marine';
import { ARCHETYPE_SKELETONS } from './skeleton';

export const ARCHETYPE_DATA: Readonly<Partial<Record<ArchetypeId, ArchetypeData>>> = {
  ...MICROBES_AQUATIC,
  ...LAND_SOIL,
  ...LAND_ARTHROPODS,
  ...AQUATIC_SMALL,
  ...AQUATIC_BENTHIC,
  ...AMPHIBIANS_SEMI,
  ...REPTILES_SMALL_FISH,
  ...LARGE_FRESHWATER,
  ...LARGE_MARINE,
};

const cache = new Map<ArchetypeId, Archetype>();

export function getArchetype(id: ArchetypeId): Archetype {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;
  const data = ARCHETYPE_DATA[id];
  if (data === undefined) throw new Error(`Missing archetype data: ${id}`);
  const archetype: Archetype = { ...ARCHETYPE_SKELETONS[id], ...data };
  cache.set(id, archetype);
  return archetype;
}
