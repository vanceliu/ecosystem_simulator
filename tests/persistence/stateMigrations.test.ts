import { describe, expect, it } from 'vitest';
import { createInitialState, step } from '../../src/engine/index';
import { migrateState, STATE_SCHEMA } from '../../src/persistence/stateMigrations';
import { CYCLING_TANK } from '../engine/fixtures';
import { params } from '../params';

describe('state migrations (docs/10 §5)', () => {
  it('upgrades schema 1 water and land pools into substances', () => {
    let state = createInitialState(params, { ...CYCLING_TANK, landFraction: 0.3 }, 'v1');
    for (let tick = 0; tick < 30; tick += 1) state = step(params, state).state;
    const s = state.substances;
    const organic = (prefix: 'food' | 'detritus' | 'inert' | 'litter') => ({
      cod: s[`${prefix}_cod`],
      n: s[`${prefix}_n`],
      p: s[`${prefix}_p`],
    });
    const v1: Record<string, unknown> = {
      ...state,
      schema: 1,
      water: {
        ...state.water,
        saltMg: s.water_salt,
        alkalinityMg: s.water_alkalinity,
        o2: s.water_o2,
        co2: s.water_co2,
        tan: s.water_tan,
        no2: s.water_no2,
        no3: s.water_no3,
        po4: s.water_po4,
        sio2: s.water_sio2,
        ca: s.water_ca,
        substrateCod: s.water_substrate,
        food: organic('food'),
        detritus: organic('detritus'),
        inert: organic('inert'),
        sedimentTan: s.sediment_tan,
        sedimentPo4: s.sediment_po4,
      },
      land: {
        ...state.land,
        litter: organic('litter'),
        soilSubstrateCod: s.soil_substrate,
        soilTan: s.soil_tan,
        soilPo4: s.soil_po4,
      },
    };
    delete v1.substances;
    const migrated = migrateState(JSON.parse(JSON.stringify(v1)), 1);
    expect(migrated.schema).toBe(STATE_SCHEMA);
    expect(migrated).toEqual(JSON.parse(JSON.stringify(state)));
  });

  it('leaves a current state unchanged', () => {
    const state = createInitialState(params, CYCLING_TANK, 'v2');
    expect(migrateState(state, STATE_SCHEMA)).toBe(state);
  });
});
