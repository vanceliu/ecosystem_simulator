import type { ArchetypeData } from '../archetype';
import { derived, estimated, measured } from '../sourced';
import type { ArchetypeGroups } from './groupTypes';

/** free NH3 (mg NH3-N/L) per mg TAN/L at pH 7, 20 °C: 1/(1+10^(9.40−7)) (Emerson 1975) */
const TAN_TO_NH3N =
  'TAN × 0.00394 = free NH3-N (free fraction at pH 7, 20 °C, Emerson 1975 pKa 9.40)';
/** acute LC50 → limit */
const ACUTE_FACTOR = '× 0.1 (acute LC50 → limit)';
const NH3_TO_N = '× 14/17 mg NH3 → mg NH3-N';
/** wet → dry mass: density 1 mg/mm³, dry = 0.2 × wet (AFDW 16% of wet ÷ 0.8 organic fraction) */
const WET_TO_DRY =
  'density 1 mg/mm³; dry = 0.2 × wet (AFDW ≈ 16% of wet ÷ ≈ 0.8 organic share of dry)';
const GROUP_SALINITY_SPAN =
  'group spans freshwater to fully marine species (docs/02 FBM); bounds set to the game salinity span';
const GAME_CAP = 'docs/09 §4 game cap = longest recorded lifespan';

/** docs/02, docs/09: rotifer, copepod, ostracod, cladoceran, amphipod, isopod, detritus_worm, nematode, bristle_worm, planarian, hydra */
export const AQUATIC_SMALL: Readonly<
  Partial<Record<ArchetypeGroups['aquatic_small'], ArchetypeData>>
> = {
  rotifer: {
    kind: 'cohort',
    latinStem: 'Brachion',
    nounZh: '輪蟲',
    flags: [],
    diets: [
      { bacteria: 0.5, phytoplankton: 0.4, detritus: 0.1 },
      { phytoplankton: 0.8, bacteria: 0.2 },
      { biofilm: 0.5, detritus: 0.3, bacteria: 0.2 },
      { protozoa: 0.5, phytoplankton: 0.3, zooplankton: 0.2 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.1, max: 0.5 },
    defenses: [['armor'], ['armor', 'spines'], ['mucus'], ['hiding']],
    habitats: [['pelagic'], ['epiphytic', 'benthic']],
    massMg: {
      min: measured(0.0001, 'aquatic_small_calcofiRotiferMass'),
      max: measured(0.00047, 'aquatic_small_calcofiRotiferMass'),
    },
    typicalLengthMm: measured(0.24, 'aquatic_small_faoRotiferMorph'),
    tolerance: {
      temperatureC: {
        min: measured(15, 'aquatic_small_faoRotiferCulture'),
        max: measured(35, 'aquatic_small_faoRotiferMorph'),
      },
      salinityPpt: {
        min: measured(0, 'aquatic_small_faoRotiferCulture'),
        max: derived(
          45,
          'aquatic_small_faoRotiferCulture',
          'B. plicatilis tolerates 1–97 ppt; clipped to the 45 ppt game ceiling',
        ),
      },
      ph: {
        min: measured(6, 'aquatic_small_faoRotiferCulture'),
        max: estimated(
          9,
          'marine rotifers do best above pH 7.5; upper limit not reported',
          'aquatic_small_faoRotiferCulture',
        ),
      },
      nh3MaxMgL: derived(
        2.5,
        'aquatic_small_faoRotiferCulture',
        `free ammonia 3 mg NH3/L inhibits reproduction (lower bound of 3–5); ${NH3_TO_N}`,
      ),
      no2MaxMgL: estimated(
        3,
        'no rotifer nitrite threshold found; rotifer mass cultures tolerate high nitrogen loads',
      ),
      o2MinMgL: measured(1.2, 'aquatic_small_faoRotiferCulture'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(3.4, 'aquatic_small_faoRotiferLife'),
        typLow: measured(3.4, 'aquatic_small_faoRotiferLife'),
        typHigh: measured(4.4, 'aquatic_small_faoRotiferLife'),
        max: measured(13.5, 'aquatic_small_lhRotifer'),
      },
      gameCapDays: derived(14, 'aquatic_small_lhRotifer', `${GAME_CAP} 13.5 d, rounded up`),
      maturityDays: {
        min: measured(0.5, 'aquatic_small_faoRotiferLife'),
        max: measured(1.5, 'aquatic_small_faoRotiferLife'),
      },
      reproduction: {
        mode: 'parthenogenesis',
        clutch: {
          min: derived(
            6,
            'aquatic_small_faoRotiferLife',
            'continuous layer: one egg per ≈ 4 h = 24/4 eggs per day',
          ),
          max: derived(
            6,
            'aquatic_small_faoRotiferLife',
            'continuous layer: one egg per ≈ 4 h = 24/4 eggs per day',
          ),
        },
        intervalDays: {
          min: derived(1, 'aquatic_small_faoRotiferLife', 'clutch expressed per day'),
          max: derived(1, 'aquatic_small_faoRotiferLife', 'clutch expressed per day'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: derived(300, 'aquatic_small_lhRotifer', '0.3 /mL × 1000 mL/L'),
        max: derived(1400, 'aquatic_small_lhRotifer', '1.4 /mL × 1000 mL/L'),
      },
      max: derived(211000, 'aquatic_small_lhRotifer', '211 /mL × 1000 mL/L'),
      unit: 'individuals_per_L',
    },
  },

  copepod: {
    kind: 'cohort',
    latinStem: 'Cyclo',
    nounZh: '劍水蚤',
    flags: [],
    diets: [
      { phytoplankton: 0.6, protozoa: 0.2, detritus: 0.2 },
      { protozoa: 0.4, zooplankton: 0.3, phytoplankton: 0.3 },
      { biofilm: 0.4, detritus: 0.4, bacteria: 0.2 },
      { zooplankton: 0.6, protozoa: 0.3, detritus: 0.1 },
    ],
    preySizeRatio: { min: 0.005, opt: 0.05, max: 0.5 },
    defenses: [['camouflage'], ['hiding'], ['burrowing'], ['armor']],
    habitats: [['pelagic'], ['benthic', 'epiphytic']],
    massMg: {
      min: derived(
        0.00082,
        'aquatic_small_ricciardi1998',
        `prolate ellipsoid π/6·L·(L/4)² at L = 0.5 mm (docs/09); ${WET_TO_DRY}`,
      ),
      max: derived(
        0.052,
        'aquatic_small_ricciardi1998',
        `prolate ellipsoid π/6·L·(L/4)² at L = 2 mm (docs/09); ${WET_TO_DRY}`,
      ),
    },
    typicalLengthMm: derived(
      1,
      'aquatic_small_lhCopepod',
      'geometric mean of adult length 0.5–2 mm',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(4, 'temperate cyclopoids and harpacticoids overwinter active in cold water'),
        max: estimated(
          32,
          'tropical culture species (Apocyclops, Pseudodiaptomus) grow to ≈ 30–32 °C',
        ),
      },
      salinityPpt: {
        min: estimated(0, GROUP_SALINITY_SPAN),
        max: estimated(40, GROUP_SALINITY_SPAN),
      },
      ph: {
        min: estimated(6, 'typical freshwater–marine culture range'),
        max: estimated(9, 'typical freshwater–marine culture range'),
      },
      nh3MaxMgL: derived(
        0.39,
        'aquatic_small_jepsenAcartiaNh3',
        `A. tonsa adult NOEC 0.477 mg NH3/L; ${NH3_TO_N}`,
      ),
      no2MaxMgL: estimated(
        1,
        'no copepod nitrite threshold found; set above the amphipod-derived 0.21 for small-bodied grazers',
      ),
      o2MinMgL: estimated(2, 'small planktonic crustaceans; no group-specific threshold found'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(20, 'aquatic_small_lhCopepod'),
        typLow: measured(30, 'aquatic_small_lhCopepod'),
        typHigh: measured(45, 'aquatic_small_lhCopepod'),
        max: measured(75, 'aquatic_small_lhCopepod'),
      },
      gameCapDays: derived(75, 'aquatic_small_lhCopepod', GAME_CAP),
      maturityDays: {
        min: measured(7, 'aquatic_small_lhCopepod'),
        max: measured(22, 'aquatic_small_lhCopepod'),
      },
      reproduction: {
        mode: 'brood',
        clutch: {
          min: estimated(20, 'small and first egg sacs carry fewer eggs than the reported ≈ 70'),
          max: measured(70, 'aquatic_small_lhCopepod'),
        },
        intervalDays: {
          min: measured(0.75, 'aquatic_small_lhCopepod'),
          max: measured(3, 'aquatic_small_lhCopepod'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 §4 (估)', 'aquatic_small_lhCopepod'),
        max: estimated(50, 'docs/09 §4 (估)', 'aquatic_small_lhCopepod'),
      },
      max: measured(40000, 'aquatic_small_lhCopepod'),
      unit: 'individuals_per_L',
    },
  },

  ostracod: {
    kind: 'cohort',
    latinStem: 'Cypri',
    nounZh: '介形蟲',
    flags: ['medication_resistant'],
    diets: [
      { detritus: 0.6, biofilm: 0.4 },
      { biofilm: 0.5, periphyton: 0.3, bacteria: 0.2 },
      { detritus: 0.5, carrion: 0.3, biofilm: 0.2 },
      { phytoplankton: 0.4, detritus: 0.4, bacteria: 0.2 },
    ],
    defenses: [['shell'], ['shell', 'burrowing'], ['shell', 'hiding'], ['shell', 'camouflage']],
    habitats: [
      ['benthic', 'infaunal'],
      ['epiphytic', 'benthic'],
    ],
    massMg: {
      min: derived(
        0.0022,
        'aquatic_small_ricciardi1998',
        `triaxial ellipsoid π/6·L·(L/2)·(L/3) at L = 0.5 mm (docs/09); ${WET_TO_DRY}`,
      ),
      max: derived(
        0.47,
        'aquatic_small_ricciardi1998',
        `triaxial ellipsoid π/6·L·(L/2)·(L/3) at L = 3 mm (docs/09); ${WET_TO_DRY}`,
      ),
    },
    typicalLengthMm: derived(
      1.2,
      'aquatic_small_lhOstracod',
      'geometric mean of adult length 0.5–3 mm',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(2, 'ostracods occur from Arctic ponds to tropical waters'),
        max: estimated(33, 'ostracods occur from Arctic ponds to tropical waters'),
      },
      salinityPpt: {
        min: estimated(0, GROUP_SALINITY_SPAN),
        max: estimated(40, GROUP_SALINITY_SPAN),
      },
      ph: {
        min: estimated(5.5, 'no group-specific data; benthic detritivore range'),
        max: estimated(9.5, 'no group-specific data; benthic detritivore range'),
      },
      nh3MaxMgL: estimated(
        0.3,
        'no ostracod ammonia data; closed carapace treated as more tolerant than cladocerans (0.16 mg NH3-N/L)',
      ),
      no2MaxMgL: estimated(2, 'no ostracod nitrite data; closed carapace treated as tolerant'),
      o2MinMgL: estimated(1, 'benthic detritivores tolerate low-oxygen sediment surfaces'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(30, 'aquatic_small_lhOstracod'),
        typLow: measured(60, 'aquatic_small_lhOstracod'),
        typHigh: measured(90, 'aquatic_small_lhOstracod'),
        max: measured(365, 'aquatic_small_lhOstracod'),
      },
      gameCapDays: derived(365, 'aquatic_small_lhOstracod', GAME_CAP),
      maturityDays: {
        min: estimated(15, 'docs/09 §4 (估)', 'aquatic_small_lhOstracod'),
        max: estimated(25, 'docs/09 §4 (估)', 'aquatic_small_lhOstracod'),
      },
      reproduction: {
        mode: 'parthenogenesis',
        clutch: {
          min: estimated(2, 'lifetime 0–64 eggs laid in small batches', 'aquatic_small_lhOstracod'),
          max: estimated(
            10,
            'lifetime 0–64 eggs laid in small batches',
            'aquatic_small_lhOstracod',
          ),
        },
        intervalDays: {
          min: estimated(3, 'lifetime fecundity spread over the adult span'),
          max: estimated(7, 'lifetime fecundity spread over the adult span'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(658, 'aquatic_small_lhOstracod'),
        max: measured(1160, 'aquatic_small_lhOstracod'),
      },
      max: measured(40000, 'aquatic_small_lhOstracod'),
      unit: 'individuals_per_m2',
    },
  },

  cladoceran: {
    kind: 'cohort',
    latinStem: 'Daphn',
    nounZh: '水蚤',
    flags: [],
    diets: [
      { phytoplankton: 0.8, bacteria: 0.2 },
      { phytoplankton: 0.6, bacteria: 0.2, detritus: 0.2 },
      { detritus: 0.4, bacteria: 0.3, phytoplankton: 0.3 },
      { phytoplankton: 0.6, zooplankton: 0.2, protozoa: 0.2 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.01, max: 0.1 },
    defenses: [['camouflage'], ['spines'], ['armor'], ['size']],
    habitats: [['pelagic'], ['epiphytic', 'benthic']],
    massMg: {
      min: derived(
        0.0043,
        'aquatic_small_bottrell1976',
        'ln W[µg] = 1.4681 + 2.8292 ln L at L = 1 mm (docs/09)',
      ),
      max: derived(
        0.41,
        'aquatic_small_bottrell1976',
        'ln W[µg] = 1.4681 + 2.8292 ln L at L = 5 mm (docs/09)',
      ),
    },
    typicalLengthMm: measured(3, 'aquatic_small_adwDaphnia'),
    tolerance: {
      temperatureC: {
        min: estimated(
          2,
          'Daphnia persists under ice; ADW gives preferred 18–22 °C only',
          'aquatic_small_adwDaphnia',
        ),
        max: estimated(32, 'Moina tolerates warmer water than Daphnia; no lethal limit found'),
      },
      salinityPpt: {
        min: measured(0, 'aquatic_small_adwDaphnia'),
        max: derived(
          5,
          'aquatic_small_adwDaphnia',
          'ADW reports tolerance to 8 ppt; docs/02 §3.4 caps the group at 5 ppt',
        ),
      },
      ph: {
        min: estimated(
          6.5,
          'FAO culture range pH 7–8 widened for tolerance',
          'aquatic_small_faoDaphnia',
        ),
        max: estimated(
          9.5,
          'FAO culture range pH 7–8 widened for tolerance',
          'aquatic_small_faoDaphnia',
        ),
      },
      nh3MaxMgL: derived(
        0.16,
        'aquatic_small_epaAmmonia2013',
        `D. magna chronic GMCV 41.46 mg TAN/L; ${TAN_TO_NH3N}`,
      ),
      no2MaxMgL: estimated(
        0.3,
        'no Daphnia nitrite LC50 found; set near the amphipod-derived 0.21 mg NO2-N/L',
      ),
      o2MinMgL: measured(1, 'aquatic_small_faoDaphnia'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(5, 'aquatic_small_lhCladoceran'),
        typLow: measured(11, 'aquatic_small_lhCladoceran'),
        typHigh: measured(56, 'aquatic_small_adwDaphnia'),
        max: measured(90, 'aquatic_small_lhCladoceran'),
      },
      gameCapDays: derived(90, 'aquatic_small_lhCladoceran', GAME_CAP),
      maturityDays: {
        min: measured(2, 'aquatic_small_lhCladoceran'),
        max: measured(10, 'aquatic_small_adwDaphnia'),
      },
      reproduction: {
        mode: 'parthenogenesis',
        clutch: {
          min: measured(6, 'aquatic_small_lhCladoceran'),
          max: measured(16, 'aquatic_small_lhCladoceran'),
        },
        intervalDays: {
          min: measured(3, 'aquatic_small_lhCladoceran'),
          max: measured(4, 'aquatic_small_adwDaphnia'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(20, 'aquatic_small_faoDaphnia'),
        max: measured(100, 'aquatic_small_faoDaphnia'),
      },
      max: measured(10000, 'aquatic_small_lhCladoceran'),
      unit: 'individuals_per_L',
    },
  },

  amphipod: {
    kind: 'cohort',
    latinStem: 'Gammar',
    nounZh: '鉤蝦',
    flags: ['cannibal'],
    diets: [
      { detritus: 0.6, food: 0.2, biofilm: 0.2 },
      { detritus: 0.5, periphyton: 0.3, macroalgae: 0.2 },
      { food: 0.4, carrion: 0.3, detritus: 0.3 },
      { detritus: 0.4, aquatic_invertebrate: 0.3, carrion: 0.3 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.1, max: 0.5 },
    defenses: [['hiding'], ['burrowing'], ['armor'], ['camouflage']],
    habitats: [
      ['benthic', 'crevice'],
      ['epiphytic', 'benthic'],
    ],
    massMg: {
      min: derived(
        0.14,
        'aquatic_small_ricciardi1998',
        `ellipsoid π/6·L·(L/4)·(L/5) at L = 3 mm (docs/09); ${WET_TO_DRY}`,
      ),
      max: derived(
        42,
        'aquatic_small_ricciardi1998',
        `ellipsoid π/6·L·(L/4)·(L/5) at L = 20 mm (docs/09); ${WET_TO_DRY}`,
      ),
    },
    typicalLengthMm: derived(
      8,
      'aquatic_small_lhAmphipod',
      'geometric mean of adult length 3–20 mm',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(2, 'Gammarus active in winter streams; no group lethal limit found'),
        max: estimated(30, 'Hyalella cultured at 23–28 °C; upper limit not found'),
      },
      salinityPpt: {
        min: estimated(0, GROUP_SALINITY_SPAN),
        max: estimated(40, GROUP_SALINITY_SPAN),
      },
      ph: {
        min: estimated(6, 'gammarids decline in acidified waters below ≈ pH 6'),
        max: estimated(9, 'no upper limit found; hard-water range'),
      },
      nh3MaxMgL: derived(
        0.12,
        'aquatic_small_epaAmmonia2013',
        `H. azteca chronic GMCV 29.17 mg TAN/L; ${TAN_TO_NH3N}`,
      ),
      no2MaxMgL: derived(
        0.21,
        'aquatic_small_alonsoNitrite2006',
        `E. toletanus 96-h LC50 2.09 mg NO2-N/L ${ACUTE_FACTOR}`,
      ),
      o2MinMgL: measured(2.9, 'aquatic_small_hyalellaHypoxia'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(90, 'aquatic_small_lhAmphipod'),
        typLow: measured(180, 'aquatic_small_lhAmphipod'),
        typHigh: measured(365, 'aquatic_small_lhAmphipod'),
        max: measured(700, 'aquatic_small_lhAmphipod'),
      },
      gameCapDays: derived(700, 'aquatic_small_lhAmphipod', GAME_CAP),
      maturityDays: {
        min: measured(24, 'aquatic_small_lhAmphipod'),
        max: measured(130, 'aquatic_small_lhAmphipod'),
      },
      reproduction: {
        mode: 'brood',
        clutch: {
          min: measured(5, 'aquatic_small_lhAmphipod'),
          max: measured(50, 'aquatic_small_lhAmphipod'),
        },
        intervalDays: {
          min: estimated(7, '7–8 broods over the adult span; warm-water brood cycle ≈ 1–3 weeks'),
          max: estimated(21, '7–8 broods over the adult span; warm-water brood cycle ≈ 1–3 weeks'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(
          300,
          'lower bound set at one third of the reported mean 904 /m²',
          'aquatic_small_lhAmphipod',
        ),
        max: measured(904, 'aquatic_small_lhAmphipod'),
      },
      max: estimated(10000, 'docs/09 §4 refugium density (估)', 'aquatic_small_lhAmphipod'),
      unit: 'individuals_per_m2',
    },
  },

  isopod: {
    kind: 'cohort',
    latinStem: 'Asell',
    nounZh: '水虱',
    flags: [],
    diets: [
      { detritus: 0.5, litter: 0.3, biofilm: 0.2 },
      { carrion: 0.4, detritus: 0.4, food: 0.2 },
      { periphyton: 0.4, detritus: 0.4, macroalgae: 0.2 },
      { carrion: 0.4, aquatic_invertebrate: 0.3, detritus: 0.3 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.1, max: 0.5 },
    defenses: [['armor'], ['armor', 'hiding'], ['camouflage'], ['burrowing']],
    habitats: [
      ['benthic', 'crevice'],
      ['benthic', 'epiphytic'],
    ],
    massMg: {
      min: derived(
        2.2,
        'aquatic_small_ricciardi1998',
        `flattened ellipsoid π/6·L·(L/3)·(L/8) at L = 8 mm (docs/09); ${WET_TO_DRY}`,
      ),
      max: derived(
        35,
        'aquatic_small_ricciardi1998',
        `flattened ellipsoid π/6·L·(L/3)·(L/8) at L = 20 mm (docs/09); ${WET_TO_DRY}`,
      ),
    },
    typicalLengthMm: derived(
      13,
      'aquatic_small_lhIsopod',
      'geometric mean of adult length 8–20 mm',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(2, 'Asellus active year-round in temperate ponds'),
        max: estimated(
          28,
          'Asellus egg survival falls toward 25 °C; tropical marine species tolerate more',
        ),
      },
      salinityPpt: {
        min: estimated(0, GROUP_SALINITY_SPAN),
        max: estimated(40, GROUP_SALINITY_SPAN),
      },
      ph: {
        min: estimated(6, 'Asellus avoids low-pH water'),
        max: estimated(9, 'no upper limit found; hard-water range'),
      },
      nh3MaxMgL: derived(
        0.15,
        'aquatic_small_epaAmmonia2013',
        `A. aquaticus acute GMAV 378.2 mg TAN/L; ${TAN_TO_NH3N}; ${ACUTE_FACTOR}`,
      ),
      no2MaxMgL: estimated(
        1,
        'no isopod nitrite data; set above amphipods for a pollution-tolerant detritivore',
      ),
      o2MinMgL: estimated(1.5, 'Asellus is an organic-pollution indicator tolerant of low oxygen'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(270, 'aquatic_small_lhIsopod'),
        typLow: measured(365, 'aquatic_small_lhIsopod'),
        typHigh: measured(365, 'aquatic_small_lhIsopod'),
        max: measured(600, 'aquatic_small_lhIsopod'),
      },
      gameCapDays: derived(600, 'aquatic_small_lhIsopod', GAME_CAP),
      maturityDays: {
        min: measured(45, 'aquatic_small_lhIsopod'),
        max: measured(90, 'aquatic_small_lhIsopod'),
      },
      reproduction: {
        mode: 'brood',
        clutch: {
          min: measured(5, 'aquatic_small_lhIsopod'),
          max: estimated(60, 'docs/09 §4 freshwater brood 20–60 (估)', 'aquatic_small_lhIsopod'),
        },
        intervalDays: {
          min: estimated(30, 'brood period of temperate Asellus ≈ 1–2 months'),
          max: estimated(60, 'brood period of temperate Asellus ≈ 1–2 months'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(71, 'aquatic_small_lhIsopod'),
        max: measured(240, 'aquatic_small_lhIsopod'),
      },
      max: measured(3759, 'aquatic_small_lhIsopod'),
      unit: 'individuals_per_m2',
    },
  },

  detritus_worm: {
    kind: 'cohort',
    latinStem: 'Tubif',
    nounZh: '顫蚓',
    flags: [],
    diets: [
      { detritus: 0.7, bacteria: 0.3 },
      { detritus: 0.5, biofilm: 0.3, bacteria: 0.2 },
      { detritus: 0.6, food: 0.2, bacteria: 0.2 },
      { zooplankton: 0.4, protozoa: 0.4, detritus: 0.2 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.01, max: 0.1 },
    defenses: [['burrowing'], ['burrowing', 'mucus'], ['hiding'], ['autotomy']],
    habitats: [['infaunal'], ['benthic', 'epiphytic']],
    massMg: {
      min: derived(
        0.2,
        'aquatic_small_ricciardi1998',
        `cylinder π/4·(L/80)²·L at L = 20 mm (docs/09); ${WET_TO_DRY}`,
      ),
      max: derived(
        18,
        'aquatic_small_ricciardi1998',
        `cylinder π/4·(L/80)²·L at L = 90 mm (docs/09); ${WET_TO_DRY}`,
      ),
    },
    typicalLengthMm: derived(
      42,
      'aquatic_small_lhDetritusWorm',
      'geometric mean of adult length 20–90 mm',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(2, 'Tubifex ranks among the most temperature-tolerant oligochaetes'),
        max: estimated(32, 'Tubifex ranks among the most temperature-tolerant oligochaetes'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater oligochaetes'),
        max: estimated(
          10,
          'Tubifex is salinity-tolerant into oligohaline estuaries; no marine populations (docs/02 F B)',
        ),
      },
      ph: {
        min: estimated(5.5, 'no group-specific data; organic-sediment range'),
        max: estimated(9, 'no group-specific data; organic-sediment range'),
      },
      nh3MaxMgL: derived(
        0.085,
        'aquatic_small_epaAmmonia2013',
        `T. tubifex acute GMAV 216.5 mg TAN/L; ${TAN_TO_NH3N}; ${ACUTE_FACTOR}`,
      ),
      no2MaxMgL: estimated(2, 'no oligochaete nitrite data; pollution-tolerant sediment fauna'),
      o2MinMgL: derived(
        0.8,
        'aquatic_small_tubifexUwsp',
        'thrives down to 10% O2 saturation; 0.1 × 8.26 mg/L saturation at 25 °C (USGS)',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(180, 'aquatic_small_lhDetritusWorm'),
        typLow: estimated(365, 'docs/09 §4 (估)', 'aquatic_small_lhDetritusWorm'),
        typHigh: estimated(730, 'docs/09 §4 (估)', 'aquatic_small_lhDetritusWorm'),
        max: measured(4000, 'aquatic_small_lhDetritusWorm'),
      },
      gameCapDays: derived(4000, 'aquatic_small_lhDetritusWorm', GAME_CAP),
      maturityDays: {
        min: estimated(60, 'docs/09 §4 (估)', 'aquatic_small_lhDetritusWorm'),
        max: estimated(90, 'docs/09 §4 (估)', 'aquatic_small_lhDetritusWorm'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(
            4,
            'eggs per cocoon; adults lay 8–10 cocoons',
            'aquatic_small_lhDetritusWorm',
          ),
          max: estimated(
            10,
            'eggs per cocoon; adults lay 8–10 cocoons',
            'aquatic_small_lhDetritusWorm',
          ),
        },
        intervalDays: {
          min: estimated(
            10,
            'fragmenting species double in 10–20 d (docs/09 估)',
            'aquatic_small_lhDetritusWorm',
          ),
          max: estimated(
            20,
            'fragmenting species double in 10–20 d (docs/09 估)',
            'aquatic_small_lhDetritusWorm',
          ),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1000, 'docs/09 §4 (估)', 'aquatic_small_lhDetritusWorm'),
        max: estimated(10000, 'docs/09 §4 (估)', 'aquatic_small_lhDetritusWorm'),
      },
      max: measured(100000, 'aquatic_small_lhDetritusWorm'),
      unit: 'individuals_per_m2',
    },
  },

  nematode: {
    kind: 'cohort',
    latinStem: 'Rhabdit',
    nounZh: '線蟲',
    flags: [],
    diets: [
      { bacteria: 0.6, detritus: 0.4 },
      { biofilm: 0.5, bacteria: 0.3, detritus: 0.2 },
      { periphyton: 0.5, biofilm: 0.3, detritus: 0.2 },
      { protozoa: 0.5, bacteria: 0.3, zooplankton: 0.2 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.1, max: 1 },
    defenses: [['burrowing'], ['hiding'], ['camouflage'], ['mucus']],
    habitats: [['infaunal'], ['benthic', 'epiphytic']],
    massMg: {
      min: derived(
        0.000049,
        'aquatic_small_ricciardi1998',
        `cylinder π/4·(L/20)²·L at L = 0.5 mm (docs/09); ${WET_TO_DRY}`,
      ),
      max: derived(
        0.0031,
        'aquatic_small_ricciardi1998',
        `cylinder π/4·(L/20)²·L at L = 2 mm (docs/09); ${WET_TO_DRY}`,
      ),
    },
    typicalLengthMm: derived(
      1,
      'aquatic_small_lhNematode',
      'geometric mean of adult length 0.5–2 mm',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(
          4,
          'free-living nematodes occur in all aquatic sediments; no group limit found',
        ),
        max: estimated(
          35,
          'free-living nematodes occur in all aquatic sediments; no group limit found',
        ),
      },
      salinityPpt: {
        min: estimated(0, GROUP_SALINITY_SPAN),
        max: estimated(40, GROUP_SALINITY_SPAN),
      },
      ph: {
        min: estimated(5, 'sediment meiofauna span acidic to alkaline substrates'),
        max: estimated(9.5, 'sediment meiofauna span acidic to alkaline substrates'),
      },
      nh3MaxMgL: estimated(0.3, 'no aquatic nematode ammonia data; dominant in enriched sediments'),
      no2MaxMgL: estimated(2, 'no aquatic nematode nitrite data; dominant in enriched sediments'),
      o2MinMgL: estimated(0.5, 'many sediment nematodes persist in hypoxic layers'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(5, 'aquatic_small_lhNematode'),
        typLow: measured(7, 'aquatic_small_lhNematode'),
        typHigh: measured(21, 'aquatic_small_lhNematode'),
        max: measured(30, 'aquatic_small_lhNematode'),
      },
      gameCapDays: derived(30, 'aquatic_small_lhNematode', GAME_CAP),
      maturityDays: {
        min: measured(3, 'aquatic_small_lhNematode'),
        max: measured(4, 'aquatic_small_lhNematode'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(
            10,
            'daily output below the reported maximum of ≈ 40',
            'aquatic_small_lhNematode',
          ),
          max: measured(40, 'aquatic_small_lhNematode'),
        },
        intervalDays: {
          min: derived(1, 'aquatic_small_lhNematode', 'output reported per day'),
          max: derived(1, 'aquatic_small_lhNematode', 'output reported per day'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(3000, 'aquatic_small_lhNematode'),
        max: measured(70000, 'aquatic_small_lhNematode'),
      },
      max: measured(1600000, 'aquatic_small_lhNematode'),
      unit: 'individuals_per_m2',
    },
  },

  bristle_worm: {
    kind: 'cohort',
    latinStem: 'Nerei',
    nounZh: '沙蠶',
    flags: [],
    diets: [
      { detritus: 0.5, food: 0.3, carrion: 0.2 },
      { food: 0.4, carrion: 0.4, detritus: 0.2 },
      { detritus: 0.5, biofilm: 0.3, macroalgae: 0.2 },
      { aquatic_invertebrate: 0.4, carrion: 0.3, detritus: 0.3 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.1, max: 0.5 },
    defenses: [['spines'], ['burrowing'], ['hiding'], ['spines', 'venom']],
    habitats: [
      ['infaunal', 'burrow'],
      ['crevice', 'benthic'],
    ],
    massMg: {
      min: derived(
        0.031,
        'aquatic_small_ricciardi1998',
        `cylinder π/4·(L/25)²·L at L = 5 mm (docs/09); ${WET_TO_DRY}`,
      ),
      max: derived(
        850,
        'aquatic_small_ricciardi1998',
        `cylinder π/4·(L/25)²·L at L = 150 mm (docs/09); ${WET_TO_DRY}`,
      ),
    },
    typicalLengthMm: derived(
      27,
      'aquatic_small_lhBristleWorm',
      'geometric mean of adult length 5–150 mm',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(
          8,
          'temperate intertidal polychaetes; aquarium species are subtropical to tropical',
        ),
        max: measured(31.5, 'aquatic_small_marlinCapitella'),
      },
      salinityPpt: {
        min: estimated(5, 'euryhaline nereidids and capitellids extend into oligohaline estuaries'),
        max: estimated(40, 'fully marine and hypersaline lagoon populations'),
      },
      ph: {
        min: estimated(7, 'brackish to marine carbonate-buffered water'),
        max: estimated(9, 'brackish to marine carbonate-buffered water'),
      },
      nh3MaxMgL: estimated(
        0.3,
        'no polychaete ammonia threshold found; enrichment-tolerant scavengers',
      ),
      no2MaxMgL: estimated(
        5,
        'no polychaete nitrite data; marine chloride lowers nitrite toxicity',
      ),
      o2MinMgL: estimated(1, 'Capitella and nereidids tolerate hypoxic enriched sediment'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(60, 'aquatic_small_lhBristleWorm'),
        typLow: measured(120, 'aquatic_small_lhBristleWorm'),
        typHigh: estimated(365, 'docs/09 §4 (估)', 'aquatic_small_lhBristleWorm'),
        max: estimated(
          1825,
          'docs/09 §4 large species live several years (估)',
          'aquatic_small_lhBristleWorm',
        ),
      },
      gameCapDays: estimated(1825, 'docs/09 §4 game cap (估)', 'aquatic_small_lhBristleWorm'),
      maturityDays: {
        min: measured(30, 'aquatic_small_lhBristleWorm'),
        max: measured(365, 'aquatic_small_lhBristleWorm'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(50, 'brooding capitellids lay tens to hundreds of eggs per brood'),
          max: estimated(500, 'brooding capitellids lay tens to hundreds of eggs per brood'),
        },
        intervalDays: {
          min: estimated(14, 'iteroparous capitellids brood repeatedly over the adult span'),
          max: estimated(60, 'iteroparous capitellids brood repeatedly over the adult span'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(1000, 'aquatic_small_lhBristleWorm'),
        max: measured(3000, 'aquatic_small_lhBristleWorm'),
      },
      max: measured(11620, 'aquatic_small_lhBristleWorm'),
      unit: 'individuals_per_m2',
    },
  },

  planarian: {
    kind: 'cohort',
    latinStem: 'Duges',
    nounZh: '渦蟲',
    flags: ['cannibal'],
    diets: [
      { carrion: 0.5, aquatic_invertebrate: 0.3, egg: 0.2 },
      { crustacean: 0.4, carrion: 0.4, egg: 0.2 },
      { aquatic_invertebrate: 0.4, food: 0.3, carrion: 0.3 },
      { egg: 0.4, carrion: 0.4, fish: 0.2 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.1, max: 1 },
    defenses: [['mucus'], ['toxin'], ['hiding'], ['mucus', 'hiding']],
    habitats: [
      ['benthic', 'crevice'],
      ['epiphytic', 'benthic'],
    ],
    massMg: {
      min: derived(
        0.11,
        'aquatic_small_ricciardi1998',
        `flat ellipsoid π/6·L·(L/6)·(L/20) at L = 5 mm (docs/09); ${WET_TO_DRY}`,
      ),
      max: derived(
        2.9,
        'aquatic_small_ricciardi1998',
        `flat ellipsoid π/6·L·(L/6)·(L/20) at L = 15 mm (docs/09); ${WET_TO_DRY}`,
      ),
    },
    typicalLengthMm: estimated(
      9,
      'geometric mean of docs/09 adult length 5–15 mm (估)',
      'aquatic_small_lhPlanarian',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(
          4,
          'cold-stenotherm Polycelis to warm Girardia; Dugesia stops fission below 15 °C',
        ),
        max: derived(
          30,
          'aquatic_small_girardiaStress',
          'G. tigrina heating ramp: first deaths 27 °C, 13% dead at 30 °C',
        ),
      },
      salinityPpt: {
        min: measured(0, 'aquatic_small_girardiaNacl'),
        max: derived(7.8, 'aquatic_small_girardiaNacl', 'G. tigrina 48-h LC50 7.77 g NaCl/L ≈ ppt'),
      },
      ph: {
        min: measured(4, 'aquatic_small_girardiaStress'),
        max: measured(10, 'aquatic_small_girardiaStress'),
      },
      nh3MaxMgL: derived(
        0.047,
        'aquatic_small_epaAmmonia2013',
        `D. lacteum acute GMAV 119.5 mg TAN/L; ${TAN_TO_NH3N}; ${ACUTE_FACTOR}`,
      ),
      no2MaxMgL: derived(
        6,
        'aquatic_small_alonsoNitrite2006',
        `P. felina 96-h LC50 60.0 mg NO2-N/L ${ACUTE_FACTOR}`,
      ),
      o2MinMgL: estimated(2, 'no planarian hypoxia threshold found; stream and pond species'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(
          365,
          'sexual strains 365–1,000 d; asexual strains have no fixed lifespan (docs/09 估)',
          'aquatic_small_lhPlanarian',
        ),
        typLow: estimated(365, 'docs/09 §4 sexual strains (估)', 'aquatic_small_lhPlanarian'),
        typHigh: estimated(1000, 'docs/09 §4 sexual strains (估)', 'aquatic_small_lhPlanarian'),
        max: estimated(
          3650,
          'asexual strains have no fixed lifespan; bounded by the game cap',
          'aquatic_small_lhPlanarian',
        ),
      },
      gameCapDays: estimated(3650, 'docs/09 §4 game cap (估)', 'aquatic_small_lhPlanarian'),
      maturityDays: {
        min: measured(18, 'aquatic_small_lhPlanarian'),
        max: estimated(30, 'regrowth after fission slows when food-limited'),
      },
      reproduction: {
        mode: 'fission',
        clutch: {
          min: estimated(1, 'transverse fission yields one new fragment, occasionally two'),
          max: estimated(2, 'transverse fission yields one new fragment, occasionally two'),
        },
        intervalDays: {
          min: measured(20, 'aquatic_small_lhPlanarian'),
          max: measured(43, 'aquatic_small_lhPlanarian'),
        },
      },
      senescence: 'negligible',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(10, 'docs/09 §4 on glass (估)', 'aquatic_small_lhPlanarian'),
        max: estimated(100, 'docs/09 §4 on glass (估)', 'aquatic_small_lhPlanarian'),
      },
      max: estimated(1000, 'docs/09 §4 (估)', 'aquatic_small_lhPlanarian'),
      unit: 'individuals_per_m2',
    },
  },

  hydra: {
    kind: 'cohort',
    latinStem: 'Hydr',
    nounZh: '水螅',
    flags: [],
    diets: [
      { zooplankton: 0.8, protozoa: 0.2 },
      { zooplankton: 0.5, crustacean: 0.3, fish: 0.2 },
      { zooplankton: 0.6, aquatic_invertebrate: 0.4 },
      { zooplankton: 0.5, fish: 0.3, crustacean: 0.2 },
    ],
    preySizeRatio: { min: 0.005, opt: 0.05, max: 1 },
    defenses: [['venom'], ['venom', 'hiding'], ['venom', 'camouflage'], ['venom', 'mucus']],
    habitats: [['sessile'], ['sessile', 'epiphytic']],
    massMg: {
      min: estimated(
        0.02,
        'polyp of ≈ 10⁵ cells at ≈ 0.2–2 ng dry mass per cell; no direct weighing found',
      ),
      max: estimated(
        0.2,
        'polyp of ≈ 10⁵ cells at ≈ 0.2–2 ng dry mass per cell; no direct weighing found',
      ),
    },
    typicalLengthMm: estimated(
      10,
      'docs/09 §4 extended polyp 5–15 mm (估)',
      'aquatic_small_lhHydra',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(
          4,
          'H. oligactis is a cold-water species; brown hydras overwinter as polyps or eggs',
        ),
        max: estimated(28, 'lab hydras are kept at 18–20 °C and heat-shocked above ≈ 30 °C'),
      },
      salinityPpt: {
        min: measured(0, 'aquatic_small_hydraNacl'),
        max: derived(1, 'aquatic_small_hydraNacl', 'H. vulgaris 96-h LC50 ≈ 1.0 g NaCl/L ≈ ppt'),
      },
      ph: {
        min: estimated(6, 'clean-water indicator; no pH limits found'),
        max: estimated(9, 'clean-water indicator; no pH limits found'),
      },
      nh3MaxMgL: estimated(
        0.05,
        'no Hydra ammonia LC50 found; clean-water indicator set near the planarian value (mg NH3-N/L)',
      ),
      no2MaxMgL: estimated(
        0.3,
        'no Hydra nitrite data found; clean-water indicator set near the cladoceran value',
      ),
      o2MinMgL: estimated(3, 'clean-water indicator; no hypoxia threshold found'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(365, 'wild polyps are lost to predation and seasonal drying'),
        typLow: estimated(1825, 'negligible senescence; lifespan set by extrinsic mortality'),
        typHigh: estimated(
          3650,
          'negligible senescence; bounded by the game cap',
          'aquatic_small_lhHydra',
        ),
        max: derived(
          60000,
          'aquatic_small_lhHydra',
          'constant mortality ≈ 0.6%/yr → mean lifespan 1/0.006 yr ≈ 167 yr ≈ 60,000 d',
        ),
      },
      gameCapDays: estimated(3650, 'docs/09 §4 game cap (估)', 'aquatic_small_lhHydra'),
      maturityDays: {
        min: estimated(3, 'docs/09 §4 bud detaches after 3–4 d (估)', 'aquatic_small_lhHydra'),
        max: estimated(4, 'docs/09 §4 bud detaches after 3–4 d (估)', 'aquatic_small_lhHydra'),
      },
      reproduction: {
        mode: 'budding',
        clutch: {
          min: estimated(1, 'well-fed polyps carry one to three buds at once'),
          max: estimated(3, 'well-fed polyps carry one to three buds at once'),
        },
        intervalDays: {
          min: measured(3.5, 'aquatic_small_lhHydra'),
          max: measured(14.8, 'aquatic_small_lhHydra'),
        },
      },
      senescence: 'negligible',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(10, 'docs/09 §4 (估)', 'aquatic_small_lhHydra'),
        max: estimated(100, 'docs/09 §4 (估)', 'aquatic_small_lhHydra'),
      },
      max: estimated(
        1000,
        'docs/09 §4 hundreds to thousands per tank (估)',
        'aquatic_small_lhHydra',
      ),
      unit: 'individuals_per_enclosure',
    },
  },
};
