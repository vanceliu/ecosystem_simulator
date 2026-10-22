import type { Archetype, Defense, DietProfile, Flag, Habitat } from '../content/archetype';
import type { ParameterSet } from '../content/parameters';
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

const ACTIVITIES: readonly Activity[] = ['diurnal', 'nocturnal', 'constant'];

const geometricMean = (a: number, b: number): number => Math.sqrt(a * b);
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const at = <T>(values: readonly T[], index: number): T => {
  const value = values[index];
  if (value === undefined) throw new Error(`index ${index} out of range`);
  return value;
};

function alleleMap(
  params: ParameterSet,
  archetype: Archetype,
  alleles: readonly number[],
): Map<LocusId, number> {
  return new Map(
    lociFor(params, archetype).map((locus, position) => [locus.id, alleles[position] ?? 0]),
  );
}

/** Derives every simulation trait from archetype + genotype; deterministic (docs/05 §2). */
export function derivePhenotype(
  params: ParameterSet,
  archetype: Archetype,
  code: GenotypeCode,
): Phenotype {
  const table = params.generation.phenotype;
  const effect = table.mutationEffect;
  const { alleles } = decodeGenotype(params, archetype, code);
  const allele = alleleMap(params, archetype, alleles);
  const get = (id: LocusId): number => allele.get(id) ?? 0;
  const jitter = (trait: string): number => 1 + table.jitter * signedUnit(`${code}|${trait}`);
  const sizeAlleles = params.generation.loci.size.labelsZh?.length ?? 1;
  const mutation = at(MUTATIONS, get('mutation'));

  const massMin = archetype.massMg.min.value;
  const massMax = archetype.massMg.max.value;
  const logMin = Math.log10(massMin);
  const logSpan = Math.log10(massMax) - logMin;
  let adultMassMg = 10 ** (logMin + ((get('size') + 0.5) / sizeAlleles) * logSpan) * jitter('mass');
  if (mutation === 'gigantism') adultMassMg *= effect.gigantismMass;
  if (mutation === 'dwarfism') adultMassMg *= effect.dwarfismMass;
  const lengthMm =
    archetype.typicalLengthMm.value * Math.cbrt(adultMassMg / geometricMean(massMin, massMax));

  const tolerance = archetype.tolerance;
  const tMin = tolerance.temperatureC.min.value;
  const tMax = tolerance.temperatureC.max.value;
  let thermalOpt = clamp(
    at(table.thermalOptC, get('thermal')),
    tMin + (tMax - tMin) * table.thermalEdgeShare,
    tMax - (tMax - tMin) * table.thermalEdgeShare,
  );
  if (mutation === 'melanistic') thermalOpt += effect.melanisticThermalShift;
  let thermalWidth =
    ((tMax - tMin) / 2) *
    table.speciesThermalShare *
    (get('thermal') === table.eurythermalAllele ? table.eurythermalWidth : 1);
  if (mutation === 'eurythermal') thermalWidth *= effect.eurythermalWidth;
  const temperatureC: ToleranceRange = {
    min: Math.max(tMin, thermalOpt - thermalWidth),
    opt: thermalOpt,
    max: Math.min(tMax, thermalOpt + thermalWidth),
  };

  let salinityPpt: ToleranceRange | undefined;
  if (tolerance.salinityPpt !== undefined && archetype.zone !== 'T') {
    const sMin = tolerance.salinityPpt.min.value;
    const sMax = tolerance.salinityPpt.max.value;
    const width = (sMax - sMin) * at(table.salinityWidth, get('salinity'));
    const lowEnd = get('salinity') < 2;
    let min = lowEnd ? sMin : sMax - width;
    let max = lowEnd ? sMin + width : sMax;
    if (mutation === 'euryhaline') {
      const expansion = (max - min) * effect.euryhalineExpansion;
      min = Math.max(0, min - expansion);
      max = Math.min(table.salinityCeilingPpt, max + expansion);
    }
    salinityPpt = { min, opt: (min + max) / 2, max };
  }

  let humidityMinPercent: number | undefined;
  if (tolerance.humidityMinPercent !== undefined) {
    const offset = archetype.zone === 'T' ? at(table.humidityOffset, get('humidity')) : 0;
    humidityMinPercent = clamp(
      tolerance.humidityMinPercent.value + offset,
      table.humidityMinPercent.min,
      table.humidityMinPercent.max,
    );
  }

  const phMin = tolerance.ph.min.value;
  const phMax = tolerance.ph.max.value;
  const ph: ToleranceRange = {
    min: phMin,
    opt: clamp(at(table.phOpt, get('ph')), phMin + table.phOptMargin, phMax - table.phOptMargin),
    max: phMax,
  };

  const hardiness = get('hardiness');
  const toxinFactor = at(table.hardinessToxin, hardiness);
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
      : tolerance.o2MinMgL.value * at(table.hardinessOxygen, hardiness) * jitter('o2');

  let growthMultiplier =
    at(table.growthRate, get('growth')) * at(table.hardinessGrowth, hardiness) * jitter('growth');
  const assimilationMultiplier = at(table.growthAssimilation, get('growth'));
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
  if (mutation === 'gigantism') lifespanFactor *= effect.gigantismLifespan;
  if (mutation === 'dwarfism') lifespanFactor *= effect.dwarfismLifespan;
  if (mutation === 'longevity') {
    lifespanFactor *= effect.longevityLifespan;
    growthMultiplier *= effect.longevityGrowth;
  }
  typicalDays = Math.min(capDays * table.typicalCapShare, typicalDays * lifespanFactor);
  const maxDays = Math.min(
    capDays,
    Math.max(
      typicalDays * table.maxOverTypicalMin,
      (typicalDays * span.max.value) / Math.max(typicalMid, 1e-9),
    ),
  );

  const maturity = archetype.lifeHistory.maturityDays;
  let maturityDays = geometricMean(maturity.min.value, maturity.max.value) * jitter('maturity');
  if (mutation === 'dwarfism') maturityDays *= effect.dwarfismMaturity;

  const flags = new Set<Flag>(archetype.flags);
  if (mutation === 'resistant') flags.add('medication_resistant');

  let predationExposure = 1;
  let nightExposure = 1;
  let nightAttack = 1;
  if (mutation === 'albino') predationExposure *= effect.albinoExposure;
  if (mutation === 'melanistic') predationExposure *= effect.melanisticExposure;
  if (mutation === 'bioluminescent') {
    nightExposure = effect.glowExposure;
    nightAttack = effect.glowAttack;
  }

  let light: Phenotype['light'];
  if (archetype.kind === 'biomass' && archetype.light !== undefined) {
    const pigment = get('pigment');
    light = {
      halfSaturation:
        archetype.light.halfSaturation.value * at(table.pigmentLightHalfSaturation, pigment),
      optimum: archetype.light.optimum.value * at(table.pigmentLightOptimum, pigment),
    };
    if (mutation === 'albino') growthMultiplier *= effect.albinoPhotosynthesis;
  }

  if (archetype.kind === 'cohort') {
    const defenses = at(archetype.defenses, get('defense'));
    if (defenses.includes('shell')) growthMultiplier *= table.shellGrowth;
    if (defenses.includes('toxin') || defenses.includes('venom'))
      metabolicMultiplier *= table.toxinMetabolism;
    if (get('pattern') === table.mimicryPattern) predationExposure *= table.mimicryExposure;
    const fecundity = get('fecundity');
    const clutchRange = archetype.lifeHistory.reproduction.clutch;
    const baseClutch =
      clutchRange === undefined
        ? 1
        : geometricMean(
            clutchRange.min.value,
            Math.max(clutchRange.min.value, clutchRange.max.value),
          );
    let clutch = Math.max(1, baseClutch * at(table.fecundityClutch, fecundity) * jitter('clutch'));
    let juvenileSurvivalMultiplier = at(table.fecunditySurvival, fecundity);
    if (mutation === 'gigantism') clutch *= effect.gigantismClutch;
    if (mutation === 'fecundity') {
      clutch *= effect.fecundityClutch;
      juvenileSurvivalMultiplier *= effect.fecunditySurvival;
    }
    const eggMassMg = adultMassMg * table.eggMassFraction * at(table.fecundityEgg, fecundity);
    clutch = Math.max(
      1,
      Math.min(clutch, (table.maxReproductiveFraction * adultMassMg) / eggMassMg),
    );
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
      lifespan: {
        typicalDays,
        maxDays,
        capDays,
        gompertz: fitGompertz(params, typicalDays, maxDays),
      },
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
    growthMultiplier: growthMultiplier * at(table.metabolismRate, metabolism),
    assimilationMultiplier,
    metabolicMultiplier,
    lifespan: {
      typicalDays,
      maxDays,
      capDays,
      gompertz: fitGompertz(params, typicalDays, maxDays),
    },
    maturityDays,
    juvenileSurvivalMultiplier: 1,
    defenses: [],
    habitats: [],
    activity: 'constant',
    predationExposure,
    nightExposure,
    nightAttack,
    morphology: at(archetype.morphologies, get('morphology')),
    halfSaturationMultiplier: at(table.metabolismHalfSat, metabolism),
    specialisedMetabolism: metabolism === table.specialisedMetabolism,
    ...(light === undefined ? {} : { light }),
    flags: [...flags],
    pigmentIndex: get('pigment'),
  };
}
