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
  alkalinityPerNNitrified: measured(7.14, 'nitrificationStoichiometry'),
  alkalinityPerNDenitrified: measured(3.57, 'nitrificationStoichiometry'),
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
