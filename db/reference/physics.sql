-- Reference data (docs/10 §2.1); edit values here.
INSERT INTO ref_source (id, title, url) VALUES ('iupacAtomicWeights', 'IUPAC CIAAW standard atomic weights', 'https://www.ciaaw.org/atomic-weights.htm');
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.lapseRateCPerM', 'number', 0.0065, NULL, 'measured', 'isa', NULL, NULL);
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.carbonicPk1', 'number', 6.35, NULL, 'measured', 'carbonateEquilibrium', NULL, NULL);
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.hco3MmolPerDkh', 'number', 0.357, NULL, 'measured', 'carbonateEquilibrium', NULL, NULL);
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.co2MgPerMmol', 'number', 44.01, NULL, 'derived', 'iupacAtomicWeights', 'C 12.011 + 2 × O 15.999', NULL);
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.co2EquilibriumMgL', 'number', 0.5, NULL, 'estimated', NULL, NULL, 'air-equilibrium dissolved CO2 near 25 °C');
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.ppfdPerWatt', 'number', 2.1, NULL, 'derived', 'parConversion', 'PAR fraction 0.46 × 4.57 µmol/J', NULL);
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.co2PerO2', 'number', 1.375, NULL, 'derived', 'iupacAtomicWeights', 'CO2 44 ÷ O2 32 g/mol', NULL);
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.alkalinityPerCa', 'number', 2.4972554890219563, NULL, 'derived', 'iupacAtomicWeights', 'CaCO3 100.09 ÷ Ca 40.08 g/mol', NULL);
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.denitrificationCodPerN', 'number', 2.86, NULL, 'derived', 'asm1', '5 electrons per N reduced to N2 × 8 g O2 per electron mole ÷ 14 g N', NULL);
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.tidePeriodH', 'number', 12.42, NULL, 'estimated', NULL, NULL, 'principal lunar semidiurnal (M2) tide period');
INSERT INTO ref_param (id, kind, num, txt, basis, source_id, derivation, note) VALUES ('physics.seaSaltReferencePpt', 'number', 35, NULL, 'estimated', NULL, NULL, 'standard seawater salinity');
