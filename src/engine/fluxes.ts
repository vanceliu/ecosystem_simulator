export type Pools = Map<string, number>;

/** A mass flux: `rate` units move along the stoichiometry; coefficients are per unit rate. */
export interface Process {
  readonly name: string;
  readonly rate: number;
  readonly stoichiometry: Readonly<Record<string, number>>;
}

/**
 * Applies processes so that no pool goes negative: when total net demand on a pool exceeds
 * its content, every process drawing from it is scaled by the same factor.
 */
export function applyProcesses(pools: Pools, processes: readonly Process[]): void {
  const demand = new Map<string, number>();
  for (const process of processes) {
    if (!(process.rate > 0)) continue;
    for (const [key, coefficient] of Object.entries(process.stoichiometry)) {
      if (coefficient < 0) {
        demand.set(key, (demand.get(key) ?? 0) - coefficient * process.rate);
      }
    }
  }
  const poolScale = new Map<string, number>();
  for (const [key, total] of demand) {
    const available = Math.max(0, pools.get(key) ?? 0);
    poolScale.set(key, total > available ? available / total : 1);
  }
  for (const process of processes) {
    if (!(process.rate > 0)) continue;
    let scale = 1;
    for (const [key, coefficient] of Object.entries(process.stoichiometry)) {
      if (coefficient < 0) scale = Math.min(scale, poolScale.get(key) ?? 1);
    }
    const effective = process.rate * scale;
    if (effective <= 0) continue;
    for (const [key, coefficient] of Object.entries(process.stoichiometry)) {
      const next = (pools.get(key) ?? 0) + coefficient * effective;
      pools.set(key, Math.max(0, next));
    }
  }
}
