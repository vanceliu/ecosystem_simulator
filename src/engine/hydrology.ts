import { getArchetype } from '../content/archetypes/index';
import { STOICHIOMETRY } from '../content/stoichiometry';
import { RAIN_CHEMISTRY } from '../content/waterSources';
import { bodyRatios } from './biota';
import { requireClimate, equivalentMonth } from './climate';
import { computeGeometry } from './geometry';
import { waterComposition } from './sourceWater';
import type { SimulationState } from './types';

/** docs/11 §5.3: semidiurnal tide period, hours */
export const TIDE_PERIOD_H = 12.42;
export const TIDE_AMPLITUDE = 0.5;
/** docs/11 §5.3: indoor seasonal drying, fraction of nominal volume per day */
export const SEASONAL_DRYING_PER_DAY = 0.02;
const LITRES_PER_MM_M2 = 1;

const DISSOLVED_KEYS = [
  'saltMg',
  'alkalinityMg',
  'o2',
  'co2',
  'tan',
  'no2',
  'no3',
  'po4',
  'sio2',
  'ca',
  'substrateCod',
] as const;

/** Removes a fraction of the water with its dissolved load and water-column biomass. */
export function removeWaterFraction(state: SimulationState, fraction: number): void {
  const water = state.water;
  const share = Math.min(1, Math.max(0, fraction));
  if (share <= 0) return;
  const exportedN = (water.tan + water.no2 + water.no3) * share;
  const exportedP = water.po4 * share;
  for (const key of DISSOLVED_KEYS) water[key] -= water[key] * share;
  let microbeN = 0;
  let microbeP = 0;
  for (const population of state.populations) {
    if (population.kind !== 'biomass') continue;
    const archetype = getArchetype(population.archetypeId);
    if (archetype.kind !== 'biomass' || archetype.niche !== 'water_column') continue;
    const removed = population.cod * share;
    const ratios = bodyRatios(archetype);
    population.cod -= removed;
    microbeN += removed * ratios.n;
    microbeP += removed * ratios.p;
  }
  water.volumeL -= water.volumeL * share;
  state.ledger.nOut += exportedN + microbeN;
  state.ledger.pOut += exportedP + microbeP;
}

/** Adds fill water (source water, RO dilution and sea salt); temperature mixes by volume. */
export function addSourceWater(state: SimulationState, litres: number, temperatureC: number): void {
  if (litres <= 0) return;
  const water = state.water;
  const fill = waterComposition(state.config);
  const total = water.volumeL + litres;
  water.temperatureC =
    total > 0 ? (water.temperatureC * water.volumeL + temperatureC * litres) / total : temperatureC;
  water.saltMg += fill.salinityPpt * 1000 * litres;
  water.alkalinityMg += fill.kh * STOICHIOMETRY.caco3PerDkh.value * litres;
  water.tan += fill.tan * litres;
  water.no3 += fill.no3 * litres;
  water.po4 += fill.po4 * litres;
  water.sio2 += fill.sio2 * litres;
  water.ca += fill.ca * litres;
  water.substrateCod += fill.labileCod * litres;
  water.inert.cod += fill.refractoryCod * litres;
  water.volumeL = total;
  state.ledger.nIn += (fill.tan + fill.no3) * litres;
  state.ledger.pIn += fill.po4 * litres;
}

/** Wet deposition: rain carries ammonium and nitrate; docs/11 §7. */
function addRain(state: SimulationState, litres: number, temperatureC: number): void {
  const water = state.water;
  const total = water.volumeL + litres;
  if (total <= 0) return;
  water.temperatureC = (water.temperatureC * water.volumeL + temperatureC * litres) / total;
  water.volumeL = total;
  const ammonium = RAIN_CHEMISTRY.ammoniumN.value * litres;
  const nitrate = RAIN_CHEMISTRY.nitrateN.value * litres;
  water.tan += ammonium;
  water.no3 += nitrate;
  state.ledger.nIn += ammonium + nitrate;
}

/** Rain falling on land adds its inorganic nitrogen to the soil. */
export function addRainToLand(state: SimulationState, dtDays: number): void {
  if (state.config.placement !== 'outdoor') return;
  const landAreaM2 = computeGeometry(state.config).landAreaM2;
  if (landAreaM2 <= 0) return;
  const litres = state.climate.rainTodayMm * dtDays * landAreaM2 * LITRES_PER_MM_M2;
  const nitrogen = (RAIN_CHEMISTRY.ammoniumN.value + RAIN_CHEMISTRY.nitrateN.value) * litres;
  state.land.soilTan += nitrogen;
  state.ledger.nIn += nitrogen;
}

/** docs/11 §5.3 and §7 */
export function updateHydrology(state: SimulationState, dtTicks: number): void {
  const config = state.config;
  const geometry = computeGeometry(config);
  if (geometry.waterFloorAreaM2 <= 0) return;
  const water = state.water;
  const dtDays = dtTicks / 24;

  if (config.placement === 'outdoor') {
    const rainLitres =
      state.climate.rainTodayMm * dtDays * geometry.waterFloorAreaM2 * LITRES_PER_MM_M2;
    if (rainLitres > 0) {
      if (state.climate.ambientTemperatureC < 0 && water.iceCover) water.snowOnIce = true;
      addRain(state, rainLitres, Math.max(0, state.climate.ambientTemperatureC));
    }
    if (!water.iceCover) {
      const evaporated =
        state.climate.evaporationTodayMm * dtDays * geometry.waterFloorAreaM2 * LITRES_PER_MM_M2;
      water.volumeL = Math.max(0, water.volumeL - evaporated);
    }
  } else if (config.seasonalDrying) {
    const normal = requireClimate(config.location);
    if (normal.wetMonths.length > 0) {
      const month = equivalentMonth(state.climate.dayOfYear, config.location);
      const change = geometry.nominalWaterVolumeL * SEASONAL_DRYING_PER_DAY * dtDays;
      if (normal.wetMonths.includes(month)) {
        const room = geometry.nominalWaterVolumeL - water.volumeL;
        addSourceWater(state, Math.min(change, Math.max(0, room)), water.temperatureC);
      } else {
        water.volumeL = Math.max(0, water.volumeL - change);
      }
    }
  }

  if (config.tide && geometry.nominalWaterVolumeL > 0) {
    const hours = state.tick + 1;
    const target = Math.min(
      geometry.maxWaterVolumeL,
      geometry.nominalWaterVolumeL *
        (1 + TIDE_AMPLITUDE * Math.sin((2 * Math.PI * hours) / TIDE_PERIOD_H)),
    );
    const difference = target - water.volumeL;
    if (difference > 0)
      addSourceWater(state, difference * Math.min(1, dtTicks), water.temperatureC);
    else if (water.volumeL > 0)
      removeWaterFraction(state, (-difference * Math.min(1, dtTicks)) / water.volumeL);
  }

  if (water.volumeL > geometry.maxWaterVolumeL && water.volumeL > 0) {
    removeWaterFraction(state, (water.volumeL - geometry.maxWaterVolumeL) / water.volumeL);
  }
}
