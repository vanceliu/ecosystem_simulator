import type { ParameterSet } from '../content/parameters';
import {
  BOUNDARY_SUBSTANCE_IDS,
  STATE_SUBSTANCE_IDS,
  type StateSubstanceId,
} from '../content/substances';
import { cohortCod } from './biota';
import type { PoolKey, Pools, Process } from './fluxes';
import type { SimulationState } from './types';

export const populationKey = (id: string): PoolKey => `pop:${id}`;
export const cohortKey = (id: string, index: number): PoolKey => `coh:${id}:${index}`;
/** COD assimilated by a cohort population this substep, allocated after the flux step */
export const gainKey = (id: string): PoolKey => `gain:${id}`;

/** All substance pools at zero, mg. */
export function emptySubstances(): Record<StateSubstanceId, number> {
  const substances = {} as Record<StateSubstanceId, number>;
  for (const id of STATE_SUBSTANCE_IDS) substances[id] = 0;
  return substances;
}

export function toPools(params: ParameterSet, state: SimulationState): Pools {
  const pools: Pools = new Map();
  for (const id of STATE_SUBSTANCE_IDS) pools.set(id, state.substances[id]);
  for (const id of BOUNDARY_SUBSTANCE_IDS) pools.set(id, 0);
  for (const population of state.populations) {
    if (population.kind === 'biomass') {
      pools.set(populationKey(population.id), population.cod);
      continue;
    }
    population.cohorts.forEach((cohort, index) => {
      pools.set(cohortKey(population.id, index), cohortCod(params, cohort));
    });
    pools.set(gainKey(population.id), 0);
  }
  return pools;
}

/** Writes substances and biomass populations back; cohorts are updated separately. */
export function fromPools(state: SimulationState, pools: Pools): void {
  for (const id of STATE_SUBSTANCE_IDS) state.substances[id] = pools.get(id) ?? 0;
  for (const population of state.populations) {
    if (population.kind === 'biomass')
      population.cod = pools.get(populationKey(population.id)) ?? 0;
  }
  state.ledger.nOut += (pools.get('out_n2') ?? 0) + (pools.get('out_n') ?? 0);
  state.ledger.pOut += pools.get('out_p') ?? 0;
  state.ledger.nIn += pools.get('meter_fixed_n') ?? 0;
  state.tracking.nitrifiedN += pools.get('meter_nitrified') ?? 0;
}

/**
 * docs/04 §3.2 proton balance: alkalinity changes by one equivalent per mg N of ammonium
 * (water or substrate) gained or nitrite/nitrate lost.
 */
export function withAlkalinity(params: ParameterSet, process: Process): Process {
  const terms = process.stoichiometry;
  const equivalents =
    (terms.water_tan ?? 0) +
    (terms.sediment_tan ?? 0) -
    (terms.water_no2 ?? 0) -
    (terms.water_no3 ?? 0);
  if (equivalents !== 0)
    terms.water_alkalinity =
      (terms.water_alkalinity ?? 0) +
      equivalents * params.stoichiometry.base.alkalinityPerNEquivalent.value;
  return process;
}
