import { derived, estimated, measured } from './sourced';

/** Organic matter is tracked in COD; N and P are tracked as separate element masses. */
export const STOICHIOMETRY = {
  codPerDryBiomass: derived(1.42, 'cellFormula', 'C5H7O2N + 5 O2 → 5 CO2 + NH3 + 2 H2O: 160/113'),
  nPerBiomassCod: measured(0.08, 'asm1'),
  nPerInertCod: measured(0.06, 'asm1'),
  pPerBiomassCod: derived(
    0.0155,
    'cellFormula',
    'C60H87O23N12P: 31 g P per 2000 g theoretical O2 demand',
  ),
  inertFractionOfDecay: measured(0.08, 'asm1'),
  cellDryMassMg: measured(3e-10, 'bionumbers'),
  o2PerNByAob: derived(3.43, 'nitrificationStoichiometry', 'NH4+ → NO2−: 3 × 32 / (2 × 14)'),
  o2PerNByNob: derived(1.14, 'nitrificationStoichiometry', '4.57 total − 3.43 ammonia step'),
  /** mg CaCO3 alkalinity per mg N of one proton equivalent (NH4+ gained, NO2−/NO3− lost) */
  alkalinityPerNEquivalent: measured(3.57, 'nitrificationStoichiometry'),
  caco3PerDkh: derived(17.86, 'carbonateEquilibrium', '1 dKH = 10 mg CaO/L = 17.86 mg CaCO3/L'),
  respiratoryQuotient: estimated(
    1.0,
    'mol CO2 released per mol O2 consumed for mixed organic substrate',
  ),
} as const;

export const FOOD_COMPOSITION = {
  proteinFraction: estimated(0.45, 'typical crude protein of aquarium flake food'),
  nPerDryMass: derived(0.072, 'jonesFactor', '0.45 protein ÷ 6.25'),
  codPerDryMass: estimated(1.4, 'protein/lipid/carbohydrate mixture'),
  pPerDryMass: estimated(0.012, 'typical phosphorus content of fish feed'),
  /** d⁻¹, abiotic dissolution of uneaten food into dissolved COD, ammonium and phosphate */
  leachingPerDay: derived(1.87, 'feedLeaching', '7.5% dry matter lost in 60 min → −ln(0.925) × 24'),
} as const;

export const LITTER_COMPOSITION = {
  codPerDryMass: estimated(1.2, 'lignocellulose-rich leaf litter'),
  nPerDryMass: estimated(0.015, 'senesced leaf litter'),
  pPerDryMass: estimated(0.001, 'senesced leaf litter'),
} as const;

/** Converts area-based docs/09 densities to biomass. */
export const CAPACITY_CONVERSION = {
  /** g dry mass per g chlorophyll a */
  dryMassPerChlorophyll: estimated(100, 'C:Chl a ≈ 50 g/g with carbon ≈ 50% of dry mass'),
  /** g dry mass per m² at 100% cover (moss mats, macroalgae beds) */
  fullCoverDryGPerM2: estimated(300, 'dense moss mat or macroalgal bed'),
} as const;

export const PRODUCTION = {
  /** mg SiO2 deposited per mg diatom COD formed */
  silicaPerDiatomCod: estimated(0.14, 'docs/04 §5.3 0.2 g SiO2 per g dry mass ÷ 1.42 COD/dry mass'),
  /** pore volume fraction of terrarium substrate */
  soilPorosity: estimated(0.5, 'loose organic substrate'),
} as const;
