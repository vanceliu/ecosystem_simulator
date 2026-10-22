import { populationCod, populationCount, TICKS_PER_DAY } from './biota';
import type { Process } from './fluxes';
import { POOL } from './pools';
import type { Population, Records, SimulationState } from './types';

/** docs/04 §10 ring lengths, game days */
export const FLUX_DAYS = 7;
export const HISTORY_DAYS = 30;
/** docs/04 §6: Jacobi sweeps for trophic levels */
const TROPHIC_ITERATIONS = 20;

export type ChemFluxKind =
  | 'o2_produced'
  | 'o2_consumed'
  | 'tan_excreted'
  | 'tan_uptake'
  | 'no2_produced'
  | 'no3_produced'
  | 'no3_uptake'
  | 'po4_uptake'
  | 'co2_produced'
  | 'co2_uptake'
  | 'n2_released';

const CHEM_KEYS: Readonly<Record<string, readonly [ChemFluxKind | null, ChemFluxKind | null]>> = {
  [POOL.o2]: ['o2_produced', 'o2_consumed'],
  [POOL.tan]: ['tan_excreted', 'tan_uptake'],
  [POOL.soilTan]: ['tan_excreted', 'tan_uptake'],
  [POOL.no2]: ['no2_produced', null],
  [POOL.no3]: ['no3_produced', 'no3_uptake'],
  [POOL.po4]: [null, 'po4_uptake'],
  [POOL.soilPo4]: [null, 'po4_uptake'],
  [POOL.co2]: ['co2_produced', 'co2_uptake'],
  [POOL.n2Out]: ['n2_released', null],
};

export function emptyRecords(): Records {
  return {
    day: 0,
    feeding: {},
    chemistry: {},
    history: {},
    historyAccumulator: {},
    trophicLevels: {},
  };
}

const ring = (length: number): number[] => Array<number>(length).fill(0);

function addTo(table: Record<string, number[]>, key: string, bucket: number, amount: number): void {
  const row = table[key] ?? (table[key] = ring(FLUX_DAYS));
  row[bucket] = (row[bucket] ?? 0) + amount;
}

/** Accumulates this substep's feeding and chemical fluxes into today's bucket. */
export function recordFluxes(
  records: Records,
  processes: readonly Process[],
  effective: readonly number[],
): void {
  const bucket = records.day % FLUX_DAYS;
  processes.forEach((process, index) => {
    const amount = effective[index] ?? 0;
    if (amount <= 0) return;
    if (process.feeding !== undefined) {
      for (const edge of process.feeding)
        addTo(records.feeding, `${edge.prey}>${edge.predator}`, bucket, amount * edge.share);
    }
    if (process.speciesId === undefined) return;
    for (const [key, coefficient] of Object.entries(process.stoichiometry)) {
      const kinds = CHEM_KEYS[key];
      if (kinds === undefined) continue;
      const kind = coefficient > 0 ? kinds[0] : kinds[1];
      if (kind === null) continue;
      addTo(
        records.chemistry,
        `${process.speciesId}|${kind}`,
        bucket,
        Math.abs(coefficient) * amount,
      );
    }
  });
}

/** Size used for population history: individuals (cohort) or mg COD (biomass). */
export function populationSize(population: Population): number {
  return population.kind === 'cohort' ? populationCount(population) : populationCod(population);
}

/** Adds this tick's population sizes to the running daily mean. */
export function sampleHistory(state: SimulationState): void {
  const accumulator = state.records.historyAccumulator;
  for (const population of state.populations) {
    const entry = accumulator[population.speciesId] ?? (accumulator[population.speciesId] = [0, 0]);
    entry[0] += populationSize(population);
    entry[1] += 1;
  }
}

const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

/** docs/04 §6: TL = 1 + Σ w_ij TL_j over the last 7 days of feeding; cannibalism is excluded. */
export function trophicLevels(feeding: Readonly<Record<string, number[]>>): Record<string, number> {
  const diets = new Map<string, Map<string, number>>();
  for (const [edge, buckets] of Object.entries(feeding)) {
    const separator = edge.lastIndexOf('>');
    const prey = edge.slice(0, separator);
    const predator = edge.slice(separator + 1);
    if (prey === predator) continue;
    const diet = diets.get(predator) ?? new Map<string, number>();
    diet.set(prey, (diet.get(prey) ?? 0) + sum(buckets));
    diets.set(predator, diet);
  }
  let levels: Record<string, number> = {};
  for (let iteration = 0; iteration < TROPHIC_ITERATIONS; iteration += 1) {
    const next: Record<string, number> = {};
    for (const [predator, diet] of diets) {
      const total = sum([...diet.values()]);
      if (total <= 0) continue;
      let level = 1;
      for (const [prey, amount] of diet) level += (amount / total) * (levels[prey] ?? 1);
      next[predator] = level;
    }
    levels = next;
  }
  return levels;
}

/** Closes the finished game day and opens new buckets (docs/04 §10). */
export function rollRecords(state: SimulationState): void {
  const records = state.records;
  const finished = records.day;
  for (const [speciesId, [total, samples]] of Object.entries(records.historyAccumulator)) {
    const row = records.history[speciesId] ?? (records.history[speciesId] = ring(HISTORY_DAYS));
    row[finished % HISTORY_DAYS] = samples > 0 ? total / samples : 0;
  }
  records.historyAccumulator = {};
  records.trophicLevels = trophicLevels(records.feeding);
  records.day = Math.floor(state.tick / TICKS_PER_DAY);
  const bucket = records.day % FLUX_DAYS;
  for (const table of [records.feeding, records.chemistry]) {
    for (const [key, row] of Object.entries(table)) {
      row[bucket] = 0;
      if (row.every((value) => value === 0)) delete table[key];
    }
  }
  const alive = new Set(state.populations.map((population) => population.speciesId));
  for (const [speciesId, row] of Object.entries(records.history)) {
    if (alive.has(speciesId)) continue;
    row[records.day % HISTORY_DAYS] = 0;
    if (row.every((value) => value === 0)) delete records.history[speciesId];
  }
}
