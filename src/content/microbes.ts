import { derived, estimated, measured, type Sourced } from './sourced';

export type MicrobeId =
  'heterotroph' | 'aob' | 'nob' | 'denitrifier' | 'soil_bacteria' | 'saprotrophic_fungus';

export const TEMPERATURE_THETA = estimated(1.072, 'Arrhenius θ equivalent to Q10 = 2');

export const MICROBIAL_PROCESSES = {
  /** d⁻¹, ASM1 hydrolysis of slowly biodegradable particulate COD */
  hydrolysisRate: derived(4.25, 'bsm1', 'ASM1/BSM1 kh 3.0 d⁻¹ at ≈ 15 °C × 1.072^5'),
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
  /** mg COD per g of land substrate */
  soilMicrobeCodPerG: derived(
    1.82,
    'land_soil_xu2013',
    'global surface soil Cmic 56.7 mmol C/kg × 12 mg C/mmol × 2.67 COD/C ÷ 1000',
  ),
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
