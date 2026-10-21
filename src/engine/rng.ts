/** Uniform generator on [0, 1). */
export interface Rng {
  next(): number;
}

/** FNV-1a 32-bit hash of a string seed. */
export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Combines two 32-bit integers into a well-mixed 32-bit integer (murmur3 finaliser). */
export function mix32(a: number, b: number): number {
  let h = (a ^ Math.imul(b, 0x9e3779b1)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function splitmix32(state: number): () => number {
  let value = state >>> 0;
  return () => {
    value = (value + 0x9e3779b9) >>> 0;
    let z = value;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
}

/** sfc32 seeded from a 32-bit integer via splitmix32. */
export function createRng(seed: number): Rng {
  const init = splitmix32(seed);
  let a = init();
  let b = init();
  let c = init();
  let d = init();
  const nextUint = (): number => {
    const t = (((a + b) >>> 0) + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return t;
  };
  for (let warmup = 0; warmup < 12; warmup += 1) nextUint();
  return { next: () => nextUint() / 4294967296 };
}

/** Independent stream per tick: sfc32(hash(worldSeed, tick)). */
export function rngForTick(seedHash: number, tick: number): Rng {
  return createRng(mix32(seedHash, tick));
}
