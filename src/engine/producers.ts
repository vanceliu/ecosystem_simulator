import type { BiomassData, SpecialisedEffects } from '../content/archetype';
import type { Phenotype } from '../generation/index';
import { getArchetype } from '../content/archetypes/index';
import { SEDIMENT } from '../content/physiology';
import { PRODUCTION } from '../content/stoichiometry';
import { landDensity, waterConcentration, type BioContext } from './bioContext';
import {
  bodyRatios,
  effect,
  environmentFactor,
  humidityMinOf,
  phenotypeOf,
  specialisedOf,
} from './biota';
import { crowdingFactor } from './crowding';
import { addTerm, type Process } from './fluxes';
import { POOL, populationKey } from './pools';
import { porewaterConcentration, rootShare } from './sediment';
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

/** docs/05 §2.3: light response of photosynthetic symbionts and biofilm algae (Chlorella). */
const SYMBIONT_LIGHT_ARCHETYPE = 'phytoplankton';
/** docs/05 §2.3: dark heterotrophy uses the heterotroph substrate kinetics */
const DARK_HETEROTROPHY_ARCHETYPE = 'heterotroph';
/** CaCO3 deposition lowers alkalinity (as CaCO3) by this much per mg Ca */
const ALKALINITY_PER_CA = 100.09 / 40.08;

function lightOf(phenotype: Phenotype, effects: SpecialisedEffects) {
  const own = phenotype.light;
  const fallback = getArchetype(SYMBIONT_LIGHT_ARCHETYPE);
  const base =
    own ??
    (fallback.kind === 'biomass' && fallback.light !== undefined
      ? {
          halfSaturation: fallback.light.halfSaturation.value,
          optimum: fallback.light.optimum.value,
        }
      : undefined);
  if (base === undefined) return undefined;
  return {
    halfSaturation: base.halfSaturation * effect(effects.lightHalfSat),
    optimum: base.optimum * effect(effects.lightOptimum),
  };
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
    if (archetype.kind !== 'biomass' || population.cod <= 0) continue;
    const phenotype = phenotypeOf(population.speciesId);
    const effects = specialisedOf(archetype, phenotype);
    const producer = isProducer(archetype);
    const photoShare = producer ? 1 : (effects.photosynthesis?.value ?? 0);
    const darkShare = effects.darkHeterotrophy?.value ?? 0;
    if (photoShare <= 0 && darkShare <= 0) continue;
    const onLand = archetype.zone === 'T';
    if (onLand ? !context.media.hasLand : !context.media.hasWater) continue;
    const kinetics = archetype.kinetics;
    const ratios = bodyRatios(archetype);
    const key = populationKey(population.id);
    const temperature = onLand
      ? context.state.land.airTemperatureC
      : context.state.water.temperatureC;
    const fEnv = environmentFactor(
      context.state,
      phenotype,
      temperature,
      onLand ? 0 : 1,
      humidityMinOf(archetype, phenotype),
    );
    const muMax = kinetics.muMax.value * phenotype.growthMultiplier * effect(effects.growth);
    const crowd = crowdingFactor(context.occupancy, archetype.id);
    const halfSat = (value: number | undefined): number =>
      (value ?? 0) * phenotype.halfSaturationMultiplier;

    const light = photoShare > 0 ? lightOf(phenotype, effects) : undefined;
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
      const rooted = archetype.rooted === true && !onLand;
      const poreN = rooted ? porewaterConcentration(context, POOL.sedimentTan) : 0;
      const poreP = rooted ? porewaterConcentration(context, POOL.sedimentPo4) : 0;
      const nLimitRaw = Math.max(
        monod(tan + no3, halfSat(kinetics.halfSat.nitrogen?.value)),
        monod(poreN, SEDIMENT.rootHalfSatN.value),
      );
      const fixer = archetype.flags.includes('nitrogen_fixer');
      const nLimit = fixer ? Math.max(nLimitRaw, FIXER_N_FLOOR) : nLimitRaw;
      const fixedShare = fixer && nLimit > 0 ? 1 - nLimitRaw / nLimit : 0;
      const limits = [
        nLimit,
        Math.max(
          monod(po4, halfSat(kinetics.halfSat.phosphorus?.value)),
          monod(poreP, SEDIMENT.rootHalfSatP.value),
        ),
      ];
      const rootN = rootShare(poreN, tan + no3);
      const rootP = rootShare(poreP, po4);
      const waterCarbon = !onLand && effects.aerialCo2 !== true;
      if (waterCarbon && kinetics.halfSat.co2 !== undefined)
        limits.push(
          monod(
            waterConcentration(context, POOL.co2),
            halfSat(kinetics.halfSat.co2.value) * effect(effects.co2HalfSat),
          ),
        );
      const silica = effect(effects.silicaDemand);
      if (kinetics.halfSat.silicate !== undefined)
        limits.push(
          monod(waterConcentration(context, POOL.sio2), halfSat(kinetics.halfSat.silicate.value)),
        );
      const growth =
        muMax * photoShare * fEnv * fLight * Math.min(...limits) * crowd * population.cod * dtDays;
      if (growth > 0) {
        const terms: Record<string, number> = {};
        const tanShare =
          tan + no3 > 0 ? (AMMONIUM_PREFERENCE * tan) / (AMMONIUM_PREFERENCE * tan + no3) : 1;
        const assimilatedN = ratios.n * (1 - fixedShare);
        const waterN = assimilatedN * (1 - rootN);
        addTerm(terms, key, 1);
        addTerm(terms, tanKey, -waterN * tanShare);
        if (!onLand) addTerm(terms, POOL.no3, -waterN * (1 - tanShare));
        addTerm(terms, POOL.sedimentTan, -assimilatedN * rootN);
        addTerm(terms, POOL.fixedN, ratios.n * fixedShare);
        addTerm(terms, po4Key, -ratios.p * (1 - rootP));
        addTerm(terms, POOL.sedimentPo4, -ratios.p * rootP);
        if (waterCarbon) {
          addTerm(terms, POOL.co2, -CO2_PER_O2);
          addTerm(terms, POOL.o2, 1);
        }
        if (kinetics.halfSat.silicate !== undefined)
          addTerm(terms, POOL.sio2, -PRODUCTION.silicaPerDiatomCod.value * silica);
        const calcium = effects.calciumPerCod?.value ?? 0;
        if (calcium > 0 && !onLand) {
          addTerm(terms, POOL.ca, -calcium);
          addTerm(terms, POOL.alkalinity, -calcium * ALKALINITY_PER_CA);
        }
        processes.push({
          name: `photosynthesis:${population.id}`,
          rate: growth,
          stoichiometry: terms,
          speciesId: population.speciesId,
        });
      }
    }

    if (!context.lightsOn && producer) {
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

    if (!context.lightsOn && darkShare > 0 && !onLand && fEnv > 0) {
      const heterotroph = getArchetype(DARK_HETEROTROPHY_ARCHETYPE);
      if (heterotroph.kind !== 'biomass') continue;
      const yieldCoefficient = heterotroph.kinetics.yieldCoefficient?.value ?? 0;
      const substrateHalfSat = heterotroph.kinetics.halfSat.substrate?.value ?? 0;
      if (yieldCoefficient <= 0) continue;
      const growth =
        muMax *
        darkShare *
        fEnv *
        monod(waterConcentration(context, POOL.substrate), substrateHalfSat) *
        crowd *
        population.cod *
        dtDays;
      if (growth > 0) {
        const oxidised = (1 - yieldCoefficient) / yieldCoefficient;
        const terms: Record<string, number> = {};
        addTerm(terms, key, 1);
        addTerm(terms, POOL.substrate, -1 / yieldCoefficient);
        addTerm(terms, POOL.o2, -oxidised);
        addTerm(terms, POOL.co2, oxidised * CO2_PER_O2);
        addTerm(terms, POOL.tan, -ratios.n);
        addTerm(terms, POOL.po4, -ratios.p);
        processes.push({
          name: `dark_heterotrophy:${population.id}`,
          rate: growth,
          stoichiometry: terms,
          speciesId: population.speciesId,
        });
      }
    }
  }
  return processes;
}
