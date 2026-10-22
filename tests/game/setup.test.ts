import { describe, expect, it } from 'vitest';
import { hasContinentality } from '../../src/content/climate';
import { HABITAT_IDS } from '../../src/content/habitats';
import {
  ALTITUDE_BANDS,
  LATITUDE_ZONES,
  MOISTURES,
  type Continentality,
} from '../../src/content/location';
import { computeGeometry } from '../../src/engine/geometry';
import { createInitialState, validateTankConfig } from '../../src/engine/state';
import {
  recommendTankConfig,
  representativeLocation,
  validateLocation,
} from '../../src/game/setup';
import { params } from '../params';

const base = {
  hemisphere: 'north',
  altitudeBand: 'lowland',
  continentality: 'maritime',
  realm: 'NT',
} as const;

describe('location validation (docs/11 §2, §5.2)', () => {
  it('rejects climates that do not exist', () => {
    const errors = validateLocation(
      params,
      representativeLocation(params, {
        ...base,
        latitudeZone: 'tropical',
        moisture: 'mediterranean',
        habitat: 'lake',
      }),
    );
    expect(errors.join()).toMatch(/does not exist/);
  });

  it('rejects habitats outside their range', () => {
    const reef = representativeLocation(params, {
      ...base,
      latitudeZone: 'polar',
      moisture: 'humid',
      habitat: 'coral_reef',
    });
    expect(validateLocation(params, reef).length).toBeGreaterThan(0);
    const alpineReef = representativeLocation(params, {
      ...base,
      altitudeBand: 'alpine',
      latitudeZone: 'tropical',
      moisture: 'humid',
      habitat: 'coral_reef',
    });
    expect(validateLocation(params, alpineReef).length).toBeGreaterThan(0);
  });

  it('allows lowland alpine streams at high latitude', () => {
    const boreal = representativeLocation(params, {
      ...base,
      latitudeZone: 'boreal',
      moisture: 'humid',
      habitat: 'alpine_stream',
    });
    expect(validateLocation(params, boreal)).toEqual([]);
  });
});

describe('recommended tank settings (docs/11 §5.1)', () => {
  const validLocations = LATITUDE_ZONES.flatMap((zone) =>
    ALTITUDE_BANDS.flatMap((altitude) =>
      MOISTURES.flatMap((moisture) =>
        (hasContinentality(params.climate, zone, moisture)
          ? (['maritime', 'continental'] as Continentality[])
          : (['maritime'] as Continentality[])
        ).flatMap((continentality) =>
          HABITAT_IDS.map((habitat) =>
            representativeLocation(params, {
              ...base,
              latitudeZone: zone,
              altitudeBand: altitude,
              moisture,
              continentality,
              habitat,
            }),
          ),
        ),
      ),
    ),
  ).filter((location) => validateLocation(params, location).length === 0);

  it('covers many valid combinations', () => {
    expect(validLocations.length).toBeGreaterThan(200);
  });

  it('produces valid, buildable configs for every valid location', () => {
    for (const location of validLocations) {
      for (const placement of ['indoor', 'outdoor'] as const) {
        const config = recommendTankConfig(params, location, placement);
        expect(validateTankConfig(params, config), JSON.stringify(location)).toEqual([]);
        expect(() => createInitialState(params, config, 'seed')).not.toThrow();
      }
    }
  }, 60_000);

  it('keeps recommendations inside the habitat ranges', () => {
    for (const location of validLocations) {
      const config = recommendTankConfig(params, location, 'indoor');
      const habitat = params.habitats.specs[location.habitat];
      expect(config.landFraction * 100).toBeGreaterThanOrEqual(habitat.landPercent.min);
      expect(config.landFraction * 100).toBeLessThanOrEqual(habitat.landPercent.max);
      expect(config.salinityPpt).toBeGreaterThanOrEqual(habitat.salinityPpt.min);
      expect(config.salinityPpt).toBeLessThanOrEqual(habitat.salinityPpt.max);
    }
  });

  it('fills outdoor tanks with local wild water and materials', () => {
    const pond = representativeLocation(params, {
      ...base,
      latitudeZone: 'temperate',
      moisture: 'humid',
      habitat: 'pond_wetland',
    });
    const config = recommendTankConfig(params, pond, 'outdoor');
    expect(config.waterSource).toBe('pond');
    expect(config.substrateSource).toEqual({ origin: 'wild', realm: 'NT' });
  });

  it('heats tropical aquaria above room temperature', () => {
    const reef = representativeLocation(params, {
      ...base,
      latitudeZone: 'tropical',
      moisture: 'humid',
      habitat: 'coral_reef',
    });
    const config = recommendTankConfig(params, reef, 'indoor');
    expect(config.heaterSetpointC).toBeGreaterThan(22);
    expect(config.waterSource).toBe('ro');
    expect(config.hardscape.every((item) => item.source.origin === 'clean')).toBe(true);
    expect(computeGeometry(params, config).nominalWaterVolumeL).toBeGreaterThan(0);
  });
});
