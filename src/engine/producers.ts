import type { BiomassData, SpecialisedEffects } from '../content/archetype';
import type { ParameterSet } from '../content/parameters';
import type { Phenotype } from '../generation/index';
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
import { addTerm, type PoolKey, type Process, type Stoichiometry } from './fluxes';
import { populationKey } from './pools';
import { porewaterConcentration, rootShare } from './sediment';
import type { BiomassPopulation } from './types';

/** L of soil per m² per cm of substrate */
const SOIL_L_PER_M2_CM = 10;

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
function soilSolution(context: BioContext, key: PoolKey): number {
  const depth = Math.max(1, context.space.landSubstrateDepthCm);
  const waterPerCm = SOIL_L_PER_M2_CM * context.params.stoichiometry.production.soilPorosity.value;
  const litres = waterPerCm * depth * Math.max(context.state.land.soilMoisture, 0.05);
  return landDensity(context, key) / litres;
}

/** docs/05 §2.3: light response of photosynthetic symbionts and biofilm algae (Chlorella). */
const SYMBIONT_LIGHT_ARCHETYPE = 'phytoplankton';
/** docs/05 §2.3: dark heterotrophy uses the heterotroph substrate kinetics */
const DARK_HETEROTROPHY_ARCHETYPE = 'heterotroph';

function lightOf(params: ParameterSet, phenotype: Phenotype, effects: SpecialisedEffects) {
  const own = phenotype.light;
  const fallback = params.archetypes[SYMBIONT_LIGHT_ARCHETYPE];
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
  const { params, dtDays } = context;
  const sediment = params.physiology.sediment;
  const mechanics = params.mechanics.producers;
  const co2PerO2 = params.physics.co2PerO2.value;
  for (const population of populations) {
    const archetype = params.archetypes[population.archetypeId];
    if (archetype.kind !== 'biomass' || population.cod <= 0) continue;
    const phenotype = phenotypeOf(params, population.speciesId);
    const effects = specialisedOf(archetype, phenotype);
    const producer = isProducer(archetype);
    const photoShare = producer ? 1 : (effects.photosynthesis?.value ?? 0);
    const darkShare = effects.darkHeterotrophy?.value ?? 0;
    if (photoShare <= 0 && darkShare <= 0) continue;
    const onLand = archetype.zone === 'T';
    if (onLand ? !context.media.hasLand : !context.media.hasWater) continue;
    const kinetics = archetype.kinetics;
    const ratios = bodyRatios(params, archetype);
    const key = populationKey(population.id);
    const temperature = onLand
      ? context.state.land.airTemperatureC
      : context.state.water.temperatureC;
    const fEnv = environmentFactor(
      params,
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

    const light = photoShare > 0 ? lightOf(params, phenotype, effects) : undefined;
    const fLight =
      light === undefined ? 0 : lightFactor(context.ppfd, light.halfSaturation, light.optimum);
    if (fLight > 0 && fEnv > 0) {
      const tanKey: PoolKey = onLand ? 'soil_tan' : 'water_tan';
      const po4Key: PoolKey = onLand ? 'soil_po4' : 'water_po4';
      const tan = onLand
        ? soilSolution(context, 'soil_tan')
        : waterConcentration(context, 'water_tan');
      const no3 = onLand ? 0 : waterConcentration(context, 'water_no3');
      const po4 = onLand
        ? soilSolution(context, 'soil_po4')
        : waterConcentration(context, 'water_po4');
      const rooted = archetype.rooted === true && !onLand;
      const poreN = rooted ? porewaterConcentration(context, 'sediment_tan') : 0;
      const poreP = rooted ? porewaterConcentration(context, 'sediment_po4') : 0;
      const nLimitRaw = Math.max(
        monod(tan + no3, halfSat(kinetics.halfSat.nitrogen?.value)),
        monod(poreN, sediment.rootHalfSatN.value),
      );
      const fixer = archetype.flags.includes('nitrogen_fixer');
      const nLimit = fixer ? Math.max(nLimitRaw, mechanics.fixerNFloor) : nLimitRaw;
      const fixedShare = fixer && nLimit > 0 ? 1 - nLimitRaw / nLimit : 0;
      const limits = [
        nLimit,
        Math.max(
          monod(po4, halfSat(kinetics.halfSat.phosphorus?.value)),
          monod(poreP, sediment.rootHalfSatP.value),
        ),
      ];
      const rootN = rootShare(params, poreN, tan + no3);
      const rootP = rootShare(params, poreP, po4);
      const waterCarbon = !onLand && effects.aerialCo2 !== true;
      if (waterCarbon && kinetics.halfSat.co2 !== undefined)
        limits.push(
          monod(
            waterConcentration(context, 'water_co2'),
            halfSat(kinetics.halfSat.co2.value) * effect(effects.co2HalfSat),
          ),
        );
      const silica = effect(effects.silicaDemand);
      if (kinetics.halfSat.silicate !== undefined)
        limits.push(
          monod(
            waterConcentration(context, 'water_sio2'),
            halfSat(kinetics.halfSat.silicate.value),
          ),
        );
      const growth =
        muMax * photoShare * fEnv * fLight * Math.min(...limits) * crowd * population.cod * dtDays;
      if (growth > 0) {
        const terms: Stoichiometry = {};
        const tanShare =
          tan + no3 > 0
            ? (mechanics.ammoniumPreference * tan) / (mechanics.ammoniumPreference * tan + no3)
            : 1;
        const assimilatedN = ratios.n * (1 - fixedShare);
        const waterN = assimilatedN * (1 - rootN);
        addTerm(terms, key, 1);
        addTerm(terms, tanKey, -waterN * tanShare);
        if (!onLand) addTerm(terms, 'water_no3', -waterN * (1 - tanShare));
        addTerm(terms, 'sediment_tan', -assimilatedN * rootN);
        addTerm(terms, 'meter_fixed_n', ratios.n * fixedShare);
        addTerm(terms, po4Key, -ratios.p * (1 - rootP));
        addTerm(terms, 'sediment_po4', -ratios.p * rootP);
        if (waterCarbon) {
          addTerm(terms, 'water_co2', -co2PerO2);
          addTerm(terms, 'water_o2', 1);
        }
        if (kinetics.halfSat.silicate !== undefined)
          addTerm(
            terms,
            'water_sio2',
            -params.stoichiometry.production.silicaPerDiatomCod.value * silica,
          );
        const calcium = effects.calciumPerCod?.value ?? 0;
        if (calcium > 0 && !onLand) {
          addTerm(terms, 'water_ca', -calcium);
          addTerm(terms, 'water_alkalinity', -calcium * params.physics.alkalinityPerCa.value);
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
      const fraction = kinetics.darkRespiration?.value ?? mechanics.defaultDarkRespiration;
      const respired = fraction * muMax * Math.max(fEnv, 0) * population.cod * dtDays;
      if (respired > 0) {
        const terms: Stoichiometry = {};
        addTerm(terms, key, -1);
        addTerm(terms, onLand ? 'soil_tan' : 'water_tan', ratios.n);
        addTerm(terms, onLand ? 'soil_po4' : 'water_po4', ratios.p);
        if (!onLand) {
          addTerm(terms, 'water_o2', -1);
          addTerm(terms, 'water_co2', co2PerO2);
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
      const heterotroph = params.archetypes[DARK_HETEROTROPHY_ARCHETYPE];
      if (heterotroph.kind !== 'biomass') continue;
      const yieldCoefficient = heterotroph.kinetics.yieldCoefficient?.value ?? 0;
      const substrateHalfSat = heterotroph.kinetics.halfSat.substrate?.value ?? 0;
      if (yieldCoefficient <= 0) continue;
      const growth =
        muMax *
        darkShare *
        fEnv *
        monod(waterConcentration(context, 'water_substrate'), substrateHalfSat) *
        crowd *
        population.cod *
        dtDays;
      if (growth > 0) {
        const oxidised = (1 - yieldCoefficient) / yieldCoefficient;
        const terms: Stoichiometry = {};
        addTerm(terms, key, 1);
        addTerm(terms, 'water_substrate', -1 / yieldCoefficient);
        addTerm(terms, 'water_o2', -oxidised);
        addTerm(terms, 'water_co2', oxidised * co2PerO2);
        addTerm(terms, 'water_tan', -ratios.n);
        addTerm(terms, 'water_po4', -ratios.p);
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
