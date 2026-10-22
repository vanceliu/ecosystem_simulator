import type { BiomassData } from '../content/archetype';
import { getArchetype } from '../content/archetypes/index';
import { PRODUCTION } from '../content/stoichiometry';
import { landDensity, waterConcentration, type BioContext } from './bioContext';
import { bodyRatios, environmentFactor, phenotypeOf } from './biota';
import { crowdingFactor } from './crowding';
import { addTerm, type Process } from './fluxes';
import { POOL, populationKey } from './pools';
import type { BiomassPopulation } from './types';

const CO2_PER_O2 = 44 / 32;
/** docs/04 §5.3: nitrogen fixers never see an N limitation below this */
export const FIXER_N_FLOOR = 0.3;
/** docs/04 §5.3: ammonium is taken up in preference to nitrate by this factor */
export const AMMONIUM_PREFERENCE = 10;
/** docs/04 §5.3: dark respiration as a fraction of μmax when an archetype gives none */
export const DEFAULT_DARK_RESPIRATION = 0.05;
/** L of soil water per m² per cm of substrate at full moisture */
const SOIL_WATER_L_PER_M2_CM = 10 * PRODUCTION.soilPorosity.value;

const monod = (concentration: number, halfSat: number): number =>
  concentration > 0 ? concentration / (halfSat + concentration) : 0;

/** docs/04 §5.3 light response: Monod below the optimum, Steele decline above it. */
export function lightFactor(ppfd: number, halfSaturation: number, optimum: number): number {
  if (ppfd <= 0) return 0;
  const response = ppfd / (ppfd + halfSaturation);
  if (ppfd <= optimum) return response;
  const ratio = ppfd / optimum;
  return response * ratio * Math.exp(1 - ratio);
}

export function isProducer(archetype: BiomassData): boolean {
  return archetype.trophicMode === 'photoautotroph';
}

/** Soil-solution concentration of a land nutrient pool, mg/L. */
function soilSolution(context: BioContext, key: string): number {
  const depth = Math.max(1, context.space.landSubstrateDepthCm);
  const litres = SOIL_WATER_L_PER_M2_CM * depth * Math.max(context.state.land.soilMoisture, 0.05);
  return landDensity(context, key) / litres;
}

/** Photoautotroph growth and dark respiration, docs/04 §5.3; rates in mg COD per dtDays. */
export function producerProcesses(
  context: BioContext,
  populations: readonly BiomassPopulation[],
): Process[] {
  const processes: Process[] = [];
  const { dtDays } = context;
  for (const population of populations) {
    const archetype = getArchetype(population.archetypeId);
    if (archetype.kind !== 'biomass' || !isProducer(archetype) || population.cod <= 0) continue;
    const onLand = archetype.zone === 'T';
    if (onLand ? !context.media.hasLand : !context.media.hasWater) continue;
    const phenotype = phenotypeOf(population.speciesId);
    const kinetics = archetype.kinetics;
    const ratios = bodyRatios(archetype);
    const key = populationKey(population.id);
    const temperature = onLand
      ? context.state.land.airTemperatureC
      : context.state.water.temperatureC;
    const fEnv = environmentFactor(context.state, phenotype, temperature, onLand ? 0 : 1);
    const muMax = kinetics.muMax.value * phenotype.growthMultiplier;
    const halfSat = (value: number | undefined): number =>
      (value ?? 0) * phenotype.halfSaturationMultiplier;

    const light = phenotype.light;
    const fLight =
      light === undefined ? 0 : lightFactor(context.ppfd, light.halfSaturation, light.optimum);
    if (fLight > 0 && fEnv > 0) {
      const tanKey = onLand ? POOL.soilTan : POOL.tan;
      const po4Key = onLand ? POOL.soilPo4 : POOL.po4;
      const tan = onLand
        ? soilSolution(context, POOL.soilTan)
        : waterConcentration(context, POOL.tan);
      const no3 = onLand ? 0 : waterConcentration(context, POOL.no3);
      const po4 = onLand
        ? soilSolution(context, POOL.soilPo4)
        : waterConcentration(context, POOL.po4);
      const nLimitRaw = monod(tan + no3, halfSat(kinetics.halfSat.nitrogen?.value));
      const fixer = archetype.flags.includes('nitrogen_fixer');
      const nLimit = fixer ? Math.max(nLimitRaw, FIXER_N_FLOOR) : nLimitRaw;
      const fixedShare = fixer && nLimit > 0 ? 1 - nLimitRaw / nLimit : 0;
      const limits = [nLimit, monod(po4, halfSat(kinetics.halfSat.phosphorus?.value))];
      if (!onLand && kinetics.halfSat.co2 !== undefined)
        limits.push(
          monod(waterConcentration(context, POOL.co2), halfSat(kinetics.halfSat.co2.value)),
        );
      if (kinetics.halfSat.silicate !== undefined)
        limits.push(
          monod(waterConcentration(context, POOL.sio2), halfSat(kinetics.halfSat.silicate.value)),
        );
      const growth =
        muMax *
        fEnv *
        fLight *
        Math.min(...limits) *
        crowdingFactor(context.occupancy, archetype.id) *
        population.cod *
        dtDays;
      if (growth > 0) {
        const terms: Record<string, number> = {};
        const tanShare =
          tan + no3 > 0 ? (AMMONIUM_PREFERENCE * tan) / (AMMONIUM_PREFERENCE * tan + no3) : 1;
        const assimilatedN = ratios.n * (1 - fixedShare);
        addTerm(terms, key, 1);
        addTerm(terms, tanKey, -assimilatedN * tanShare);
        if (!onLand) addTerm(terms, POOL.no3, -assimilatedN * (1 - tanShare));
        addTerm(terms, POOL.fixedN, ratios.n * fixedShare);
        addTerm(terms, po4Key, -ratios.p);
        if (!onLand) {
          addTerm(terms, POOL.co2, -CO2_PER_O2);
          addTerm(terms, POOL.o2, 1);
        }
        if (kinetics.halfSat.silicate !== undefined)
          addTerm(terms, POOL.sio2, -PRODUCTION.silicaPerDiatomCod.value);
        processes.push({
          name: `photosynthesis:${population.id}`,
          rate: growth,
          stoichiometry: terms,
          speciesId: population.speciesId,
        });
      }
    }

    if (!context.lightsOn) {
      const fraction = kinetics.darkRespiration?.value ?? DEFAULT_DARK_RESPIRATION;
      const respired = fraction * muMax * Math.max(fEnv, 0) * population.cod * dtDays;
      if (respired > 0) {
        const terms: Record<string, number> = {};
        addTerm(terms, key, -1);
        addTerm(terms, onLand ? POOL.soilTan : POOL.tan, ratios.n);
        addTerm(terms, onLand ? POOL.soilPo4 : POOL.po4, ratios.p);
        if (!onLand) {
          addTerm(terms, POOL.o2, -1);
          addTerm(terms, POOL.co2, CO2_PER_O2);
        }
        processes.push({
          name: `dark_respiration:${population.id}`,
          rate: respired,
          stoichiometry: terms,
          speciesId: population.speciesId,
        });
      }
    }
  }
  return processes;
}
