import { cohortCod } from './biota';
import type { Pools } from './fluxes';
import type { OrganicPool, SimulationState } from './types';

export const POOL = {
  o2: 'w.o2',
  co2: 'w.co2',
  tan: 'w.tan',
  no2: 'w.no2',
  no3: 'w.no3',
  po4: 'w.po4',
  sio2: 'w.sio2',
  ca: 'w.ca',
  alkalinity: 'w.alk',
  substrate: 'w.S',
  soilTan: 'l.tan',
  soilPo4: 'l.po4',
  soilSubstrate: 'l.S',
  /** N2 released by denitrification; leaves the tank */
  n2Out: 'sink.n2',
  /** N and P carried out by escaping or emerging animals */
  exportN: 'sink.n',
  exportP: 'sink.p',
  /** counter of ammonia nitrogen oxidised by AOB; not a mass pool */
  nitrified: 'meter.nitrified',
  /** counter of N2 fixed by cyanobacteria; enters the tank */
  fixedN: 'meter.fixedN',
} as const;

export const organicKeys = (prefix: string) =>
  ({ cod: `${prefix}.cod`, n: `${prefix}.n`, p: `${prefix}.p` }) as const;

export type OrganicKeys = ReturnType<typeof organicKeys>;

export const WATER_FOOD = organicKeys('w.food');
export const WATER_DETRITUS = organicKeys('w.det');
export const WATER_INERT = organicKeys('w.inert');
export const LAND_LITTER = organicKeys('l.litter');

export const populationKey = (id: string): string => `pop:${id}`;
export const cohortKey = (id: string, index: number): string => `coh:${id}:${index}`;
/** COD assimilated by a cohort population this substep, allocated after the flux step */
export const gainKey = (id: string): string => `gain:${id}`;

function organicToPools(pools: Pools, keys: OrganicKeys, pool: OrganicPool): void {
  pools.set(keys.cod, pool.cod);
  pools.set(keys.n, pool.n);
  pools.set(keys.p, pool.p);
}

function poolsToOrganic(pools: Pools, keys: OrganicKeys, pool: OrganicPool): void {
  pool.cod = pools.get(keys.cod) ?? 0;
  pool.n = pools.get(keys.n) ?? 0;
  pool.p = pools.get(keys.p) ?? 0;
}

export function toPools(state: SimulationState): Pools {
  const water = state.water;
  const pools: Pools = new Map([
    [POOL.o2, water.o2],
    [POOL.co2, water.co2],
    [POOL.tan, water.tan],
    [POOL.no2, water.no2],
    [POOL.no3, water.no3],
    [POOL.po4, water.po4],
    [POOL.sio2, water.sio2],
    [POOL.ca, water.ca],
    [POOL.alkalinity, water.alkalinityMg],
    [POOL.substrate, water.substrateCod],
    [POOL.soilTan, state.land.soilTan],
    [POOL.soilPo4, state.land.soilPo4],
    [POOL.soilSubstrate, state.land.soilSubstrateCod],
    [POOL.n2Out, 0],
    [POOL.exportN, 0],
    [POOL.exportP, 0],
    [POOL.nitrified, 0],
    [POOL.fixedN, 0],
  ]);
  organicToPools(pools, WATER_FOOD, water.food);
  organicToPools(pools, WATER_DETRITUS, water.detritus);
  organicToPools(pools, WATER_INERT, water.inert);
  organicToPools(pools, LAND_LITTER, state.land.litter);
  for (const population of state.populations) {
    if (population.kind === 'biomass') {
      pools.set(populationKey(population.id), population.cod);
      continue;
    }
    population.cohorts.forEach((cohort, index) => {
      pools.set(cohortKey(population.id, index), cohortCod(cohort));
    });
    pools.set(gainKey(population.id), 0);
  }
  return pools;
}

/** Writes chemistry, organic pools and biomass populations back; cohorts are updated separately. */
export function fromPools(state: SimulationState, pools: Pools): void {
  const water = state.water;
  water.o2 = pools.get(POOL.o2) ?? 0;
  water.co2 = pools.get(POOL.co2) ?? 0;
  water.tan = pools.get(POOL.tan) ?? 0;
  water.no2 = pools.get(POOL.no2) ?? 0;
  water.no3 = pools.get(POOL.no3) ?? 0;
  water.po4 = pools.get(POOL.po4) ?? 0;
  water.sio2 = pools.get(POOL.sio2) ?? 0;
  water.ca = pools.get(POOL.ca) ?? 0;
  water.alkalinityMg = pools.get(POOL.alkalinity) ?? 0;
  water.substrateCod = pools.get(POOL.substrate) ?? 0;
  state.land.soilTan = pools.get(POOL.soilTan) ?? 0;
  state.land.soilPo4 = pools.get(POOL.soilPo4) ?? 0;
  state.land.soilSubstrateCod = pools.get(POOL.soilSubstrate) ?? 0;
  poolsToOrganic(pools, WATER_FOOD, water.food);
  poolsToOrganic(pools, WATER_DETRITUS, water.detritus);
  poolsToOrganic(pools, WATER_INERT, water.inert);
  poolsToOrganic(pools, LAND_LITTER, state.land.litter);
  for (const population of state.populations) {
    if (population.kind === 'biomass')
      population.cod = pools.get(populationKey(population.id)) ?? 0;
  }
  state.ledger.nOut += (pools.get(POOL.n2Out) ?? 0) + (pools.get(POOL.exportN) ?? 0);
  state.ledger.pOut += pools.get(POOL.exportP) ?? 0;
  state.ledger.nIn += pools.get(POOL.fixedN) ?? 0;
  state.tracking.nitrifiedN += pools.get(POOL.nitrified) ?? 0;
}
