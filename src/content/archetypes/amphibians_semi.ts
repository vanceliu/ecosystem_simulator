import type { ArchetypeData } from '../archetype';
import { derived, estimated, measured } from '../sourced';
import type { ArchetypeGroups } from './groupTypes';

const AMPHIBIAN_DRY = 'wet mass × 0.2 (amphibian body water ≈ 80 %)';
const CRAB_DRY = 'wet mass × 0.3 (decapod body water ≈ 70 %)';
const FISH_DRY = 'wet mass × 0.25 (fish body water ≈ 75 %)';
const NH3_AS_N = 'Xenopus limit NH3 < 0.02 mg/L × 14/17 = 0.016 mg N/L';
const NO2_AS_N = 'NO2⁻ < 0.5 mg/L × 14/46 = 0.15 mg N/L';
const NO_SALINITY_DATA = 'freshwater species; no salinity tolerance data';
const NO_CRAB_N_DATA = 'semi-terrestrial decapod; no species toxicity data; mg N/L';

/** docs/02, docs/09: dart_frog_small, tree_frog, semi_aquatic_toad, aquatic_frog_dwarf, aquatic_frog_clawed, large_frog_ambush, large_frog_aquatic, newt, axolotl, vampire_crab, mangrove_crab, fiddler_crab, mudskipper */
export const AMPHIBIANS_SEMI: Readonly<
  Partial<Record<ArchetypeGroups['amphibians_semi'], ArchetypeData>>
> = {
  dart_frog_small: {
    kind: 'cohort',
    latinStem: 'Dendrobat',
    nounZh: '箭毒蛙',
    flags: ['needs_land', 'needs_water_to_breed'],
    massMg: {
      min: estimated(200, 'docs/09 lower bound 1 g wet (Mantella, small dendrobatids) × 0.2'),
      max: derived(1600, 'amphibians_semi_dendrobatesWiki', `8 g wet; ${AMPHIBIAN_DRY}`),
    },
    typicalLengthMm: derived(38, 'amphibians_semi_dendrobatesWiki', 'midpoint of 30–45 mm SVL'),
    tolerance: {
      temperatureC: {
        min: measured(16, 'amphibians_semi_joshsAzureus'),
        max: measured(27, 'amphibians_semi_joshsAzureus'),
      },
      ph: {
        min: estimated(5.5, 'leaf-litter substrate and water dish; no species data'),
        max: estimated(7.5, 'leaf-litter substrate and water dish; no species data'),
      },
      humidityMinPercent: measured(70, 'amphibians_semi_joshsAuratus'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(1460, 'amphibians_semi_dendrobatesWiki'),
        typLow: measured(3650, 'amphibians_semi_dendrobatesWiki'),
        typHigh: measured(3650, 'amphibians_semi_dendrobatesWiki'),
        max: measured(7300, 'amphibians_semi_joshsAzureus'),
      },
      gameCapDays: derived(7300, 'amphibians_semi_joshsAzureus', '20 yr captive maximum × 365'),
      maturityDays: {
        min: measured(300, 'amphibians_semi_joshsAzureus'),
        max: measured(730, 'amphibians_semi_dendrobatesWiki'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(2, 'docs/09 terrestrial clutches 2–30; D. tinctorius 5–10'),
          max: estimated(30, 'docs/09 terrestrial clutches 2–30; D. tinctorius 5–10'),
        },
        intervalDays: {
          min: estimated(14, 'docs/09 every 2–4 weeks'),
          max: estimated(28, 'docs/09 every 2–4 weeks'),
        },
      },
      aquaticStageDays: {
        min: derived(42, 'amphibians_semi_adwAuratus', 'six weeks × 7 d'),
        max: derived(84, 'amphibians_semi_adwTinctorius', '12 weeks × 7 d'),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(1, 'amphibians_semi_joshsAzureus'),
        max: measured(2, 'amphibians_semi_joshsAzureus'),
      },
      max: estimated(4, 'docs/09 4 per 38 L'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      landAreaM2: derived(
        0.13,
        'amphibians_semi_joshsAzureus',
        '10 gal (38 L) footprint 51 × 25 cm',
      ),
      adultsPerEnclosure: measured(2, 'amphibians_semi_joshsAzureus'),
    },
    diets: [
      { terrestrial_invertebrate: 0.6, flying_insect: 0.4 },
      { terrestrial_invertebrate: 0.9, flying_insect: 0.1 },
      { flying_insect: 0.7, terrestrial_invertebrate: 0.3 },
      { terrestrial_invertebrate: 0.7, flying_insect: 0.2, aquatic_invertebrate: 0.1 },
    ],
    preySizeRatio: { min: 0.00001, opt: 0.0003, max: 0.01 },
    defenses: [['toxin'], ['toxin', 'hiding'], ['hiding', 'camouflage'], ['toxin', 'mucus']],
    habitats: [
      ['leaf_litter', 'ground'],
      ['ground', 'arboreal'],
    ],
  },

  tree_frog: {
    kind: 'cohort',
    latinStem: 'Agalychn',
    nounZh: '樹蛙',
    flags: ['needs_land', 'needs_water_to_breed', 'escapes_open_lid'],
    massMg: {
      min: estimated(1200, `docs/09 6 g; ${AMPHIBIAN_DRY}`),
      max: estimated(3000, `docs/09 15 g; ${AMPHIBIAN_DRY}`),
    },
    typicalLengthMm: derived(
      64,
      'amphibians_semi_agalychnisWiki',
      'mean of male 51 mm and female 76 mm',
    ),
    tolerance: {
      temperatureC: {
        min: measured(20, 'amphibians_semi_petmdRedEye'),
        max: measured(27, 'amphibians_semi_petmdRedEye'),
      },
      ph: {
        min: estimated(5.5, 'rainforest pools; no species data'),
        max: estimated(7.5, 'rainforest pools; no species data'),
      },
      humidityMinPercent: measured(70, 'amphibians_semi_petmdRedEye'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(1095, 'docs/09 short 3 yr'),
        typLow: measured(1825, 'amphibians_semi_agalychnisWiki'),
        typHigh: measured(1825, 'amphibians_semi_joshsRedEye'),
        max: derived(
          3650,
          'amphibians_semi_petmdRedEye',
          'midpoint of 8–12 yr captive maximum × 365',
        ),
      },
      gameCapDays: estimated(3650, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(365, 'docs/09 1–2 yr'),
        max: estimated(730, 'docs/09 1–2 yr'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(11, 'docs/09 11–78 per clutch', 'amphibians_semi_agalychnisWiki'),
          max: estimated(78, 'docs/09 11–78 per clutch', 'amphibians_semi_agalychnisWiki'),
        },
        intervalDays: {
          min: estimated(14, 'several clutches per wet season'),
          max: estimated(60, 'several clutches per wet season'),
        },
      },
      aquaticStageDays: {
        min: derived(21, 'amphibians_semi_wcsFrogBlog', 'three weeks × 7 d'),
        max: estimated(90, 'a few months read as ≈ 3 months', 'amphibians_semi_wcsFrogBlog'),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(2, 'docs/09 2–4 per 126 L'),
        max: measured(4, 'amphibians_semi_joshsRedEye'),
      },
      max: measured(4, 'amphibians_semi_joshsRedEye'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      landAreaM2: derived(0.21, 'amphibians_semi_joshsRedEye', '18 × 18 in footprint'),
      heightCm: derived(61, 'amphibians_semi_joshsRedEye', '24 in height'),
      adultsPerEnclosure: measured(4, 'amphibians_semi_joshsRedEye'),
    },
    diets: [
      { flying_insect: 0.5, terrestrial_invertebrate: 0.5 },
      { flying_insect: 0.8, terrestrial_invertebrate: 0.2 },
      { terrestrial_invertebrate: 0.8, flying_insect: 0.2 },
      { flying_insect: 0.5, terrestrial_invertebrate: 0.4, amphibian: 0.1 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.02, max: 0.2 },
    defenses: [['camouflage'], ['camouflage', 'hiding'], ['toxin'], ['mucus', 'camouflage']],
    habitats: [['arboreal'], ['arboreal', 'shore']],
  },

  semi_aquatic_toad: {
    kind: 'cohort',
    latinStem: 'Bombin',
    nounZh: '鈴蟾',
    flags: ['needs_land', 'needs_water_to_breed', 'escapes_open_lid'],
    massMg: {
      min: estimated(1000, `≈ 5 g small adult; ${AMPHIBIAN_DRY}`),
      max: estimated(2400, `docs/09 ≈ 10–12 g; ${AMPHIBIAN_DRY}`),
    },
    typicalLengthMm: derived(45, 'amphibians_semi_bombinaWiki', 'midpoint of 38–51 mm'),
    tolerance: {
      temperatureC: {
        min: measured(16, 'amphibians_semi_joshsBombina'),
        max: estimated(28, 'hobby care sheets: ceiling ≈ 78–82 °F'),
      },
      salinityPpt: {
        min: estimated(0, NO_SALINITY_DATA),
        max: estimated(2, NO_SALINITY_DATA),
      },
      ph: {
        min: estimated(6, 'ponds and slow streams; no species data'),
        max: estimated(8, 'ponds and slow streams; no species data'),
      },
      nh3MaxMgL: derived(
        0.016,
        'amphibians_semi_rutgersXenopus',
        `${NH3_AS_N}; Xenopus NH3 limit applied to aquatic anurans`,
      ),
      no2MaxMgL: derived(0.15, 'amphibians_semi_rutgersXenopus', NO2_AS_N),
      o2MinMgL: estimated(3, 'adults breathe air; larvae need oxygenated water'),
      humidityMinPercent: measured(50, 'amphibians_semi_joshsBombina'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(2555, 'amphibians_semi_joshsBombina'),
        typLow: measured(4380, 'amphibians_semi_bombinaWiki'),
        typHigh: measured(4380, 'amphibians_semi_bombinaWiki'),
        max: estimated(7300, 'docs/09 20+ yr; up to 30 yr reported', 'amphibians_semi_bombinaWiki'),
      },
      gameCapDays: estimated(7300, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(365, 'docs/09 1–2 yr'),
        max: estimated(730, 'docs/09 1–2 yr'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(40, 'amphibians_semi_bombinaWiki'),
          max: measured(110, 'amphibians_semi_bombinaWiki'),
        },
        intervalDays: {
          min: estimated(120, 'one or two clutches per breeding season'),
          max: estimated(365, 'one or two clutches per breeding season'),
        },
      },
      aquaticStageDays: {
        min: derived(70, 'amphibians_semi_adwBombina', '10 weeks × 7 d'),
        max: derived(98, 'amphibians_semi_adwBombina', '14 weeks × 7 d'),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(3, 'docs/09 3–4 per 75 L'),
        max: estimated(4, 'docs/09 3–4 per 75 L'),
      },
      max: estimated(6, 'docs/09 6 per 75 L'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: derived(
        12,
        'amphibians_semi_joshsBombina',
        '50 % of 75 L tank footprint (0.23 m²) × 10 cm water',
      ),
      landAreaM2: derived(
        0.115,
        'amphibians_semi_joshsBombina',
        '50 % of 75 L tank footprint (0.23 m²)',
      ),
      adultsPerEnclosure: estimated(4, 'docs/09 3–4 per 75 L'),
    },
    diets: [
      { terrestrial_invertebrate: 0.7, flying_insect: 0.3 },
      { terrestrial_invertebrate: 0.5, aquatic_invertebrate: 0.3, mollusc: 0.2 },
      { terrestrial_invertebrate: 0.6, mollusc: 0.4 },
      { aquatic_invertebrate: 0.5, terrestrial_invertebrate: 0.3, flying_insect: 0.2 },
    ],
    preySizeRatio: { min: 0.0005, opt: 0.01, max: 0.1 },
    defenses: [['toxin'], ['toxin', 'mucus'], ['camouflage', 'hiding'], ['toxin', 'hiding']],
    habitats: [
      ['shore', 'surface'],
      ['shore', 'ground'],
    ],
  },

  aquatic_frog_dwarf: {
    kind: 'cohort',
    latinStem: 'Hymenochir',
    nounZh: '侏儒爪蟾',
    flags: ['air_breather', 'needs_water_to_breed'],
    massMg: {
      min: estimated(200, `≈ 1 g small adult; ${AMPHIBIAN_DRY}`),
      max: derived(
        1000,
        'amphibians_semi_hymenochirusWiki',
        `≤ 5 g ("a few grams"); ${AMPHIBIAN_DRY}`,
      ),
    },
    typicalLengthMm: derived(32, 'amphibians_semi_hymenochirusWiki', 'midpoint of 25–38 mm'),
    tolerance: {
      temperatureC: {
        min: measured(22, 'amphibians_semi_fishkeeperAdf'),
        max: estimated(28, 'hobby guides: tolerates up to ≈ 82 °F'),
      },
      salinityPpt: {
        min: estimated(0, NO_SALINITY_DATA),
        max: estimated(2, NO_SALINITY_DATA),
      },
      ph: {
        min: estimated(6.5, 'hobby guides 6.5–8.0'),
        max: measured(7.8, 'amphibians_semi_fishkeeperAdf'),
      },
      nh3MaxMgL: derived(
        0.016,
        'amphibians_semi_rutgersXenopus',
        `${NH3_AS_N}; pipid congener (Xenopus) NH3 limit`,
      ),
      no2MaxMgL: derived(0.15, 'amphibians_semi_rutgersXenopus', NO2_AS_N),
      o2MinMgL: estimated(2, 'lungs only; surfaces to breathe', 'amphibians_semi_hymenochirusWiki'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(1825, 'amphibians_semi_hymenochirusWiki'),
        typLow: estimated(2555, 'docs/09 typical 7 yr'),
        typHigh: estimated(2555, 'docs/09 typical 7 yr'),
        max: estimated(
          4380,
          'docs/09 12 yr; > 20 yr outliers reported',
          'amphibians_semi_hymenochirusWiki',
        ),
      },
      gameCapDays: estimated(4380, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(270, 'docs/09 ≈ 1 yr'),
        max: estimated(365, 'docs/09 ≈ 1 yr'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(50, 'eggs scattered singly at the surface; no clutch data'),
          max: estimated(500, 'eggs scattered singly at the surface; no clutch data'),
        },
        intervalDays: {
          min: estimated(30, 'repeated spawning in warm water; no data'),
          max: estimated(90, 'repeated spawning in warm water; no data'),
        },
      },
      aquaticStageDays: {
        min: measured(26, 'amphibians_semi_pipidaeHymenochirus'),
        max: measured(36, 'amphibians_semi_pipidaeHymenochirus'),
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: {
        min: estimated(5, 'docs/09 2 per 38 L × 100/38'),
        max: estimated(8, 'docs/09 3 per 38 L × 100/38'),
      },
      max: estimated(13, 'docs/09 5 per 38 L × 100/38'),
      unit: 'individuals_per_100L',
    },
    minEnclosure: {
      waterVolumeL: estimated(19, 'docs/09; hobby guides 5 gal for 2–3 frogs'),
      adultsPerEnclosure: estimated(2, 'hobby guides 5 gal for 2–3 frogs'),
    },
    diets: [
      { aquatic_invertebrate: 0.6, zooplankton: 0.3, egg: 0.1 },
      { aquatic_invertebrate: 0.5, carrion: 0.3, detritus: 0.2 },
      { zooplankton: 0.6, aquatic_invertebrate: 0.4 },
      { aquatic_invertebrate: 0.5, food: 0.3, egg: 0.2 },
    ],
    preySizeRatio: { min: 0.0001, opt: 0.005, max: 0.05 },
    defenses: [['hiding'], ['camouflage'], ['mucus', 'hiding'], ['camouflage', 'hiding']],
    habitats: [
      ['benthic', 'surface'],
      ['benthic', 'crevice'],
    ],
  },

  aquatic_frog_clawed: {
    kind: 'cohort',
    latinStem: 'Xenop',
    nounZh: '爪蟾',
    flags: ['air_breather', 'needs_water_to_breed'],
    massMg: {
      min: estimated(12000, `docs/09 60 g; ${AMPHIBIAN_DRY}`),
      max: estimated(40000, `docs/09 200 g; ${AMPHIBIAN_DRY}`),
    },
    typicalLengthMm: estimated(100, 'docs/09 6–13 cm'),
    tolerance: {
      temperatureC: {
        min: measured(17, 'amphibians_semi_rutgersXenopus'),
        max: measured(24, 'amphibians_semi_rutgersXenopus'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater ponds'),
        max: estimated(
          8,
          'X. laevis survives brackish water by urea accumulation; no husbandry data',
        ),
      },
      ph: {
        min: measured(6.5, 'amphibians_semi_rutgersXenopus'),
        max: measured(8.5, 'amphibians_semi_rutgersXenopus'),
      },
      nh3MaxMgL: derived(0.016, 'amphibians_semi_rutgersXenopus', NH3_AS_N),
      no2MaxMgL: derived(0.15, 'amphibians_semi_rutgersXenopus', NO2_AS_N),
      o2MinMgL: estimated(2, 'lung breather; surfaces for air'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(5475, 'docs/09 15 yr'),
        typLow: estimated(7300, 'docs/09 20 yr'),
        typHigh: estimated(7300, 'docs/09 20 yr'),
        max: estimated(10950, 'docs/09 30 yr'),
      },
      gameCapDays: estimated(10950, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(240, 'docs/09 8–12 months'),
        max: estimated(365, 'docs/09 8–12 months'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(300, 'docs/09 hundreds to thousands'),
          max: estimated(3000, 'docs/09 hundreds to thousands'),
        },
        intervalDays: {
          min: estimated(90, 'females recover 3–6 months between spawnings'),
          max: estimated(180, 'females recover 3–6 months between spawnings'),
        },
      },
      aquaticStageDays: {
        min: derived(28, 'amphibians_semi_kossXenopus', '≈ 4 weeks × 7 d at 20 °C'),
        max: derived(90, 'amphibians_semi_kossXenopus', '3 months × 30 d'),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(2, 'docs/09 2 per 75 L'),
        max: estimated(2, 'docs/09 2 per 75 L'),
      },
      max: estimated(4, 'docs/09 4 per 75 L'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: estimated(
        75,
        'docs/09 75 L per 2; lab minimum ≥ 2 L per frog',
        'amphibians_semi_rutgersXenopus',
      ),
      adultsPerEnclosure: estimated(2, 'docs/09 75 L per 2'),
    },
    diets: [
      { aquatic_invertebrate: 0.6, fish: 0.2, carrion: 0.2 },
      { fish: 0.4, amphibian: 0.3, aquatic_invertebrate: 0.3 },
      { aquatic_invertebrate: 0.5, zooplankton: 0.3, detritus: 0.2 },
      { aquatic_invertebrate: 0.4, food: 0.3, egg: 0.3 },
    ],
    preySizeRatio: { min: 0.0005, opt: 0.01, max: 0.3 },
    defenses: [['mucus'], ['mucus', 'hiding'], ['size'], ['toxin', 'mucus']],
    habitats: [['benthic'], ['benthic', 'crevice']],
  },

  large_frog_ambush: {
    kind: 'cohort',
    latinStem: 'Ceratophr',
    nounZh: '角蛙',
    flags: ['needs_land', 'needs_water_to_breed', 'cannibal'],
    massMg: {
      min: estimated(40000, `docs/09 200 g; ${AMPHIBIAN_DRY}`),
      max: estimated(100000, `docs/09 500 g; ${AMPHIBIAN_DRY}`),
    },
    typicalLengthMm: derived(125, 'amphibians_semi_dubiaPacman', 'midpoint of 4–6 in'),
    tolerance: {
      temperatureC: {
        min: measured(18, 'amphibians_semi_dubiaPacman'),
        max: measured(29, 'amphibians_semi_dubiaPacman'),
      },
      ph: {
        min: estimated(6, 'damp substrate and water dish; no species data'),
        max: estimated(8, 'damp substrate and water dish; no species data'),
      },
      humidityMinPercent: measured(60, 'amphibians_semi_dubiaPacman'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(1825, 'docs/09 5 yr'),
        typLow: measured(2190, 'amphibians_semi_ceratophrysWiki'),
        typHigh: measured(2555, 'amphibians_semi_ceratophrysWiki'),
        max: estimated(5475, 'docs/09 15 yr; captive > 10 yr', 'amphibians_semi_ceratophrysWiki'),
      },
      gameCapDays: estimated(5475, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(300, 'docs/09 ≈ 1 yr'),
        max: estimated(450, 'docs/09 ≈ 1 yr'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(1000, 'docs/09 1,000+'),
          max: measured(2000, 'amphibians_semi_ceratophrysWiki'),
        },
        intervalDays: {
          min: estimated(180, 'breeds once per rainy season'),
          max: estimated(365, 'breeds once per rainy season'),
        },
      },
      aquaticStageDays: {
        min: estimated(18, 'three weeks, minus rearing variation', 'amphibians_semi_fabrezi2020'),
        max: estimated(28, 'three weeks, plus rearing variation', 'amphibians_semi_fabrezi2020'),
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: {
        min: measured(1, 'amphibians_semi_dubiaPacman'),
        max: measured(1, 'amphibians_semi_dubiaPacman'),
      },
      max: measured(1, 'amphibians_semi_dubiaPacman'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      landAreaM2: estimated(0.13, 'docs/09 40 L tank, footprint ≈ 51 × 25 cm'),
      adultsPerEnclosure: measured(1, 'amphibians_semi_dubiaPacman'),
    },
    diets: [
      { terrestrial_invertebrate: 0.6, amphibian: 0.3, fish: 0.1 },
      { amphibian: 0.5, terrestrial_invertebrate: 0.3, reptile: 0.2 },
      { terrestrial_invertebrate: 0.8, flying_insect: 0.2 },
      { terrestrial_invertebrate: 0.4, fish: 0.3, amphibian: 0.3 },
    ],
    preySizeRatio: { min: 0.005, opt: 0.1, max: 1 },
    defenses: [['camouflage'], ['burrowing', 'camouflage'], ['size'], ['hiding', 'burrowing']],
    habitats: [
      ['ground', 'leaf_litter'],
      ['soil', 'ground'],
    ],
  },

  large_frog_aquatic: {
    kind: 'cohort',
    latinStem: 'Lithobat',
    nounZh: '牛蛙',
    flags: ['needs_land', 'needs_water_to_breed', 'cannibal'],
    massMg: {
      min: estimated(90000, `docs/09 450 g; ${AMPHIBIAN_DRY}`),
      max: derived(181000, 'amphibians_semi_ncBullfrog', `2 lb (907 g); ${AMPHIBIAN_DRY}`),
    },
    typicalLengthMm: derived(178, 'amphibians_semi_ncBullfrog', 'midpoint of 6–8 in'),
    tolerance: {
      temperatureC: {
        min: estimated(5, 'overwinters in water near freezing', 'amphibians_semi_ncBullfrog'),
        max: estimated(33, 'eurythermal; higher thermal maximum than most frogs'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater ponds and lakes'),
        max: estimated(
          5,
          'occurs on coastal barrier islands; no tolerance data',
          'amphibians_semi_ncBullfrog',
        ),
      },
      ph: {
        min: estimated(5.5, 'ponds and lakes; no species data'),
        max: estimated(8.5, 'ponds and lakes; no species data'),
      },
      nh3MaxMgL: derived(
        0.016,
        'amphibians_semi_rutgersXenopus',
        `${NH3_AS_N}; Xenopus NH3 limit applied to aquatic anurans`,
      ),
      no2MaxMgL: derived(0.15, 'amphibians_semi_rutgersXenopus', NO2_AS_N),
      o2MinMgL: estimated(2, 'adults breathe air; tadpoles need oxygenated water'),
      humidityMinPercent: estimated(60, 'adults stay at the water edge; no data'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(2555, 'amphibians_semi_ncBullfrog'),
        typLow: derived(3285, 'amphibians_semi_ncBullfrog', 'midpoint of 7–10 yr × 365'),
        typHigh: derived(3285, 'amphibians_semi_ncBullfrog', 'midpoint of 7–10 yr × 365'),
        max: estimated(5840, 'docs/09 16 yr'),
      },
      gameCapDays: estimated(5840, 'docs/09 game cap'),
      maturityDays: {
        min: derived(730, 'amphibians_semi_ncBullfrog', 'adult size reached in 2–3 yr'),
        max: derived(1095, 'amphibians_semi_ncBullfrog', 'adult size reached in 2–3 yr'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(6000, 'docs/09 6,000–20,000'),
          max: measured(12000, 'amphibians_semi_ncBullfrog'),
        },
        intervalDays: {
          min: derived(
            50,
            'amphibians_semi_ncBullfrog',
            '≤ 3 clutches in the April–August season ≈ 150 d / 3',
          ),
          max: estimated(365, 'single clutch per year'),
        },
      },
      aquaticStageDays: {
        min: estimated(90, 'warm southern waters: a few months', 'amphibians_semi_gisdBullfrog'),
        max: derived(1095, 'amphibians_semi_gisdBullfrog', 'three years × 365 d'),
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 1 per 400 L'),
        max: estimated(1, 'docs/09 1 per 400 L'),
      },
      max: estimated(1, 'docs/09 1 per 400 L'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: estimated(400, 'docs/09 400 L water'),
      adultsPerEnclosure: estimated(1, 'docs/09 1 per 400 L'),
    },
    diets: [
      { terrestrial_invertebrate: 0.4, crustacean: 0.3, fish: 0.3 },
      { amphibian: 0.4, fish: 0.3, reptile: 0.3 },
      { terrestrial_invertebrate: 0.4, flying_insect: 0.3, aquatic_invertebrate: 0.3 },
      { crustacean: 0.4, amphibian: 0.3, fish: 0.3 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.05, max: 0.5 },
    defenses: [['size'], ['camouflage'], ['size', 'camouflage'], ['mucus', 'size']],
    habitats: [
      ['shore', 'surface'],
      ['shore', 'benthic'],
    ],
  },

  newt: {
    kind: 'cohort',
    latinStem: 'Cynop',
    nounZh: '蠑螈',
    flags: ['needs_water_to_breed'],
    massMg: {
      min: estimated(600, `docs/09 3 g; ${AMPHIBIAN_DRY}`),
      max: estimated(1200, `docs/09 6 g; ${AMPHIBIAN_DRY}`),
    },
    typicalLengthMm: derived(82, 'amphibians_semi_caudataCynops', 'midpoint of 60–103 mm'),
    tolerance: {
      temperatureC: {
        min: estimated(8, 'cool-water caudate; wild winter water below housing range'),
        max: estimated(
          24,
          'docs/02 ≤ 24 °C; keepers avoid > 23 °C',
          'amphibians_semi_caudataCynops',
        ),
      },
      salinityPpt: {
        min: estimated(0, NO_SALINITY_DATA),
        max: estimated(2, NO_SALINITY_DATA),
      },
      ph: {
        min: estimated(6.5, 'ponds and paddy fields; no species data'),
        max: estimated(8, 'ponds and paddy fields; no species data'),
      },
      nh3MaxMgL: derived(
        0.016,
        'amphibians_semi_rutgersXenopus',
        `${NH3_AS_N}; Xenopus NH3 limit applied to aquatic caudates`,
      ),
      no2MaxMgL: derived(0.15, 'amphibians_semi_rutgersXenopus', NO2_AS_N),
      o2MinMgL: estimated(3, 'adults breathe air; gilled larvae need oxygenated water'),
      humidityMinPercent: estimated(70, 'highly aquatic adults use small land areas; no data'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(3650, 'docs/09 10 yr'),
        typLow: estimated(4380, 'docs/09 12 yr'),
        typHigh: estimated(5475, 'docs/09 15 yr'),
        max: estimated(10950, 'docs/09 30 yr'),
      },
      gameCapDays: estimated(10950, 'docs/09 game cap'),
      maturityDays: {
        min: measured(365, 'amphibians_semi_caudataCynops'),
        max: measured(1095, 'amphibians_semi_caudataCynops'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(10, 'amphibians_semi_caudataCynops'),
          max: measured(236, 'amphibians_semi_caudataCynops'),
        },
        intervalDays: {
          min: estimated(180, 'one breeding season per year'),
          max: estimated(365, 'one breeding season per year'),
        },
      },
      aquaticStageDays: {
        min: measured(50, 'amphibians_semi_caudataCynopsLarva'),
        max: derived(150, 'amphibians_semi_adwNotophthalmus', 'five months × 30 d'),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(2, 'docs/09 2–6 per 75 L'),
        max: estimated(6, 'docs/09 2–6 per 75 L'),
      },
      max: estimated(6, 'docs/09 6 per 75 L'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: estimated(53, 'docs/09 75 L with 70 % water'),
      landAreaM2: estimated(0.07, 'docs/09 30 % of 75 L tank footprint (0.23 m²)'),
      adultsPerEnclosure: estimated(6, 'docs/09 6 per 75 L'),
    },
    diets: [
      { aquatic_invertebrate: 0.7, zooplankton: 0.3 },
      { aquatic_invertebrate: 0.5, amphibian: 0.3, egg: 0.2 },
      { aquatic_invertebrate: 0.6, fish: 0.2, egg: 0.2 },
      { aquatic_invertebrate: 0.5, terrestrial_invertebrate: 0.3, carrion: 0.2 },
    ],
    preySizeRatio: { min: 0.0005, opt: 0.01, max: 0.1 },
    defenses: [['toxin'], ['toxin', 'camouflage'], ['hiding'], ['mucus', 'toxin']],
    habitats: [
      ['benthic', 'shore'],
      ['benthic', 'crevice'],
    ],
  },

  axolotl: {
    kind: 'cohort',
    latinStem: 'Ambystom',
    nounZh: '鈍口螈',
    flags: ['cannibal', 'needs_water_to_breed'],
    massMg: {
      min: estimated(12000, `docs/09 60 g; ${AMPHIBIAN_DRY}`),
      max: estimated(40000, `docs/09 200 g; ${AMPHIBIAN_DRY}`),
    },
    typicalLengthMm: derived(240, 'amphibians_semi_caudataAxolotl', 'midpoint of 20–28 cm'),
    tolerance: {
      temperatureC: {
        min: measured(6, 'amphibians_semi_caudataAxolotl'),
        max: derived(24, 'amphibians_semi_caudataAxolotl', '> 25 °C unsuitable beyond a few days'),
      },
      salinityPpt: {
        min: estimated(0, 'Lake Xochimilco fresh water'),
        max: estimated(4, "full-strength Holtfreter's solution ≈ 3.5 g/L salts is tolerated"),
      },
      ph: {
        min: measured(6.5, 'amphibians_semi_vinAxolotl'),
        max: measured(8, 'amphibians_semi_vinAxolotl'),
      },
      nh3MaxMgL: derived(
        0.016,
        'amphibians_semi_rutgersXenopus',
        `${NH3_AS_N}; Xenopus NH3 limit applied to aquatic caudates`,
      ),
      no2MaxMgL: derived(0.15, 'amphibians_semi_rutgersXenopus', NO2_AS_N),
      o2MinMgL: estimated(4, 'external gills with occasional air gulping'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(3650, 'docs/09 10 yr'),
        typLow: estimated(4380, 'docs/09 12 yr'),
        typHigh: estimated(5475, 'docs/09 15 yr'),
        max: estimated(7300, 'docs/09 20+ yr'),
      },
      gameCapDays: estimated(7300, 'docs/09 game cap'),
      maturityDays: {
        min: measured(180, 'amphibians_semi_caudataAxolotl'),
        max: derived(548, 'amphibians_semi_caudataAxolotl', 'females bred from ≥ 18 months'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(100, 'amphibians_semi_caudataAxolotl'),
          max: measured(1000, 'amphibians_semi_caudataAxolotl'),
        },
        intervalDays: {
          min: estimated(90, 'captive females spawn several times a year'),
          max: estimated(180, 'captive females spawn several times a year'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 1 per 90 L'),
        max: estimated(1, 'docs/09 1 per 90 L'),
      },
      max: estimated(1, 'docs/09 1 per 90 L'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: estimated(90, 'docs/09 90 L', 'amphibians_semi_caudataAxolotl'),
      lengthCm: estimated(80, 'docs/09 80 cm'),
      adultsPerEnclosure: estimated(1, 'docs/09 1 per 90 L'),
    },
    diets: [
      { aquatic_invertebrate: 0.7, fish: 0.2, crustacean: 0.1 },
      { aquatic_invertebrate: 0.4, fish: 0.4, amphibian: 0.2 },
      { aquatic_invertebrate: 0.5, crustacean: 0.3, carrion: 0.2 },
      { aquatic_invertebrate: 0.6, food: 0.3, egg: 0.1 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.03, max: 0.3 },
    defenses: [['hiding'], ['camouflage'], ['size'], ['hiding', 'camouflage']],
    habitats: [['benthic'], ['benthic', 'crevice']],
  },

  vampire_crab: {
    kind: 'cohort',
    latinStem: 'Geosesarm',
    nounZh: '吸血鬼蟹',
    flags: ['needs_land', 'escapes_open_lid'],
    massMg: {
      min: estimated(600, `≈ 2 g at 1.5 cm carapace; ${CRAB_DRY}`),
      max: estimated(2400, `≈ 8 g at 3.8 cm carapace; ${CRAB_DRY}`),
    },
    typicalLengthMm: derived(
      20,
      'amphibians_semi_aquariumBreederVampire',
      'midpoint of 15–25 mm carapace',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(22, 'hobby guides 22–28 °C'),
        max: measured(28, 'amphibians_semi_aquariumBreederVampire'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater creek valleys'),
        max: estimated(1, 'freshwater sesarmid; no tolerance data'),
      },
      ph: {
        min: measured(7, 'amphibians_semi_aquariumBreederVampire'),
        max: measured(8.5, 'amphibians_semi_aquariumBreederVampire'),
      },
      nh3MaxMgL: estimated(0.1, NO_CRAB_N_DATA),
      no2MaxMgL: estimated(0.5, NO_CRAB_N_DATA),
      o2MinMgL: estimated(3, 'gill breather that spends most time on land'),
      humidityMinPercent: measured(75, 'amphibians_semi_aquariumBreederVampire'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(548, 'docs/09 1.5 yr'),
        typLow: estimated(730, 'docs/09 2–3 yr; hobby sources 2–2.5 yr'),
        typHigh: estimated(1095, 'docs/09 2–3 yr; hobby sources 2–2.5 yr'),
        max: estimated(1280, 'docs/09 3+ yr'),
      },
      gameCapDays: estimated(1280, 'docs/09 game cap'),
      maturityDays: {
        min: measured(180, 'amphibians_semi_geosesarmaWiki'),
        max: estimated(240, 'maturity ≈ 6 months; slower when cool'),
      },
      reproduction: {
        mode: 'brood',
        clutch: {
          min: measured(20, 'amphibians_semi_geosesarmaWiki'),
          max: measured(80, 'amphibians_semi_geosesarmaWiki'),
        },
        intervalDays: {
          min: derived(30, 'amphibians_semi_geosesarmaWiki', 'eggs carried ≈ 1 month'),
          max: estimated(60, 'brooding month plus recovery molt'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(4, 'docs/09 4–6 per 30 L'),
        max: estimated(6, 'docs/09 4–6 per 30 L'),
      },
      max: estimated(8, 'docs/09 8 per 30 L'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      landAreaM2: estimated(0.08, 'docs/09 70 % of 30 L tank footprint (0.11 m²)'),
      waterVolumeL: estimated(3, 'docs/09 30 % of 30 L tank footprint × ≈ 10 cm water'),
      adultsPerEnclosure: estimated(6, 'docs/09 4–6 per 30 L'),
    },
    diets: [
      { detritus: 0.5, plant: 0.2, terrestrial_invertebrate: 0.3 },
      { detritus: 0.4, crustacean: 0.3, amphibian: 0.3 },
      { litter: 0.4, detritus: 0.3, fruit: 0.3 },
      { terrestrial_invertebrate: 0.4, flying_insect: 0.2, detritus: 0.4 },
    ],
    preySizeRatio: { min: 0.005, opt: 0.05, max: 0.3 },
    defenses: [
      ['armor', 'hiding'],
      ['burrowing'],
      ['armor', 'burrowing'],
      ['hiding', 'camouflage'],
    ],
    habitats: [
      ['ground', 'shore'],
      ['burrow', 'crevice'],
    ],
  },

  mangrove_crab: {
    kind: 'cohort',
    latinStem: 'Perisesarm',
    nounZh: '紅螯蟹',
    flags: ['needs_land', 'territorial', 'escapes_open_lid'],
    massMg: {
      min: estimated(3000, `≈ 10 g adult; ${CRAB_DRY}`),
      max: estimated(9000, `≈ 30 g large male; ${CRAB_DRY}`),
    },
    typicalLengthMm: estimated(40, 'typical carapace; ≤ 51 mm', 'amphibians_semi_perisesarmaWiki'),
    tolerance: {
      temperatureC: {
        min: measured(21, 'amphibians_semi_ftaRedClaw'),
        max: measured(31, 'amphibians_semi_ftaRedClaw'),
      },
      salinityPpt: {
        min: estimated(2, 'survives fresh water with shortened life; hobby guides'),
        max: estimated(14, 'hobby guides SG 1.005–1.010 ≈ 7–13 ppt'),
      },
      ph: {
        min: measured(7.5, 'amphibians_semi_ftaRedClaw'),
        max: measured(8.5, 'amphibians_semi_ftaRedClaw'),
      },
      nh3MaxMgL: estimated(0.1, NO_CRAB_N_DATA),
      no2MaxMgL: estimated(0.5, NO_CRAB_N_DATA),
      o2MinMgL: estimated(3, 'gill breather that leaves hypoxic water'),
      humidityMinPercent: estimated(70, 'hobby guides 70–85 %'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(730, 'docs/09 2 yr'),
        typLow: measured(730, 'amphibians_semi_ftaRedClaw'),
        typHigh: derived(913, 'amphibians_semi_ftaRedClaw', '2.5 yr × 365'),
        max: estimated(1460, 'docs/09 4 yr'),
      },
      gameCapDays: estimated(1460, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(270, 'docs/09 ≈ 1 yr'),
        max: estimated(365, 'docs/09 ≈ 1 yr'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(1000, 'sesarmid females carry thousands of eggs; no species data'),
          max: estimated(5000, 'sesarmid females carry thousands of eggs; no species data'),
        },
        intervalDays: {
          min: estimated(30, 'repeated broods in the warm season; no data'),
          max: estimated(90, 'repeated broods in the warm season; no data'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 one male per tank'),
        max: derived(3, 'amphibians_semi_ftaRedClaw', '1 male + 2 females per 38 L'),
      },
      max: derived(4, 'amphibians_semi_ftaRedClaw', '1 male + 3 females per 38 L'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: estimated(6, 'docs/09 45 % of 38 L tank footprint (0.13 m²) × 10 cm water'),
      landAreaM2: estimated(0.07, 'docs/09 55 % of 38 L tank footprint (0.13 m²)'),
      adultsPerEnclosure: derived(3, 'amphibians_semi_ftaRedClaw', '1 male + 2 females per 38 L'),
    },
    diets: [
      { detritus: 0.4, litter: 0.3, plant: 0.3 },
      { detritus: 0.3, aquatic_invertebrate: 0.3, carrion: 0.4 },
      { fruit: 0.3, litter: 0.3, detritus: 0.4 },
      { crustacean: 0.3, carrion: 0.3, detritus: 0.4 },
    ],
    preySizeRatio: { min: 0.005, opt: 0.05, max: 0.3 },
    defenses: [['armor'], ['armor', 'burrowing'], ['hiding'], ['armor', 'autotomy']],
    habitats: [
      ['shore', 'crevice'],
      ['shore', 'arboreal'],
    ],
  },

  fiddler_crab: {
    kind: 'cohort',
    latinStem: 'Gelasim',
    nounZh: '招潮蟹',
    flags: ['needs_land'],
    massMg: {
      min: estimated(900, `≈ 3 g adult; ${CRAB_DRY}`),
      max: estimated(4500, `≈ 15 g large male; ${CRAB_DRY}`),
    },
    typicalLengthMm: derived(
      35,
      'amphibians_semi_pfkFiddler',
      'midpoint of 30–40 mm carapace width',
    ),
    tolerance: {
      temperatureC: {
        min: measured(22, 'amphibians_semi_fariaUca2017'),
        max: measured(36, 'amphibians_semi_fariaUca2017'),
      },
      salinityPpt: {
        min: derived(
          5,
          'amphibians_semi_fariaUca2017',
          'lowest mean habitat salinity among Brazilian Uca',
        ),
        max: derived(
          20,
          'amphibians_semi_fariaUca2017',
          'highest mean habitat salinity among Brazilian Uca',
        ),
      },
      ph: {
        min: estimated(7.5, 'estuarine mudflat water; no species data'),
        max: estimated(8.5, 'estuarine mudflat water; no species data'),
      },
      nh3MaxMgL: estimated(0.1, NO_CRAB_N_DATA),
      no2MaxMgL: estimated(0.5, NO_CRAB_N_DATA),
      o2MinMgL: estimated(3, 'air-breathing intertidal crab; no data'),
      humidityMinPercent: estimated(70, 'needs damp sand to wet its gills; no data'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(730, 'docs/09 2 yr'),
        typLow: estimated(730, 'docs/09 2–3 yr'),
        typHigh: estimated(1095, 'docs/09 2–3 yr'),
        max: estimated(1825, 'docs/09 game cap; 10 yr reports doubtful'),
      },
      gameCapDays: estimated(1825, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(270, 'docs/09 ≈ 1 yr'),
        max: estimated(365, 'docs/09 ≈ 1 yr'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(3000, 'ocypodid broods of thousands of eggs; no species data'),
          max: estimated(20000, 'ocypodid broods of thousands of eggs; no species data'),
        },
        intervalDays: {
          min: estimated(30, 'semilunar spawning cycles'),
          max: estimated(90, 'semilunar spawning cycles'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: {
        min: estimated(3, 'docs/09 3–4 per 38 L'),
        max: estimated(4, 'docs/09 3–4 per 38 L'),
      },
      max: estimated(5, 'docs/09 5 per 38 L'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      landAreaM2: derived(
        0.09,
        'amphibians_semi_pfkFiddler',
        'land:water 2:1 of 38 L tank footprint (0.13 m²)',
      ),
      waterVolumeL: derived(
        2,
        'amphibians_semi_pfkFiddler',
        '1/3 of 0.13 m² footprint × 5 cm water',
      ),
      adultsPerEnclosure: estimated(4, 'docs/09 3–4 per 38 L'),
    },
    diets: [
      { detritus: 0.6, biofilm: 0.4 },
      { detritus: 0.4, periphyton: 0.4, bacteria: 0.2 },
      { detritus: 0.5, biofilm: 0.3, litter: 0.2 },
      { biofilm: 0.6, periphyton: 0.2, detritus: 0.2 },
    ],
    defenses: [
      ['burrowing'],
      ['armor', 'burrowing'],
      ['autotomy', 'burrowing'],
      ['armor', 'hiding'],
    ],
    habitats: [
      ['shore', 'burrow'],
      ['burrow', 'ground'],
    ],
  },

  mudskipper: {
    kind: 'cohort',
    latinStem: 'Periophth',
    nounZh: '彈塗魚',
    flags: ['air_breather', 'territorial', 'needs_land', 'escapes_open_lid'],
    massMg: {
      min: estimated(5000, `docs/09 20 g; ${FISH_DRY}`),
      max: estimated(20000, `docs/09 80 g; ${FISH_DRY}`),
    },
    typicalLengthMm: estimated(
      120,
      'docs/09 10–20 cm; P. barbarus max 150 mm SL',
      'amphibians_semi_seriouslyFishMudskipper',
    ),
    tolerance: {
      temperatureC: {
        min: measured(25, 'amphibians_semi_seriouslyFishMudskipper'),
        max: measured(30, 'amphibians_semi_seriouslyFishMudskipper'),
      },
      salinityPpt: {
        min: estimated(0, 'Periophthalmus spp. enter river mouths; euryhaline'),
        max: estimated(35, 'Periophthalmus spp. occupy marine mudflats; euryhaline'),
      },
      ph: {
        min: measured(7, 'amphibians_semi_seriouslyFishMudskipper'),
        max: measured(8.5, 'amphibians_semi_seriouslyFishMudskipper'),
      },
      nh3MaxMgL: derived(
        0.75,
        'amphibians_semi_mudskipperAmmonia',
        '96-h NH3 LC50 536 µM (Periophthalmodon schlosseri, amphibious sister genus) × 14 g N/mol = 7.5 mg N/L, × 0.1',
      ),
      no2MaxMgL: estimated(1, 'euryhaline fish; no species data'),
      o2MinMgL: estimated(1, 'air breather; respires through skin and buccal cavity'),
      humidityMinPercent: estimated(
        80,
        'air above water must be very humid',
        'amphibians_semi_seriouslyFishMudskipper',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(730, 'docs/09 2 yr', 'amphibians_semi_tropicalTankMudskipper'),
        typLow: estimated(1825, 'docs/09 5 yr', 'amphibians_semi_tropicalTankMudskipper'),
        typHigh: estimated(1825, 'docs/09 5 yr', 'amphibians_semi_tropicalTankMudskipper'),
        max: estimated(2920, 'docs/09 8 yr', 'amphibians_semi_tropicalTankMudskipper'),
      },
      gameCapDays: estimated(2920, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(365, 'docs/09 mature at 10–11 cm; age not reported'),
        max: estimated(730, 'docs/09 mature at 10–11 cm; age not reported'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(1000, 'eggs attached inside burrow chamber; no clutch data'),
          max: estimated(10000, 'eggs attached inside burrow chamber; no clutch data'),
        },
        intervalDays: {
          min: estimated(30, 'repeated spawning in the wet season; no data'),
          max: estimated(90, 'repeated spawning in the wet season; no data'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: {
        min: measured(1, 'amphibians_semi_seriouslyFishMudskipper'),
        max: measured(1, 'amphibians_semi_seriouslyFishMudskipper'),
      },
      max: measured(1, 'amphibians_semi_seriouslyFishMudskipper'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(120, 'amphibians_semi_seriouslyFishMudskipper'),
      waterVolumeL: measured(110, 'amphibians_semi_seriouslyFishMudskipper'),
      landAreaM2: derived(
        0.18,
        'amphibians_semi_seriouslyFishMudskipper',
        '60 × 30 cm territory per fish',
      ),
      adultsPerEnclosure: measured(1, 'amphibians_semi_seriouslyFishMudskipper'),
    },
    diets: [
      { terrestrial_invertebrate: 0.4, crustacean: 0.4, flying_insect: 0.2 },
      { crustacean: 0.5, aquatic_invertebrate: 0.3, fish: 0.2 },
      { flying_insect: 0.5, terrestrial_invertebrate: 0.5 },
      { crustacean: 0.4, aquatic_invertebrate: 0.4, detritus: 0.2 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.02, max: 0.2 },
    defenses: [['burrowing'], ['hiding'], ['burrowing', 'camouflage'], ['hiding', 'camouflage']],
    habitats: [
      ['shore', 'burrow'],
      ['shore', 'surface'],
    ],
  },
};
