import type { HabitatId } from '../../src/content/habitats';
import type {
  AltitudeBand,
  Continentality,
  LatitudeZone,
  Moisture,
  RealmCode,
} from '../../src/content/location';
import type { LocationConfig, Placement, TankConfig } from '../../src/engine/types';
import { recommendTankConfig, representativeLocation } from '../../src/game/setup';

export interface LocationSpec {
  readonly zone: LatitudeZone;
  readonly altitude?: AltitudeBand;
  readonly moisture: Moisture;
  readonly continentality?: Continentality;
  readonly habitat: HabitatId;
  readonly realm?: RealmCode;
}

export function location(spec: LocationSpec): LocationConfig {
  return representativeLocation({
    hemisphere: 'north',
    latitudeZone: spec.zone,
    altitudeBand: spec.altitude ?? 'lowland',
    moisture: spec.moisture,
    continentality: spec.continentality ?? 'maritime',
    habitat: spec.habitat,
    realm: spec.realm ?? 'PA',
  });
}

export function tank(
  spec: LocationSpec,
  placement: Placement,
  overrides: Partial<TankConfig> = {},
): TankConfig {
  return { ...recommendTankConfig(location(spec), placement), ...overrides };
}

/** Indoor tropical stream aquarium heated to 25 °C, filled from the tap. */
export const CYCLING_TANK: TankConfig = tank(
  { zone: 'tropical', moisture: 'humid', habitat: 'stream', realm: 'IM' },
  'indoor',
  { heaterSetpointC: 25, waterSource: 'tap' },
);

/** mg dry flake food per day used by the cycling scenario. */
export const DAILY_FEED_MG = 50;
export const FEED_HOUR = 9;
