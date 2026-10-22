import type { ParameterSet } from '../content/parameters';
import { mediaOf, type Media } from './biota';
import type { Space } from './capacity';
import { computeOccupancy, type Occupancy } from './crowding';
import { freeAmmoniaMgL, o2SaturationMgL, salinityPpt, waterPh } from './environment';
import type { PoolKey, Pools } from './fluxes';
import type { Geometry } from './geometry';
import type { SimulationState } from './types';

/** Conditions shared by every biological process within one substep. */
export interface BioContext {
  readonly params: ParameterSet;
  readonly state: SimulationState;
  readonly pools: Pools;
  readonly dtDays: number;
  readonly space: Space;
  readonly media: Media;
  readonly ph: number;
  readonly salinityPpt: number;
  readonly o2SaturationMgL: number;
  readonly freeAmmoniaMgL: number;
  /** PAR reaching water and land, µmol·m⁻²·s⁻¹ */
  readonly ppfd: number;
  readonly lightsOn: boolean;
  readonly occupancy: Occupancy;
  /** populationId → fed share of maximum intake this substep, set by the feeding step */
  readonly satiation: Map<string, number>;
}

export function createBioContext(
  params: ParameterSet,
  state: SimulationState,
  pools: Pools,
  geometry: Geometry,
  dtDays: number,
): BioContext {
  const space: Space = {
    geometry,
    waterVolumeL: state.water.volumeL,
    landSubstrateDepthCm:
      state.config.landSubstrate === null ? 0 : state.config.landSubstrateDepthCm,
  };
  return {
    params,
    state,
    pools,
    dtDays,
    space,
    media: mediaOf(state, geometry.landAreaM2),
    ph: waterPh(params, state),
    salinityPpt: salinityPpt(state),
    o2SaturationMgL: o2SaturationMgL(state),
    freeAmmoniaMgL: freeAmmoniaMgL(params, state),
    ppfd: state.climate.ppfd,
    lightsOn: state.climate.ppfd > 0,
    occupancy: computeOccupancy(params, state.populations, space),
    satiation: new Map(),
  };
}

/** Concentration of a water pool, mg/L. */
export function waterConcentration(context: BioContext, key: PoolKey): number {
  const volume = context.space.waterVolumeL;
  return volume > 0 ? Math.max(0, context.pools.get(key) ?? 0) / volume : 0;
}

/** Areal density of a land pool, mg/m². */
export function landDensity(context: BioContext, key: PoolKey): number {
  const area = context.space.geometry.landAreaM2;
  return area > 0 ? Math.max(0, context.pools.get(key) ?? 0) / area : 0;
}
