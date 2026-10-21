import type { Archetype, Defense, DietProfile, Flag, Habitat } from '../content/archetype';
import { decodeGenotype, type GenotypeCode } from './genotype';
import { fitGompertz, type GompertzParams } from './gompertz';
import { signedUnit } from './hash';
import { lociFor, MUTATIONS, type LocusId, type Mutation } from './loci';

export interface ToleranceRange {
  readonly min: number;
  readonly opt: number;
  readonly max: number;
}

export type Activity = 'diurnal' | 'nocturnal' | 'constant';

export interface Phenotype {
  readonly code: GenotypeCode;
  readonly mutation: Mutation;
  readonly adultMassMg: number;
  readonly lengthMm: number;
  readonly temperatureC: ToleranceRange;
  readonly salinityPpt?: ToleranceRange;
  readonly humidityMinPercent?: number;
  readonly ph: ToleranceRange;
  readonly nh3MaxMgL?: number;
  readonly no2MaxMgL?: number;
  readonly o2MinMgL?: number;
  /** multiplies μmax (biomass) or r0 (cohort) */
  readonly growthMultiplier: number;
  readonly assimilationMultiplier: number;
  readonly metabolicMultiplier: number;
  readonly lifespan: {
    readonly typicalDays: number;
    readonly maxDays: number;
    readonly capDays: number;
    readonly gompertz: GompertzParams;
  };
  readonly maturityDays: number;
  /** cohort only */
  readonly clutch?: number;
  readonly eggMassMg?: number;
  readonly juvenileSurvivalMultiplier: number;
  readonly diet?: DietProfile;
  readonly defenses: readonly Defense[];
  readonly habitats: readonly Habitat[];
  readonly activity: Activity;
  /** multiplies the attack rate predators achieve on this species */
  readonly predationExposure: number;
  /** extra multiplier on predation exposure at night */
  readonly nightExposure: number;
  /** extra multiplier on this species' own attack rate at night */
  readonly nightAttack: number;
  /** biomass only */
  readonly morphology?: string;
  readonly halfSaturationMultiplier: number;
  readonly specialisedMetabolism: boolean;
  readonly light?: { readonly halfSaturation: number; readonly optimum: number };
  readonly flags: readonly Flag[];
  readonly pigmentIndex: number;
  readonly patternIndex?: number;
}

/** docs/05 §2.1 */
const THERMAL_OPT_C = [14, 20, 22, 26, 29];
const EURYTHERMAL_ALLELE = 2;
const EURYTHERMAL_WIDTH = 1.6;
/** a species spans this share of its archetype's temperature range */
const SPECIES_THERMAL_SHARE = 0.6;
const SALINITY_WIDTH = [0.4, 0.75, 0.75, 0.4];
const HUMIDITY_OFFSET = [-20, -10, 0, 10];
const PH_OPT = [6.5, 7.2, 8.0];
const HARDINESS_TOXIN = [0.6, 1, 1.5];
const HARDINESS_OXYGEN = [1.3, 1, 0.8];
const HARDINESS_GROWTH = [1.1, 1, 0.9];
const GROWTH_RATE = [1.25, 1, 0.8];
const GROWTH_ASSIMILATION = [0.9, 1, 1.1];
const FECUNDITY_CLUTCH = [2, 1, 0.5, 0.25];
const FECUNDITY_EGG = [0.5, 1, 2, 4];
const FECUNDITY_SURVIVAL = [0.5, 1, 1.5, 2.5];
const METABOLISM_HALF_SAT = [0.5, 1, 1.5, 1];
const METABOLISM_RATE = [0.8, 1, 1.2, 1];
const SPECIALISED_METABOLISM = 3;
const ACTIVITIES: readonly Activity[] = ['diurnal', 'nocturnal', 'constant'];
const MIMICRY_PATTERN = 7;
const MIMICRY_EXPOSURE = 0.85;
/** docs/05 §2.6 */
const EGG_MASS_FRACTION = 0.01;
const MAX_REPRODUCTIVE_FRACTION = 0.3;
const SHELL_GROWTH = 0.85;
const TOXIN_METABOLISM = 1.1;
/** docs/05 §2.5 */
const JITTER = 0.05;

/** docs/05 §2.7 */
const MUTATION_EFFECT = {
  albinoExposure: 1.2,
  albinoPhotosynthesis: 0.7,
  melanisticExposure: 0.9,
  melanisticThermalShift: 1,
  gigantismMass: 2.5,
  gigantismLifespan: 1.2,
  gigantismClutch: 0.7,
  dwarfismMass: 0.4,
  dwarfismLifespan: 0.8,
  dwarfismMaturity: 0.7,
  glowAttack: 1.15,
  glowExposure: 1.3,
  longevityLifespan: 1.5,
  longevityGrowth: 0.85,
  fecundityClutch: 1.8,
  fecunditySurvival: 0.7,
  eurythermalWidth: 1.8,
  euryhalineExpansion: 0.5,
} as const;

const geometricMean = (a: number, b: number): number => Math.sqrt(a * b);
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const at = <T>(values: readonly T[], index: number): T => {
  const value = values[index];
  if (value === undefined) throw new Error(`index ${index} out of range`);
  return value;
};

function alleleMap(archetype: Archetype, alleles: readonly number[]): Map<LocusId, number> {
  return new Map(lociFor(archetype).map((locus, position) => [locus.id, alleles[position] ?? 0]));
}

/** Derives every simulation trait from archetype + genotype; deterministic (docs/05 §2). */
export function derivePhenotype(archetype: Archetype, code: GenotypeCode): Phenotype {
  const { alleles } = decodeGenotype(archetype, code);
  const allele = alleleMap(archetype, alleles);
  const get = (id: LocusId): number => allele.get(id) ?? 0;
  const jitter = (trait: string): number => 1 + JITTER * signedUnit(`${code}|${trait}`);
  const mutation = at(MUTATIONS, get('mutation'));

  const massMin = archetype.massMg.min.value;
  const massMax = archetype.massMg.max.value;
  const logMin = Math.log10(massMin);
  const logSpan = Math.log10(massMax) - logMin;
  let adultMassMg = 10 ** (logMin + ((get('size') + 0.5) / 7) * logSpan) * jitter('mass');
  if (mutation === 'gigantism') adultMassMg *= MUTATION_EFFECT.gigantismMass;
  if (mutation === 'dwarfism') adultMassMg *= MUTATION_EFFECT.dwarfismMass;
  const lengthMm =
    archetype.typicalLengthMm.value * Math.cbrt(adultMassMg / geometricMean(massMin, massMax));

  const tolerance = archetype.tolerance;
  const tMin = tolerance.temperatureC.min.value;
  const tMax = tolerance.temperatureC.max.value;
  let thermalOpt = clamp(
    at(THERMAL_OPT_C, get('thermal')),
    tMin + (tMax - tMin) * 0.1,
    tMax - (tMax - tMin) * 0.1,
  );
  if (mutation === 'melanistic') thermalOpt += MUTATION_EFFECT.melanisticThermalShift;
  let thermalWidth =
    ((tMax - tMin) / 2) *
    SPECIES_THERMAL_SHARE *
    (get('thermal') === EURYTHERMAL_ALLELE ? EURYTHERMAL_WIDTH : 1);
  if (mutation === 'eurythermal') thermalWidth *= MUTATION_EFFECT.eurythermalWidth;
  const temperatureC: ToleranceRange = {
    min: Math.max(tMin, thermalOpt - thermalWidth),
    opt: thermalOpt,
    max: Math.min(tMax, thermalOpt + thermalWidth),
  };

  let salinityPpt: ToleranceRange | undefined;
  if (tolerance.salinityPpt !== undefined && archetype.zone !== 'T') {
    const sMin = tolerance.salinityPpt.min.value;
    const sMax = tolerance.salinityPpt.max.value;
    const width = (sMax - sMin) * at(SALINITY_WIDTH, get('salinity'));
    const lowEnd = get('salinity') < 2;
    let min = lowEnd ? sMin : sMax - width;
    let max = lowEnd ? sMin + width : sMax;
    if (mutation === 'euryhaline') {
      const expansion = (max - min) * MUTATION_EFFECT.euryhalineExpansion;
      min = Math.max(0, min - expansion);
      max = Math.min(35, max + expansion);
    }
    salinityPpt = { min, opt: (min + max) / 2, max };
  }

  let humidityMinPercent: number | undefined;
  if (tolerance.humidityMinPercent !== undefined) {
    const offset = archetype.zone === 'T' ? at(HUMIDITY_OFFSET, get('humidity')) : 0;
    humidityMinPercent = clamp(tolerance.humidityMinPercent.value + offset, 10, 95);
  }

  const phMin = tolerance.ph.min.value;
  const phMax = tolerance.ph.max.value;
  const ph: ToleranceRange = {
    min: phMin,
    opt: clamp(at(PH_OPT, get('ph')), phMin + 0.2, phMax - 0.2),
    max: phMax,
  };

  const hardiness = get('hardiness');
  const toxinFactor = at(HARDINESS_TOXIN, hardiness);
  const nh3MaxMgL =
    tolerance.nh3MaxMgL === undefined
      ? undefined
      : tolerance.nh3MaxMgL.value * toxinFactor * jitter('nh3');
  const no2MaxMgL =
    tolerance.no2MaxMgL === undefined
      ? undefined
      : tolerance.no2MaxMgL.value * toxinFactor * jitter('no2');
  const o2MinMgL =
    tolerance.o2MinMgL === undefined
      ? undefined
      : tolerance.o2MinMgL.value * at(HARDINESS_OXYGEN, hardiness) * jitter('o2');

  let growthMultiplier =
    at(GROWTH_RATE, get('growth')) * at(HARDINESS_GROWTH, hardiness) * jitter('growth');
  const assimilationMultiplier = at(GROWTH_ASSIMILATION, get('growth'));
  let metabolicMultiplier = 1;

  const span = archetype.lifeHistory.lifespanDays;
  const capDays = archetype.lifeHistory.gameCapDays.value;
  const lifespanAllele = get('lifespan');
  const typicalMid = (span.typLow.value + span.typHigh.value) / 2;
  let typicalDays =
    lifespanAllele === 0
      ? geometricMean(span.min.value, span.typLow.value)
      : lifespanAllele === 1
        ? typicalMid
        : (span.typHigh.value + span.max.value) / 2;
  typicalDays *= jitter('lifespan');
  let lifespanFactor = 1;
  if (mutation === 'gigantism') lifespanFactor *= MUTATION_EFFECT.gigantismLifespan;
  if (mutation === 'dwarfism') lifespanFactor *= MUTATION_EFFECT.dwarfismLifespan;
  if (mutation === 'longevity') {
    lifespanFactor *= MUTATION_EFFECT.longevityLifespan;
    growthMultiplier *= MUTATION_EFFECT.longevityGrowth;
  }
  typicalDays = Math.min(capDays * 0.9, typicalDays * lifespanFactor);
  const maxDays = Math.min(
    capDays,
    Math.max(typicalDays * 1.05, (typicalDays * span.max.value) / Math.max(typicalMid, 1e-9)),
  );

  const maturity = archetype.lifeHistory.maturityDays;
  let maturityDays = geometricMean(maturity.min.value, maturity.max.value) * jitter('maturity');
  if (mutation === 'dwarfism') maturityDays *= MUTATION_EFFECT.dwarfismMaturity;

  const flags = new Set<Flag>(archetype.flags);
  if (mutation === 'resistant') flags.add('medication_resistant');

  let predationExposure = 1;
  let nightExposure = 1;
  let nightAttack = 1;
  if (mutation === 'albino') predationExposure *= MUTATION_EFFECT.albinoExposure;
  if (mutation === 'melanistic') predationExposure *= MUTATION_EFFECT.melanisticExposure;
  if (mutation === 'bioluminescent') {
    nightExposure = MUTATION_EFFECT.glowExposure;
    nightAttack = MUTATION_EFFECT.glowAttack;
  }

  let light: Phenotype['light'];
  if (archetype.kind === 'biomass' && archetype.light !== undefined) {
    const pigment = get('pigment');
    const lowLightAdapted = pigment === 1 || pigment === 2;
    const highLightAdapted = pigment === 4 || pigment === 5;
    light = {
      halfSaturation: archetype.light.halfSaturation.value * (lowLightAdapted ? 0.7 : 1),
      optimum: archetype.light.optimum.value * (lowLightAdapted ? 0.8 : highLightAdapted ? 1.2 : 1),
    };
    if (mutation === 'albino') growthMultiplier *= MUTATION_EFFECT.albinoPhotosynthesis;
  }

  if (archetype.kind === 'cohort') {
    const defenses = at(archetype.defenses, get('defense'));
    if (defenses.includes('shell')) growthMultiplier *= SHELL_GROWTH;
    if (defenses.includes('toxin') || defenses.includes('venom'))
      metabolicMultiplier *= TOXIN_METABOLISM;
    if (get('pattern') === MIMICRY_PATTERN) predationExposure *= MIMICRY_EXPOSURE;
    const fecundity = get('fecundity');
    const clutchRange = archetype.lifeHistory.reproduction.clutch;
    const baseClutch =
      clutchRange === undefined
        ? 1
        : geometricMean(
            clutchRange.min.value,
            Math.max(clutchRange.min.value, clutchRange.max.value),
          );
    let clutch = Math.max(1, baseClutch * at(FECUNDITY_CLUTCH, fecundity) * jitter('clutch'));
    let juvenileSurvivalMultiplier = at(FECUNDITY_SURVIVAL, fecundity);
    if (mutation === 'gigantism') clutch *= MUTATION_EFFECT.gigantismClutch;
    if (mutation === 'fecundity') {
      clutch *= MUTATION_EFFECT.fecundityClutch;
      juvenileSurvivalMultiplier *= MUTATION_EFFECT.fecunditySurvival;
    }
    const eggMassMg = adultMassMg * EGG_MASS_FRACTION * at(FECUNDITY_EGG, fecundity);
    clutch = Math.max(1, Math.min(clutch, (MAX_REPRODUCTIVE_FRACTION * adultMassMg) / eggMassMg));
    return {
      code,
      mutation,
      adultMassMg,
      lengthMm,
      temperatureC,
      ...(salinityPpt === undefined ? {} : { salinityPpt }),
      ...(humidityMinPercent === undefined ? {} : { humidityMinPercent }),
      ph,
      ...(nh3MaxMgL === undefined ? {} : { nh3MaxMgL }),
      ...(no2MaxMgL === undefined ? {} : { no2MaxMgL }),
      ...(o2MinMgL === undefined ? {} : { o2MinMgL }),
      growthMultiplier,
      assimilationMultiplier,
      metabolicMultiplier,
      lifespan: { typicalDays, maxDays, capDays, gompertz: fitGompertz(typicalDays, maxDays) },
      maturityDays,
      clutch,
      eggMassMg,
      juvenileSurvivalMultiplier,
      diet: at(archetype.diets, get('diet')),
      defenses,
      habitats: at(archetype.habitats, get('habitat')),
      activity: at(ACTIVITIES, get('activity')),
      predationExposure,
      nightExposure,
      nightAttack,
      halfSaturationMultiplier: 1,
      specialisedMetabolism: false,
      flags: [...flags],
      pigmentIndex: get('pigment'),
      patternIndex: get('pattern'),
    };
  }

  const metabolism = get('metabolism');
  return {
    code,
    mutation,
    adultMassMg,
    lengthMm,
    temperatureC,
    ...(salinityPpt === undefined ? {} : { salinityPpt }),
    ...(humidityMinPercent === undefined ? {} : { humidityMinPercent }),
    ph,
    ...(nh3MaxMgL === undefined ? {} : { nh3MaxMgL }),
    ...(no2MaxMgL === undefined ? {} : { no2MaxMgL }),
    ...(o2MinMgL === undefined ? {} : { o2MinMgL }),
    growthMultiplier: growthMultiplier * at(METABOLISM_RATE, metabolism),
    assimilationMultiplier,
    metabolicMultiplier,
    lifespan: { typicalDays, maxDays, capDays, gompertz: fitGompertz(typicalDays, maxDays) },
    maturityDays,
    juvenileSurvivalMultiplier: 1,
    defenses: [],
    habitats: [],
    activity: 'constant',
    predationExposure,
    nightExposure,
    nightAttack,
    morphology: at(archetype.morphologies, get('morphology')),
    halfSaturationMultiplier: at(METABOLISM_HALF_SAT, metabolism),
    specialisedMetabolism: metabolism === SPECIALISED_METABOLISM,
    ...(light === undefined ? {} : { light }),
    flags: [...flags],
    pigmentIndex: get('pigment'),
  };
}
