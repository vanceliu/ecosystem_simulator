import type { ARCHETYPE_GROUPS } from './groups';

export type ArchetypeGroups = {
  readonly [G in keyof typeof ARCHETYPE_GROUPS]: (typeof ARCHETYPE_GROUPS)[G][number];
};
