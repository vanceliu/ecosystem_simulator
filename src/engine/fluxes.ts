export type Pools = Map<string, number>;

/** What a process does to a cohort pool: eaten or killed individuals vs. lost body mass. */
export type CohortEffect = 'remove' | 'shrink';

/** A mass flux: `rate` units move along the stoichiometry; coefficients are per unit rate. */
export interface Process {
  readonly name: string;
  readonly rate: number;
  readonly stoichiometry: Readonly<Record<string, number>>;
  /** species whose chemical exchange this process records (docs/04 §10) */
  readonly speciesId?: string;
  /** feeding edge for docs/04 §10: prey node and predator species */
  readonly feeding?: { readonly prey: string; readonly predator: string };
  /** cohort pool key and how the process changes that cohort */
  readonly cohort?: { readonly key: string; readonly effect: CohortEffect };
}

/** Adds a coefficient to a stoichiometry, summing terms that share a key. */
export function addTerm(terms: Record<string, number>, key: string, coefficient: number): void {
  if (coefficient !== 0) terms[key] = (terms[key] ?? 0) + coefficient;
}

/**
 * Applies processes so that no pool goes negative: when total net demand on a pool exceeds
 * its content, every process drawing from it is scaled by the same factor.
 * Returns the effective rate of each process, in input order.
 */
export function applyProcesses(pools: Pools, processes: readonly Process[]): number[] {
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
  return processes.map((process) => {
    if (!(process.rate > 0)) return 0;
    let scale = 1;
    for (const [key, coefficient] of Object.entries(process.stoichiometry)) {
      if (coefficient < 0) scale = Math.min(scale, poolScale.get(key) ?? 1);
    }
    const effective = process.rate * scale;
    if (effective <= 0) return 0;
    for (const [key, coefficient] of Object.entries(process.stoichiometry)) {
      const next = (pools.get(key) ?? 0) + coefficient * effective;
      pools.set(key, Math.max(0, next));
    }
    return effective;
  });
}
