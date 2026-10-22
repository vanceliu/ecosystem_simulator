/** Microbes with background seeding (docs/04 §5.2), in seeding order. */
export const MICROBE_IDS = [
  'heterotroph',
  'aob',
  'nob',
  'denitrifier',
  'soil_bacteria',
  'saprotrophic_fungus',
] as const;

export type MicrobeId = (typeof MICROBE_IDS)[number];
