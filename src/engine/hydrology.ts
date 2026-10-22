import type { ParameterSet } from '../content/parameters';
import { STATE_SUBSTANCE_IDS, type StateSubstanceId } from '../content/substances';
import { bodyRatios } from './biota';
import { requireClimate, equivalentMonth } from './climate';
import { computeGeometry } from './geometry';
import { waterComposition } from './sourceWater';
import type { SimulationState } from './types';

const LITRES_PER_MM_M2 = 1;

/** Substances dissolved in the water column, in state order. */
function dissolvedInWater(params: ParameterSet): StateSubstanceId[] {
  return STATE_SUBSTANCE_IDS.filter((id) => {
    const spec = params.substances[id];
    return spec.medium === 'water' && spec.form === 'dissolved';
  });
}

/** Sum of the masses of an element held by the given substances, mg. */
function elementMass(
  params: ParameterSet,
  amounts: Readonly<Partial<Record<StateSubstanceId, number>>>,
  ids: readonly StateSubstanceId[],
  element: 'N' | 'P',
): number {
  let total = 0;
  for (const id of ids) if (params.substances[id].element === element) total += amounts[id] ?? 0;
  return total;
}

/** Removes a fraction of the water with its dissolved load and water-column biomass. */
export function removeWaterFraction(
  params: ParameterSet,
  state: SimulationState,
  fraction: number,
): void {
  const water = state.water;
  const substances = state.substances;
  const share = Math.min(1, Math.max(0, fraction));
  if (share <= 0) return;
  const dissolved = dissolvedInWater(params);
  const exportedN = elementMass(params, substances, dissolved, 'N') * share;
  const exportedP = elementMass(params, substances, dissolved, 'P') * share;
  for (const id of dissolved) substances[id] -= substances[id] * share;
  let microbeN = 0;
  let microbeP = 0;
  for (const population of state.populations) {
    if (population.kind !== 'biomass') continue;
    const archetype = params.archetypes[population.archetypeId];
    if (archetype.kind !== 'biomass' || archetype.niche !== 'water_column') continue;
    const removed = population.cod * share;
    const ratios = bodyRatios(params, archetype);
    population.cod -= removed;
    microbeN += removed * ratios.n;
    microbeP += removed * ratios.p;
  }
  water.volumeL -= water.volumeL * share;
  state.ledger.nOut += exportedN + microbeN;
  state.ledger.pOut += exportedP + microbeP;
}

/** Adds fill water (source water, RO dilution and sea salt); temperature mixes by volume. */
export function addSourceWater(
  params: ParameterSet,
  state: SimulationState,
  litres: number,
  temperatureC: number,
): void {
  if (litres <= 0) return;
  const water = state.water;
  const fill = waterComposition(params, state.config).perLitre;
  const total = water.volumeL + litres;
  water.temperatureC =
    total > 0 ? (water.temperatureC * water.volumeL + temperatureC * litres) / total : temperatureC;
  const ids = Object.keys(fill) as StateSubstanceId[];
  for (const id of ids) state.substances[id] += (fill[id] ?? 0) * litres;
  water.volumeL = total;
  state.ledger.nIn += elementMass(params, fill, ids, 'N') * litres;
  state.ledger.pIn += elementMass(params, fill, ids, 'P') * litres;
}

/** Wet deposition: rain carries ammonium and nitrate; docs/11 §7. */
function addRain(
  params: ParameterSet,
  state: SimulationState,
  litres: number,
  temperatureC: number,
): void {
  const water = state.water;
  const total = water.volumeL + litres;
  if (total <= 0) return;
  water.temperatureC = (water.temperatureC * water.volumeL + temperatureC * litres) / total;
  water.volumeL = total;
  const rain = params.waterSources.rainChemistry;
  const ammonium = rain.ammoniumN.value * litres;
  const nitrate = rain.nitrateN.value * litres;
  state.substances.water_tan += ammonium;
  state.substances.water_no3 += nitrate;
  state.ledger.nIn += ammonium + nitrate;
}

/** Rain falling on land adds its inorganic nitrogen to the soil. */
export function addRainToLand(params: ParameterSet, state: SimulationState, dtDays: number): void {
  if (state.config.placement !== 'outdoor') return;
  const landAreaM2 = computeGeometry(params, state.config).landAreaM2;
  if (landAreaM2 <= 0) return;
  const litres = state.climate.rainTodayMm * dtDays * landAreaM2 * LITRES_PER_MM_M2;
  const rain = params.waterSources.rainChemistry;
  const nitrogen = (rain.ammoniumN.value + rain.nitrateN.value) * litres;
  state.substances.soil_tan += nitrogen;
  state.ledger.nIn += nitrogen;
}

/** docs/11 §5.3 and §7 */
export function updateHydrology(
  params: ParameterSet,
  state: SimulationState,
  dtTicks: number,
): void {
  const config = state.config;
  const geometry = computeGeometry(params, config);
  if (geometry.waterFloorAreaM2 <= 0) return;
  const water = state.water;
  const dtDays = dtTicks / 24;

  if (config.placement === 'outdoor') {
    const rainLitres =
      state.climate.rainTodayMm * dtDays * geometry.waterFloorAreaM2 * LITRES_PER_MM_M2;
    if (rainLitres > 0) {
      if (state.climate.ambientTemperatureC < 0 && water.iceCover) water.snowOnIce = true;
      addRain(params, state, rainLitres, Math.max(0, state.climate.ambientTemperatureC));
    }
    if (!water.iceCover) {
      const evaporated =
        state.climate.evaporationTodayMm * dtDays * geometry.waterFloorAreaM2 * LITRES_PER_MM_M2;
      water.volumeL = Math.max(0, water.volumeL - evaporated);
    }
  } else if (config.seasonalDrying) {
    const normal = requireClimate(params, config.location);
    if (normal.wetMonths.length > 0) {
      const month = equivalentMonth(state.climate.dayOfYear, config.location);
      const change =
        geometry.nominalWaterVolumeL * params.mechanics.water.seasonalDryingPerDay * dtDays;
      if (normal.wetMonths.includes(month)) {
        const room = geometry.nominalWaterVolumeL - water.volumeL;
        addSourceWater(params, state, Math.min(change, Math.max(0, room)), water.temperatureC);
      } else {
        water.volumeL = Math.max(0, water.volumeL - change);
      }
    }
  }

  if (config.tide && geometry.nominalWaterVolumeL > 0) {
    const hours = state.tick + 1;
    const amplitude = params.mechanics.water.tideAmplitude;
    const period = params.physics.tidePeriodH.value;
    const target = Math.min(
      geometry.maxWaterVolumeL,
      geometry.nominalWaterVolumeL * (1 + amplitude * Math.sin((2 * Math.PI * hours) / period)),
    );
    const difference = target - water.volumeL;
    if (difference > 0)
      addSourceWater(params, state, difference * Math.min(1, dtTicks), water.temperatureC);
    else if (water.volumeL > 0)
      removeWaterFraction(params, state, (-difference * Math.min(1, dtTicks)) / water.volumeL);
  }

  if (water.volumeL > geometry.maxWaterVolumeL && water.volumeL > 0) {
    removeWaterFraction(params, state, (water.volumeL - geometry.maxWaterVolumeL) / water.volumeL);
  }
}
