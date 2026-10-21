/** FNV-1a 32-bit hash. */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic value in [−1, 1] for a species trait. */
export function signedUnit(key: string): number {
  return (fnv1a(key) / 0xffffffff) * 2 - 1;
}

/** Uniform generator on [0, 1). */
export interface RandomSource {
  next(): number;
}
