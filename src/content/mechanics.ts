import type { Defense } from './archetype';
import type { Sourced } from './sourced';

type Numbers<K extends string> = Readonly<Record<K, number>>;

/** Physical and chemical constants (ref_param `physics.*`). */
export type PhysicsParams = Readonly<
  Record<
    | 'lapseRateCPerM'
    | 'carbonicPk1'
    | 'hco3MmolPerDkh'
    | 'co2MgPerMmol'
    | 'co2EquilibriumMgL'
    | 'ppfdPerWatt'
    | 'co2PerO2'
    | 'alkalinityPerCa'
    | 'denitrificationCodPerN'
    | 'tidePeriodH'
    | 'seaSaltReferencePpt',
    Sourced
  >
>;

export interface MinMaxOpt {
  readonly min: number;
  readonly opt: number;
  readonly max: number;
}

/** Game-mechanics parameters (ref_param `mechanics.*`; docs/04). */
export interface MechanicsParams {
  readonly numerics: Numbers<
    | 'maxRelativeChange'
    | 'maxSubsteps'
    | 'substepConcentrationFloor'
    | 'suitableDrawAttempts'
    | 'phMin'
    | 'phMax'
  >;
  readonly limits: Numbers<
    'maxTotalVolumeL' | 'maxCohorts' | 'saturationLimit' | 'saturationResume' | 'minCohortCount'
  >;
  readonly water: Numbers<
    | 'heaterRatePerTick'
    | 'passiveRatePerTick'
    | 'klaBase'
    | 'klaAeration'
    | 'klaFlow'
    | 'iceGasTransferFactor'
    | 'outdoorTauBaseDays'
    | 'outdoorTauPerCm'
    | 'iceLightFactor'
    | 'snowLightFactor'
    | 'tideAmplitude'
    | 'seasonalDryingPerDay'
    | 'marineSalinityPpt'
  >;
  readonly land: Numbers<
    | 'mistStartHour'
    | 'mistHumidityGain'
    | 'mistSoilGain'
    | 'rainSoilGainPerMm'
    | 'humidityRatePerTick'
    | 'soilRatePerTick'
    | 'airTemperatureRatePerTick'
    | 'runoffSolublePerDay'
    | 'runoffLitterPerDay'
  >;
  readonly climate: Numbers<
    'wetSeasonShare' | 'humidityTransitionDays' | 'maxRainDayProbability' | 'peakTemperatureHour'
  >;
  readonly biota: {
    readonly zoneWaterFraction: Numbers<'W' | 'T' | 'A'>;
    readonly habitatWaterShift: number;
  };
  readonly consumers: Numbers<
    | 'minDietShare'
    | 'offPhaseActivity'
    | 'habitatMismatchOverlap'
    | 'eggStageDays'
    | 'minRefuge'
    | 'embeddedRefuge'
    | 'maxAssimilation'
    | 'arrivalFoodHalfSaturation'
  > & {
    readonly defaultPreySizeRatio: MinMaxOpt;
    readonly defenseRefuge: Numbers<Defense>;
  };
  readonly producers: Numbers<'fixerNFloor' | 'ammoniumPreference' | 'defaultDarkRespiration'>;
  readonly microbes: Numbers<'specialistActivityReference' | 'maxInitialCapacityShare'>;
  readonly mortality: Numbers<
    | 'starvationMassShare'
    | 'uvbDeficitDays'
    | 'semelparousDeathDays'
    | 'clonalCollapseHazard'
    | 'bleachedMortalityFactor'
    | 'bleachedDays'
  > & {
    readonly stress: Numbers<
      | 'ammonia'
      | 'nitrite'
      | 'hypoxia'
      | 'outOfTolerance'
      | 'starvation'
      | 'desiccation'
      | 'noLand'
      | 'noWater'
      | 'noUvb'
      | 'escape'
    >;
  };
  readonly demography: Numbers<
    | 'breedingMassShare'
    | 'breedingEnvironment'
    | 'juvenileSurvivalBase'
    | 'defaultBreedingIntervalDays'
    | 'defaultLarvalShare'
    | 'cohortMutationRate'
    | 'mutantFounders'
  > & {
    readonly recruitment: Numbers<'normal' | 'rare' | 'none'>;
  };
  readonly daily: Numbers<
    | 'establishmentDays'
    | 'bloomDailyGrowth'
    | 'bloomCapacityShare'
    | 'boomFactor'
    | 'boomWindowDays'
    | 'biomassMutationRate'
    | 'mutantBiomassShare'
    | 'sexualReproductionRate'
    | 'lowSymbiontDensity'
  > & {
    readonly trophicMilestones: readonly number[];
  };
  readonly emergence: Numbers<
    | 'initialInoculationProbability'
    | 'microbeStrainArrivalsPerDay'
    | 'microbeStrainFoundingDays'
    | 'outdoorOutsideFactor'
    | 'reuseProbability'
    | 'foundingBiomassShare'
    | 'foundingAgeShare'
    | 'foundingMassShare'
    | 'releaseCount'
    | 'releaseBiomassShare'
    | 'initialMicrobeStrains'
  > & {
    readonly arrivalRatePerDay: Numbers<'background' | 'open_inflow' | 'outside'>;
    readonly foundingCount: Numbers<'min' | 'max'>;
  };
  readonly symbiosis: Numbers<
    | 'bleachingLossPerTick'
    | 'recoveryPerTick'
    | 'bleachingExcessC'
    | 'calciumSufficientMgL'
    | 'calciumLimitedFactor'
  >;
  readonly events: Numbers<
    | 'cycleTanMaxMgL'
    | 'cycleNo2MaxMgL'
    | 'cycleRequiredDays'
    | 'cycleMinTotalNitrifiedMgL'
    | 'ammoniaSpikeNh3MgL'
    | 'nitriteSpikeMgL'
    | 'hypoxiaO2MgL'
    | 'droughtVolumeFraction'
  >;
}

export interface EnclosurePreset {
  readonly lengthCm: number;
  readonly widthCm: number;
  readonly heightCm: number;
}

/** Recommended tank settings (ref_param `setup.*`; docs/11 §5.1). */
export interface SetupParams {
  readonly springEquinoxDay: Numbers<'north' | 'south'>;
  readonly defaultRoomTemperatureC: number;
  readonly defaultOutdoorShading: number;
  readonly defaultSubstrateDepthCm: number;
  readonly defaultLandSubstrateDepthCm: number;
  readonly humidLidThreshold: number;
  readonly saltWaterMinPpt: number;
  readonly canisterMinVolumeL: number;
  readonly stillWaterFlow: number;
  readonly defaultAeration: number;
  readonly enclosures: {
    readonly terrarium: EnclosurePreset & { readonly minLandPercent: number };
    readonly paludarium: EnclosurePreset & { readonly minLandPercent: number };
    readonly deepWater: EnclosurePreset & { readonly minWaterDepthCm: number };
    readonly aquarium: EnclosurePreset;
  };
}
