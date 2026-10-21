import { describe, expect, it } from 'vitest';
import { hasContinentality } from '../../src/content/climate';
import { HABITATS, HABITAT_IDS } from '../../src/content/habitats';
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

const base = {
  hemisphere: 'north',
  altitudeBand: 'lowland',
  continentality: 'maritime',
  realm: 'NT',
} as const;

describe('location validation (docs/11 §2, §5.2)', () => {
  it('rejects climates that do not exist', () => {
    const errors = validateLocation(
      representativeLocation({
        ...base,
        latitudeZone: 'tropical',
        moisture: 'mediterranean',
        habitat: 'lake',
      }),
    );
    expect(errors.join()).toMatch(/does not exist/);
  });

  it('rejects habitats outside their range', () => {
    const reef = representativeLocation({
      ...base,
      latitudeZone: 'polar',
      moisture: 'humid',
      habitat: 'coral_reef',
    });
    expect(validateLocation(reef).length).toBeGreaterThan(0);
    const alpineReef = representativeLocation({
      ...base,
      altitudeBand: 'alpine',
      latitudeZone: 'tropical',
      moisture: 'humid',
      habitat: 'coral_reef',
    });
    expect(validateLocation(alpineReef).length).toBeGreaterThan(0);
  });

  it('allows lowland alpine streams at high latitude', () => {
    const boreal = representativeLocation({
      ...base,
      latitudeZone: 'boreal',
      moisture: 'humid',
      habitat: 'alpine_stream',
    });
    expect(validateLocation(boreal)).toEqual([]);
  });
});

describe('recommended tank settings (docs/11 §5.1)', () => {
  const validLocations = LATITUDE_ZONES.flatMap((zone) =>
    ALTITUDE_BANDS.flatMap((altitude) =>
      MOISTURES.flatMap((moisture) =>
        (hasContinentality(zone, moisture)
          ? (['maritime', 'continental'] as Continentality[])
          : (['maritime'] as Continentality[])
        ).flatMap((continentality) =>
          HABITAT_IDS.map((habitat) =>
            representativeLocation({
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
  ).filter((location) => validateLocation(location).length === 0);

  it('covers many valid combinations', () => {
    expect(validLocations.length).toBeGreaterThan(200);
  });

  it('produces valid, buildable configs for every valid location', () => {
    for (const location of validLocations) {
      for (const placement of ['indoor', 'outdoor'] as const) {
        const config = recommendTankConfig(location, placement);
        expect(validateTankConfig(config), JSON.stringify(location)).toEqual([]);
        expect(() => createInitialState(config, 'seed')).not.toThrow();
      }
    }
  });

  it('keeps recommendations inside the habitat ranges', () => {
    for (const location of validLocations) {
      const config = recommendTankConfig(location, 'indoor');
      const habitat = HABITATS[location.habitat];
      expect(config.landFraction * 100).toBeGreaterThanOrEqual(habitat.landPercent.min);
      expect(config.landFraction * 100).toBeLessThanOrEqual(habitat.landPercent.max);
      expect(config.salinityPpt).toBeGreaterThanOrEqual(habitat.salinityPpt.min);
      expect(config.salinityPpt).toBeLessThanOrEqual(habitat.salinityPpt.max);
    }
  });

  it('fills outdoor tanks with local wild water and materials', () => {
    const pond = representativeLocation({
      ...base,
      latitudeZone: 'temperate',
      moisture: 'humid',
      habitat: 'pond_wetland',
    });
    const config = recommendTankConfig(pond, 'outdoor');
    expect(config.waterSource).toBe('pond');
    expect(config.substrateSource).toEqual({ origin: 'wild', realm: 'NT' });
  });

  it('heats tropical aquaria above room temperature', () => {
    const reef = representativeLocation({
      ...base,
      latitudeZone: 'tropical',
      moisture: 'humid',
      habitat: 'coral_reef',
    });
    const config = recommendTankConfig(reef, 'indoor');
    expect(config.heaterSetpointC).toBeGreaterThan(22);
    expect(config.waterSource).toBe('ro');
    expect(config.hardscape.every((item) => item.source.origin === 'clean')).toBe(true);
    expect(computeGeometry(config).nominalWaterVolumeL).toBeGreaterThan(0);
  });
});
