import { derived, estimated, measured, type Sourced } from './sourced';

export type MicrobeId =
  'heterotroph' | 'aob' | 'nob' | 'denitrifier' | 'soil_bacteria' | 'saprotrophic_fungus';

export type MicrobeZone = 'water' | 'land';

/** Where the population lives; attached populations share the biofilm surface capacity. */
export type MicrobeHabitat = 'free' | 'attached' | 'substrate' | 'soil';

/** Trapezoid: full rate between optLow and optHigh, linear to zero at min and max. */
export interface PhTolerance {
  readonly min: Sourced;
  readonly optLow: Sourced;
  readonly optHigh: Sourced;
  readonly max: Sourced;
}

export interface MicrobeKinetics {
  readonly id: MicrobeId;
  readonly zone: MicrobeZone;
  readonly habitat: MicrobeHabitat;
  /** d⁻¹ at 20 °C */
  readonly muMax: Sourced;
  /** mg/L of the limiting substrate (COD for heterotrophs, N for nitrifiers) */
  readonly halfSatSubstrate: Sourced;
  /** mg O2/L */
  readonly halfSatO2: Sourced;
  /** g biomass COD per g substrate (COD or N) */
  readonly yieldCoefficient: Sourced;
  /** d⁻¹ at 20 °C */
  readonly decay: Sourced;
  readonly ph: PhTolerance;
}

export const TEMPERATURE_THETA = estimated(1.072, 'Arrhenius θ equivalent to Q10 = 2');

const NEUTRAL_PH: PhTolerance = {
  min: estimated(4.0, 'heterotrophic bacteria persist in acidic blackwater'),
  optLow: estimated(6.0, 'heterotrophic optimum lower bound'),
  optHigh: estimated(8.5, 'heterotrophic optimum upper bound'),
  max: estimated(9.5, 'alkaline limit'),
};

const NITRIFIER_PH: PhTolerance = {
  min: measured(6.5, 'nitrifierPh'),
  optLow: measured(7.0, 'nitrifierPh'),
  optHigh: measured(8.5, 'perliteBiofilter'),
  max: estimated(9.5, 'alkaline limit'),
};

const heterotrophBase = {
  muMax: measured(4.0, 'asm1'),
  halfSatSubstrate: measured(10, 'asm1'),
  halfSatO2: measured(0.2, 'asm1'),
  yieldCoefficient: measured(0.67, 'asm1'),
  decay: measured(0.3, 'asm1'),
} as const;

export const MICROBES: Readonly<Record<MicrobeId, MicrobeKinetics>> = {
  heterotroph: {
    id: 'heterotroph',
    zone: 'water',
    habitat: 'free',
    ...heterotrophBase,
    ph: NEUTRAL_PH,
  },
  aob: {
    id: 'aob',
    zone: 'water',
    habitat: 'attached',
    muMax: measured(0.5, 'asm1'),
    halfSatSubstrate: measured(1.0, 'asm1'),
    halfSatO2: measured(0.4, 'asm1'),
    yieldCoefficient: measured(0.24, 'asm1'),
    decay: measured(0.05, 'asm1'),
    ph: NITRIFIER_PH,
  },
  nob: {
    id: 'nob',
    zone: 'water',
    habitat: 'attached',
    muMax: derived(
      0.258,
      'nitrospiraKinetics',
      'Nitrospira defluvii generation time 37 h at 28 °C → 0.45 d⁻¹, ÷ θ^8',
    ),
    halfSatSubstrate: derived(0.126, 'nitrospiraKinetics', 'Km 9 µM NO2− × 14 mg N/mmol'),
    halfSatO2: derived(0.4, 'asm1', 'ASM1 autotroph oxygen half-saturation applied to NOB'),
    yieldCoefficient: derived(
      0.0225,
      'nitrospiraKinetics',
      '0.122 mg protein/mmol NO2− ÷ 14 mg N ÷ 0.55 protein fraction × 1.42 COD/dry mass',
    ),
    decay: derived(0.05, 'asm1', 'ASM1 autotroph decay applied to NOB'),
    ph: NITRIFIER_PH,
  },
  denitrifier: {
    id: 'denitrifier',
    zone: 'water',
    habitat: 'substrate',
    ...heterotrophBase,
    muMax: derived(3.2, 'asm1', 'μH 4.0 × anoxic correction ηg 0.8'),
    ph: NEUTRAL_PH,
  },
  soil_bacteria: {
    id: 'soil_bacteria',
    zone: 'land',
    habitat: 'soil',
    ...heterotrophBase,
    ph: NEUTRAL_PH,
  },
  saprotrophic_fungus: {
    id: 'saprotrophic_fungus',
    zone: 'land',
    habitat: 'soil',
    ...heterotrophBase,
    muMax: estimated(1.0, 'fungal hyphae grow slower than bacteria'),
    ph: NEUTRAL_PH,
  },
};

export const MICROBIAL_PROCESSES = {
  /** d⁻¹, ASM1 hydrolysis of slowly biodegradable particulate COD */
  hydrolysisRate: measured(3.0, 'asm1'),
  /** g particulate COD per g heterotroph COD */
  hydrolysisHalfSat: measured(0.1, 'asm1'),
  /** mg N/L */
  nitrateHalfSat: measured(0.5, 'asm1'),
  /** yr⁻¹ at 20 °C, Olson single-exponential litter decay */
  litterDecayPerYear: derived(0.85, 'litterDecay', 'midpoint of reported k 0.53–1.18 yr⁻¹'),
  /** soil moisture at which litter decay reaches full rate */
  litterMoistureOptimum: estimated(0.6, 'decay limited below field-capacity moisture'),
  /** mg COD per m² of colonisable surface */
  biofilmCapacityPerM2: derived(
    426,
    'biofilmDensity',
    '10⁸ cells/cm² × 0.3 pg dry × 1.42 COD/dry mass',
  ),
  /** mg COD/L for free-living bacteria */
  freeBacteriaCapacity: derived(5.96, 'rasBacteria', '1.4 × 10⁷ cells/mL × 0.3 pg × 1.42'),
  /** mg COD per m² of land surface */
  soilMicrobeCapacityPerM2: estimated(5000, 'soil microbial biomass in topsoil'),
  /** mg COD/m² of dissolved soil organic matter at half-maximal soil-microbe growth */
  soilSubstrateHalfSatPerM2: estimated(1000, 'soil dissolved organic carbon scaled to area'),
  /** fraction of soil capacity at which litter decay reaches full rate */
  soilActivityReference: estimated(0.01, 'decomposer biomass needed for full litter decay'),
  /** fraction of soil capacity present in a freshly laid land substrate */
  initialSoilMicrobeFraction: estimated(0.01, 'microbes carried in bagged substrates'),
} as const;

/** Water microbes: cells/L/day; land microbes: cells/m²/day. */
export const BACKGROUND_SEEDING: Readonly<Record<MicrobeId, Sourced>> = {
  heterotroph: estimated(1000, 'airborne and equipment-borne bacteria'),
  aob: estimated(
    1e5,
    'nitrifiers carried in on decor, equipment and air; calibrated to measured cycle timing',
    'hovanecPatent',
  ),
  nob: estimated(
    1e5,
    'nitrifiers carried in on decor, equipment and air; calibrated to measured cycle timing',
    'hovanecPatent',
  ),
  denitrifier: estimated(10, 'airborne facultative anaerobes'),
  soil_bacteria: estimated(1000, 'airborne bacteria settling on land'),
  saprotrophic_fungus: estimated(100, 'airborne fungal spores'),
};
