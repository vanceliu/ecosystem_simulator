import {
  DETRITUS,
  FOOD,
  INERT,
  LITTER,
  type OrganicIds,
  type StateSubstanceId,
} from '../content/substances';
import { emptySubstances } from '../engine/pools';
import type { SimulationState } from '../engine/types';

/** Current `SimulationState.schema` (docs/10 §5). */
export const STATE_SCHEMA = 2;

type Json = Record<string, unknown>;

/** Schema 1 water and land fields → substance ids. */
const V1_WATER_FIELDS: Readonly<Record<string, StateSubstanceId>> = {
  saltMg: 'water_salt',
  alkalinityMg: 'water_alkalinity',
  o2: 'water_o2',
  co2: 'water_co2',
  tan: 'water_tan',
  no2: 'water_no2',
  no3: 'water_no3',
  po4: 'water_po4',
  sio2: 'water_sio2',
  ca: 'water_ca',
  substrateCod: 'water_substrate',
  sedimentTan: 'sediment_tan',
  sedimentPo4: 'sediment_po4',
};
const V1_WATER_ORGANIC: Readonly<Record<string, OrganicIds>> = {
  food: FOOD,
  detritus: DETRITUS,
  inert: INERT,
};
const V1_LAND_FIELDS: Readonly<Record<string, StateSubstanceId>> = {
  soilSubstrateCod: 'soil_substrate',
  soilTan: 'soil_tan',
  soilPo4: 'soil_po4',
};
const V1_LAND_ORGANIC: Readonly<Record<string, OrganicIds>> = { litter: LITTER };

const asObject = (value: unknown): Json =>
  value !== null && typeof value === 'object' ? (value as Json) : {};
const asNumber = (value: unknown): number => (typeof value === 'number' ? value : 0);

function moveFields(
  source: Json,
  fields: Readonly<Record<string, StateSubstanceId>>,
  organic: Readonly<Record<string, OrganicIds>>,
  substances: Record<StateSubstanceId, number>,
): Json {
  const rest: Json = { ...source };
  for (const [field, id] of Object.entries(fields)) {
    substances[id] = asNumber(source[field]);
    delete rest[field];
  }
  for (const [field, ids] of Object.entries(organic)) {
    const pool = asObject(source[field]);
    substances[ids.cod] = asNumber(pool.cod);
    substances[ids.n] = asNumber(pool.n);
    substances[ids.p] = asNumber(pool.p);
    delete rest[field];
  }
  return rest;
}

/** Schema 1 → 2: water and land masses move into `substances`. */
function toSchema2(state: Json): Json {
  const substances = emptySubstances();
  const water = moveFields(asObject(state.water), V1_WATER_FIELDS, V1_WATER_ORGANIC, substances);
  const land = moveFields(asObject(state.land), V1_LAND_FIELDS, V1_LAND_ORGANIC, substances);
  return { ...state, schema: 2, water, land, substances };
}

const UPGRADES: Readonly<Record<number, (state: Json) => Json>> = { 1: toSchema2 };

/** Upgrades a stored state of `schema` to the current schema. */
export function migrateState(stored: unknown, schema: number): SimulationState {
  let state = asObject(stored);
  for (let version = schema; version < STATE_SCHEMA; version += 1) {
    const upgrade = UPGRADES[version];
    if (upgrade === undefined) throw new Error(`No state migration from schema ${version}`);
    state = upgrade(state);
  }
  return state as unknown as SimulationState;
}
