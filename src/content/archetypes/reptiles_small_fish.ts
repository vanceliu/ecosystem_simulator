import type { ArchetypeData } from '../archetype';
import { derived, estimated, measured, type Sourced } from '../sourced';
import type { ArchetypeGroups } from './groupTypes';

const YEAR_DAYS = 365;
const DRY_FRACTION = 'dry mass = wet mass × 0.25 (vertebrate dry:wet ≈ 0.25)';
const FISH_LW = 'W(g) = 0.01 × L(cm)³, then';

const REPTILE_NH3: Sourced = estimated(
  0.4,
  'mg NH3-N/L; air-breathing reptile exposed via skin and mucosa only; ≈ 10× fish threshold',
);
const REPTILE_NO2: Sourced = estimated(
  1.5,
  'mg NO2-N/L; air-breathing reptile, no nitrite toxicity data; ≈ 10× fish threshold',
);
const LUNG_BREATHER_O2: Sourced = estimated(
  0.5,
  'lung breather independent of dissolved O2; threshold only marks anoxic water',
);

const FISH_NH3: Sourced = derived(
  0.041,
  'reptiles_small_fish_aqsciAmmonia',
  'free NH3 toxic above 0.05 mg NH3/L × 14/17 ≈ 0.041 mg NH3-N/L',
);
const FISH_NO2_SENSITIVE: Sourced = derived(
  0.15,
  'reptiles_small_fish_aqsciNitrite',
  'lower long-term limit 0.5 mg NO2⁻/L × 14/46 ≈ 0.15 mg NO2-N/L',
);
const FISH_NO2_TOLERANT: Sourced = derived(
  0.3,
  'reptiles_small_fish_aqsciNitrite',
  '1 mg NO2⁻/L (within the 0.5–2 mg/L long-term range) × 14/46 ≈ 0.3 mg NO2-N/L',
);
const FISH_SALINITY_MAX: Sourced = estimated(
  35,
  'marine representatives of the group live in full-strength seawater (30–35 ppt)',
);

/** docs/02, docs/09: small_arboreal_lizard, semi_aquatic_lizard, water_monitor, garter_water_snake, small_python, musk_turtle, slider_turtle, softshell_turtle, planktivore_fish, grazer_fish, benthic_omnivore_fish, piscivore_fish */
export const REPTILES_SMALL_FISH: Readonly<
  Partial<Record<ArchetypeGroups['reptiles_small_fish'], ArchetypeData>>
> = {
  small_arboreal_lizard: {
    kind: 'cohort',
    latinStem: 'Anol',
    nounZh: '安樂蜥',
    flags: ['needs_uvb', 'needs_basking', 'territorial', 'air_breather', 'escapes_open_lid'],
    massMg: {
      min: derived(750, 'reptiles_small_fish_reptifilesAnole', `docs/09 3 g wet; ${DRY_FRACTION}`),
      max: derived(
        17500,
        'reptiles_small_fish_reptifilesAnole',
        `docs/09 70 g wet; ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: estimated(200, 'docs/09 total length 12–30 cm; anole-sized midpoint'),
    tolerance: {
      temperatureC: {
        min: measured(18, 'reptiles_small_fish_reptifilesAnole'),
        max: measured(32, 'reptiles_small_fish_reptifilesAnole'),
      },
      ph: {
        min: estimated(5.5, 'terrestrial; substrate/water dish pH tolerance assumed broad'),
        max: estimated(8, 'terrestrial; substrate/water dish pH tolerance assumed broad'),
      },
      humidityMinPercent: measured(60, 'reptiles_small_fish_reptifilesAnole'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(3 * YEAR_DAYS, 'reptiles_small_fish_reptifilesAnole'),
        typLow: measured(5 * YEAR_DAYS, 'reptiles_small_fish_reptifilesAnole'),
        typHigh: measured(7 * YEAR_DAYS, 'reptiles_small_fish_reptifilesAnole'),
        max: estimated(20 * YEAR_DAYS, 'docs/09: day geckos up to 20 years'),
      },
      gameCapDays: estimated(7300, 'docs/09 game cap (估)'),
      maturityDays: {
        min: estimated(240, 'docs/09 8–12 months (估)'),
        max: estimated(365, 'docs/09 8–12 months (估)'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(1, 'docs/09 1–2 eggs per clutch (估)'),
          max: estimated(2, 'docs/09 1–2 eggs per clutch (估)'),
        },
        intervalDays: {
          min: estimated(7, 'docs/09 every 1–3 weeks (估)'),
          max: estimated(21, 'docs/09 every 1–3 weeks (估)'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09: one male plus females per enclosure'),
        max: estimated(2, 'docs/09: one male plus females per enclosure'),
      },
      max: estimated(3, 'docs/09 3 per 230 L (估)'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      heightCm: measured(61, 'reptiles_small_fish_reptifilesAnole'),
      landAreaM2: derived(
        0.38,
        'reptiles_small_fish_reptifilesAnole',
        'docs/09 230 L enclosure ÷ 61 cm height ≈ 0.38 m² floor',
      ),
      adultsPerEnclosure: estimated(3, 'docs/09 3 per 230 L (估)'),
    },
    diets: [
      { terrestrial_invertebrate: 0.6, flying_insect: 0.4 },
      { flying_insect: 0.5, terrestrial_invertebrate: 0.3, fruit: 0.2 },
      { terrestrial_invertebrate: 0.7, flying_insect: 0.2, mollusc: 0.1 },
      { terrestrial_invertebrate: 0.5, flying_insect: 0.3, amphibian: 0.2 },
    ],
    preySizeRatio: { min: 0.0001, opt: 0.01, max: 0.1 },
    defenses: [['autotomy'], ['camouflage', 'autotomy'], ['hiding'], ['autotomy', 'hiding']],
    habitats: [['arboreal'], ['ground', 'leaf_litter']],
  },

  semi_aquatic_lizard: {
    kind: 'cohort',
    latinStem: 'Physign',
    nounZh: '水龍',
    flags: ['needs_uvb', 'needs_basking', 'territorial', 'air_breather'],
    massMg: {
      min: derived(
        50000,
        'reptiles_small_fish_lafeberWaterDragon',
        `docs/09 0.2 kg wet; ${DRY_FRACTION}`,
      ),
      max: derived(
        250000,
        'reptiles_small_fish_lafeberWaterDragon',
        `docs/09 1 kg wet; ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: estimated(750, 'docs/09 total length 60–90 cm midpoint'),
    tolerance: {
      temperatureC: {
        min: measured(24, 'reptiles_small_fish_reptifilesWaterDragon'),
        max: measured(35, 'reptiles_small_fish_reptifilesWaterDragon'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater streams and ponds'),
        max: estimated(1, 'freshwater only; no brackish records'),
      },
      ph: {
        min: estimated(6, 'pool water; no data, typical freshwater range'),
        max: estimated(8, 'pool water; no data, typical freshwater range'),
      },
      nh3MaxMgL: REPTILE_NH3,
      no2MaxMgL: REPTILE_NO2,
      o2MinMgL: LUNG_BREATHER_O2,
      humidityMinPercent: measured(60, 'reptiles_small_fish_reptifilesWaterDragon'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(8 * YEAR_DAYS, 'reptiles_small_fish_lafeberWaterDragon'),
        typLow: measured(10 * YEAR_DAYS, 'reptiles_small_fish_lafeberWaterDragon'),
        typHigh: measured(15 * YEAR_DAYS, 'reptiles_small_fish_lafeberWaterDragon'),
        max: measured(20 * YEAR_DAYS, 'reptiles_small_fish_lafeberWaterDragon'),
      },
      gameCapDays: measured(7300, 'reptiles_small_fish_lafeberWaterDragon'),
      maturityDays: {
        min: measured(545, 'reptiles_small_fish_lafeberWaterDragon'),
        max: measured(730, 'reptiles_small_fish_lafeberWaterDragon'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(6, 'reptiles_small_fish_lafeberWaterDragon'),
          max: measured(17, 'reptiles_small_fish_lafeberWaterDragon'),
        },
        intervalDays: {
          min: estimated(
            30,
            '4–5 clutches per breeding season of ~5 months',
            'reptiles_small_fish_lafeberWaterDragon',
          ),
          max: estimated(
            45,
            '4–5 clutches per breeding season of ~5 months',
            'reptiles_small_fish_lafeberWaterDragon',
          ),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(1, 'reptiles_small_fish_lafeberWaterDragon'),
        max: estimated(2, 'one male with one female'),
      },
      max: estimated(3, 'docs/09 3 per 3,000 L (估)'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(183, 'reptiles_small_fish_lafeberWaterDragon'),
      landAreaM2: derived(
        1.67,
        'reptiles_small_fish_lafeberWaterDragon',
        '183 cm × 91 cm floor of the 1,360 L minimum enclosure',
      ),
      waterVolumeL: estimated(100, 'docs/02 large pool deep enough to submerge fully'),
      adultsPerEnclosure: estimated(2, 'one male with one female; docs/09 3 per 3,000 L (估)'),
    },
    diets: [
      { terrestrial_invertebrate: 0.6, flying_insect: 0.2, fish: 0.2 },
      { terrestrial_invertebrate: 0.4, fish: 0.3, amphibian: 0.3 },
      { terrestrial_invertebrate: 0.5, aquatic_invertebrate: 0.2, crustacean: 0.1, fruit: 0.2 },
      { fish: 0.4, crustacean: 0.2, terrestrial_invertebrate: 0.4 },
    ],
    preySizeRatio: { min: 0.0001, opt: 0.01, max: 0.1 },
    defenses: [['autotomy', 'hiding'], ['size'], ['camouflage'], ['autotomy', 'camouflage']],
    habitats: [
      ['arboreal', 'shore'],
      ['ground', 'surface'],
    ],
  },

  water_monitor: {
    kind: 'cohort',
    latinStem: 'Varan',
    nounZh: '巨蜥',
    flags: ['needs_uvb', 'needs_basking', 'territorial', 'air_breather'],
    massMg: {
      min: derived(
        1250000,
        'reptiles_small_fish_herpJWaterMonitor',
        `docs/09 5 kg wet; ${DRY_FRACTION}`,
      ),
      max: derived(
        6250000,
        'reptiles_small_fish_herpJWaterMonitor',
        `docs/09 25 kg wet; ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: estimated(1500, 'docs/09 total length 1–3 m; captive adults ≈ 1.5 m'),
    tolerance: {
      temperatureC: {
        min: measured(21, 'reptiles_small_fish_reptilesMagWaterMonitor'),
        max: measured(36, 'reptiles_small_fish_reptilesMagWaterMonitor'),
      },
      salinityPpt: {
        min: estimated(0, 'rivers, swamps and canals'),
        max: estimated(25, 'enters mangroves and estuaries; swims in the sea for short periods'),
      },
      ph: {
        min: estimated(6, 'pool water; no data, typical freshwater–estuarine range'),
        max: estimated(8.5, 'pool water; no data, typical freshwater–estuarine range'),
      },
      nh3MaxMgL: REPTILE_NH3,
      no2MaxMgL: REPTILE_NO2,
      o2MinMgL: LUNG_BREATHER_O2,
      humidityMinPercent: estimated(
        60,
        'humid tropical lowland species; no species-specific husbandry figure',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(
          8 * YEAR_DAYS,
          'docs/09 8 years short',
          'reptiles_small_fish_herpJWaterMonitor',
        ),
        typLow: estimated(
          15 * YEAR_DAYS,
          'docs/09 15 years typical',
          'reptiles_small_fish_herpJWaterMonitor',
        ),
        typHigh: estimated(
          15 * YEAR_DAYS,
          'docs/09 15 years typical',
          'reptiles_small_fish_herpJWaterMonitor',
        ),
        max: estimated(
          20 * YEAR_DAYS,
          'docs/09 20+ years long',
          'reptiles_small_fish_herpJWaterMonitor',
        ),
      },
      gameCapDays: estimated(9125, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(640, 'docs/09 about 2 years', 'reptiles_small_fish_herpJWaterMonitor'),
        max: estimated(800, 'docs/09 about 2 years', 'reptiles_small_fish_herpJWaterMonitor'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(5, 'docs/09 5–30 eggs per year (估)'),
          max: estimated(30, 'docs/09 5–30 eggs per year (估)'),
        },
        intervalDays: {
          min: estimated(180, 'one to two clutches per year'),
          max: estimated(365, 'one to two clutches per year'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 solitary, one per enclosure'),
        max: estimated(1, 'docs/09 solitary, one per enclosure'),
      },
      max: estimated(1, 'docs/09 solitary, one per enclosure'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(
        305,
        "docs/09 305 cm; adult enclosure 8' (244 cm) as lower bound",
        'reptiles_small_fish_reptilesMagWaterMonitorCare',
      ),
      heightCm: measured(244, 'reptiles_small_fish_reptilesMagWaterMonitorCare'),
      landAreaM2: derived(
        5.6,
        'reptiles_small_fish_reptilesMagWaterMonitorCare',
        '305 cm length × 183 cm (6 ft) depth',
      ),
      waterVolumeL: estimated(500, 'pool large enough for full submersion of a 1.5 m lizard'),
      adultsPerEnclosure: estimated(1, 'docs/09 solitary'),
    },
    diets: [
      { fish: 0.4, amphibian: 0.2, crustacean: 0.2, reptile: 0.1, carrion: 0.1 },
      { crustacean: 0.4, fish: 0.3, mollusc: 0.1, egg: 0.2 },
      { carrion: 0.3, fish: 0.3, reptile: 0.2, amphibian: 0.2 },
      { terrestrial_invertebrate: 0.3, fish: 0.3, crustacean: 0.2, egg: 0.2 },
    ],
    preySizeRatio: { min: 0.0001, opt: 0.02, max: 0.3 },
    defenses: [['size'], ['size', 'hiding'], ['size', 'camouflage'], ['hiding', 'camouflage']],
    habitats: [
      ['shore', 'surface'],
      ['ground', 'arboreal'],
    ],
  },

  garter_water_snake: {
    kind: 'cohort',
    latinStem: 'Thamnoph',
    nounZh: '束帶蛇',
    flags: ['needs_basking', 'air_breather'],
    massMg: {
      min: derived(
        12500,
        'reptiles_small_fish_reptifilesGarter',
        `docs/09 50 g wet; ${DRY_FRACTION}`,
      ),
      max: derived(
        150000,
        'reptiles_small_fish_reptifilesGarter',
        `docs/09 600 g wet; ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: estimated(750, 'docs/09 45–150 cm; typical garter snake adult'),
    tolerance: {
      temperatureC: {
        min: estimated(15, 'temperate species; heat off at night, tolerates cool rooms'),
        max: measured(32, 'reptiles_small_fish_reptifilesGarter'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater marshes and streams'),
        max: estimated(
          20,
          'salt marsh water snakes inhabit brackish estuaries but avoid drinking seawater',
          'reptiles_small_fish_adwNerodiaClarkii',
        ),
      },
      ph: {
        min: estimated(6, 'pool water; no data, typical freshwater range'),
        max: estimated(8.5, 'pool water; no data, typical freshwater–estuarine range'),
      },
      nh3MaxMgL: REPTILE_NH3,
      no2MaxMgL: REPTILE_NO2,
      o2MinMgL: LUNG_BREATHER_O2,
      humidityMinPercent: measured(35, 'reptiles_small_fish_reptifilesGarter'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(3 * YEAR_DAYS, 'reptiles_small_fish_reptifilesGarter'),
        typLow: measured(8 * YEAR_DAYS, 'reptiles_small_fish_reptifilesGarter'),
        typHigh: measured(8 * YEAR_DAYS, 'reptiles_small_fish_reptifilesGarter'),
        max: measured(15 * YEAR_DAYS, 'reptiles_small_fish_reptifilesGarter'),
      },
      gameCapDays: measured(5475, 'reptiles_small_fish_reptifilesGarter'),
      maturityDays: {
        min: estimated(730, 'docs/09 2–3 years (估)'),
        max: estimated(1095, 'docs/09 2–3 years (估)'),
      },
      reproduction: {
        mode: 'livebearer',
        clutch: {
          min: measured(4, 'reptiles_small_fish_reptifilesGarter'),
          max: measured(40, 'reptiles_small_fish_reptifilesGarter'),
        },
        intervalDays: {
          min: measured(365, 'reptiles_small_fish_reptifilesGarter'),
          max: measured(365, 'reptiles_small_fish_reptifilesGarter'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 water snakes kept singly'),
        max: estimated(3, 'docs/09 garter snakes kept in groups'),
      },
      max: estimated(3, 'docs/09 3 per 122 cm enclosure length (估)'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(122, 'reptiles_small_fish_reptifilesGarter'),
      landAreaM2: derived(
        0.74,
        'reptiles_small_fish_reptifilesGarter',
        '48" × 24" = 122 cm × 61 cm',
      ),
      waterVolumeL: estimated(20, 'shallow pool for swimming and hunting fish'),
      adultsPerEnclosure: estimated(3, 'docs/09 3 per 122 cm enclosure length (估)'),
    },
    diets: [
      { fish: 0.6, amphibian: 0.3, aquatic_invertebrate: 0.1 },
      { amphibian: 0.5, fish: 0.3, terrestrial_invertebrate: 0.2 },
      { fish: 0.8, crustacean: 0.2 },
      { terrestrial_invertebrate: 0.4, mollusc: 0.2, amphibian: 0.2, fish: 0.2 },
    ],
    preySizeRatio: { min: 0.005, opt: 0.1, max: 0.5 },
    defenses: [['camouflage'], ['hiding'], ['camouflage', 'hiding'], ['venom', 'camouflage']],
    habitats: [
      ['shore', 'ground'],
      ['surface', 'shore'],
    ],
  },

  small_python: {
    kind: 'cohort',
    latinStem: 'Antares',
    nounZh: '蟒',
    flags: ['needs_basking', 'air_breather'],
    massMg: {
      min: estimated(75000, `docs/09 0.3 kg wet (估); ${DRY_FRACTION}`),
      max: estimated(150000, `docs/09 0.6 kg wet (估); ${DRY_FRACTION}`),
    },
    typicalLengthMm: measured(1000, 'reptiles_small_fish_wikiChildrensPython'),
    tolerance: {
      temperatureC: {
        min: measured(16, 'reptiles_small_fish_vetAntaresia'),
        max: measured(38, 'reptiles_small_fish_vetAntaresia'),
      },
      ph: {
        min: estimated(5.5, 'terrestrial; substrate/water dish pH tolerance assumed broad'),
        max: estimated(8, 'terrestrial; substrate/water dish pH tolerance assumed broad'),
      },
      humidityMinPercent: estimated(
        40,
        'care sheets disagree (dry to 60%); savanna–monsoon species',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(
          20 * YEAR_DAYS,
          'docs/09 20 years short',
          'reptiles_small_fish_wikiChildrensPython',
        ),
        typLow: estimated(
          25 * YEAR_DAYS,
          'docs/09 25 years typical',
          'reptiles_small_fish_wikiChildrensPython',
        ),
        typHigh: estimated(
          25 * YEAR_DAYS,
          'docs/09 25 years typical',
          'reptiles_small_fish_wikiChildrensPython',
        ),
        max: measured(30 * YEAR_DAYS, 'reptiles_small_fish_wikiChildrensPython'),
      },
      gameCapDays: measured(10950, 'reptiles_small_fish_wikiChildrensPython'),
      maturityDays: {
        min: estimated(730, 'docs/09 2–3 years (估)'),
        max: estimated(1095, 'docs/09 2–3 years (估)'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(4, 'docs/09 4–15 eggs', 'reptiles_small_fish_wikiChildrensPython'),
          max: estimated(
            15,
            'docs/09 4–15 eggs; recorded up to 25',
            'reptiles_small_fish_wikiChildrensPython',
          ),
        },
        intervalDays: {
          min: estimated(365, 'docs/09 one clutch per year'),
          max: estimated(365, 'docs/09 one clutch per year'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 solitary'),
        max: estimated(1, 'docs/09 solitary'),
      },
      max: estimated(1, 'docs/09 solitary'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: derived(
        100,
        'reptiles_small_fish_wikiChildrensPython',
        'docs/09 enclosure length ≥ snake length; typical adult ≈ 1.0 m',
      ),
      landAreaM2: estimated(0.45, '100 cm × 45 cm floor'),
      adultsPerEnclosure: estimated(1, 'docs/09 solitary'),
    },
    diets: [
      { reptile: 0.6, amphibian: 0.4 },
      { amphibian: 0.6, reptile: 0.4 },
      { reptile: 0.5, amphibian: 0.3, egg: 0.2 },
      { reptile: 0.4, amphibian: 0.3, food: 0.3 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.1, max: 0.5 },
    defenses: [['camouflage', 'hiding'], ['hiding'], ['camouflage'], ['size', 'hiding']],
    habitats: [
      ['ground', 'crevice'],
      ['arboreal', 'ground'],
    ],
  },

  musk_turtle: {
    kind: 'cohort',
    latinStem: 'Sternoth',
    nounZh: '麝香龜',
    flags: ['needs_uvb', 'needs_basking', 'territorial', 'air_breather'],
    massMg: {
      min: derived(37500, 'reptiles_small_fish_cosewicMusk', `docs/09 150 g wet; ${DRY_FRACTION}`),
      max: derived(75000, 'reptiles_small_fish_cosewicMusk', `docs/09 300 g wet; ${DRY_FRACTION}`),
    },
    typicalLengthMm: derived(
      100,
      'reptiles_small_fish_gensouMusk',
      'carapace 8–13 cm, rounded midpoint',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(15, 'temperate species active in cool water; care sheets cite 10–25 °C'),
        max: measured(32, 'reptiles_small_fish_gensouMusk'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater ponds, lakes and slow rivers'),
        max: estimated(1, 'freshwater only'),
      },
      ph: {
        min: estimated(6, 'care sheets cite pH 6–8'),
        max: estimated(8, 'care sheets cite pH 6–8'),
      },
      nh3MaxMgL: REPTILE_NH3,
      no2MaxMgL: REPTILE_NO2,
      o2MinMgL: estimated(
        2,
        'supplements lung breathing with buccopharyngeal uptake on long dives',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(20 * YEAR_DAYS, 'reptiles_small_fish_cosewicMusk'),
        typLow: measured(30 * YEAR_DAYS, 'reptiles_small_fish_cosewicMusk'),
        typHigh: measured(50 * YEAR_DAYS, 'reptiles_small_fish_cosewicMusk'),
        max: measured(54 * YEAR_DAYS, 'reptiles_small_fish_cosewicMusk'),
      },
      gameCapDays: measured(19710, 'reptiles_small_fish_cosewicMusk'),
      maturityDays: {
        min: measured(3 * YEAR_DAYS, 'reptiles_small_fish_cosewicMusk'),
        max: measured(11 * YEAR_DAYS, 'reptiles_small_fish_cosewicMusk'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(1, 'reptiles_small_fish_cosewicMusk'),
          max: measured(9, 'reptiles_small_fish_cosewicMusk'),
        },
        intervalDays: {
          min: derived(
            30,
            'reptiles_small_fish_cosewicMusk',
            'up to 4 clutches in a ~4-month nesting season',
          ),
          max: derived(365, 'reptiles_small_fish_cosewicMusk', 'minimum of 1 clutch per year'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 one per enclosure; can be territorial'),
        max: estimated(1, 'docs/09 one per enclosure; can be territorial'),
      },
      max: estimated(1, 'docs/09 one per enclosure'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(100, 'docs/09 100 cm'),
      waterVolumeL: estimated(
        115,
        'docs/09 115 L; Gensou recommends 90 L per adult',
        'reptiles_small_fish_gensouMusk',
      ),
      adultsPerEnclosure: estimated(1, 'docs/09 one per enclosure'),
    },
    diets: [
      { mollusc: 0.4, aquatic_invertebrate: 0.3, carrion: 0.2, fish: 0.1 },
      { aquatic_invertebrate: 0.5, mollusc: 0.2, plant: 0.1, carrion: 0.2 },
      { mollusc: 0.3, crustacean: 0.3, fish: 0.2, carrion: 0.2 },
      { aquatic_invertebrate: 0.4, carrion: 0.3, food: 0.3 },
    ],
    preySizeRatio: { min: 0.0001, opt: 0.01, max: 0.1 },
    defenses: [['shell', 'toxin'], ['shell'], ['shell', 'hiding'], ['shell', 'camouflage']],
    habitats: [['benthic'], ['benthic', 'crevice']],
  },

  slider_turtle: {
    kind: 'cohort',
    latinStem: 'Trachem',
    nounZh: '滑龜',
    flags: ['needs_uvb', 'needs_basking', 'air_breather'],
    massMg: {
      min: derived(
        125000,
        'reptiles_small_fish_lafeberSlider',
        `docs/09 0.5 kg wet; ${DRY_FRACTION}`,
      ),
      max: derived(
        625000,
        'reptiles_small_fish_lafeberSlider',
        `docs/09 2.5 kg wet; ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: estimated(200, 'docs/09 carapace 13–30 cm'),
    tolerance: {
      temperatureC: {
        min: estimated(
          20,
          'night air may drop to ~21 °C; adult water 23–24 °C',
          'reptiles_small_fish_phoenixHerpSlider',
        ),
        max: estimated(35, 'basking zone up to ~35 °C', 'reptiles_small_fish_phoenixHerpSlider'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater ponds and rivers'),
        max: measured(15, 'reptiles_small_fish_peerjSliderSalinity'),
      },
      ph: {
        min: estimated(6, 'no data; typical freshwater range'),
        max: estimated(8.5, 'no data; typical freshwater range'),
      },
      nh3MaxMgL: REPTILE_NH3,
      no2MaxMgL: REPTILE_NO2,
      o2MinMgL: LUNG_BREATHER_O2,
      humidityMinPercent: estimated(
        50,
        'basking area humidity; one care sheet cites ~70% over the island',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(20 * YEAR_DAYS, 'reptiles_small_fish_lafeberSlider'),
        typLow: measured(30 * YEAR_DAYS, 'reptiles_small_fish_lafeberSlider'),
        typHigh: measured(30 * YEAR_DAYS, 'reptiles_small_fish_lafeberSlider'),
        max: measured(40 * YEAR_DAYS, 'reptiles_small_fish_lafeberSlider'),
      },
      gameCapDays: measured(14600, 'reptiles_small_fish_lafeberSlider'),
      maturityDays: {
        min: measured(2 * YEAR_DAYS, 'reptiles_small_fish_lafeberSlider'),
        max: measured(8 * YEAR_DAYS, 'reptiles_small_fish_lafeberSlider'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(4, 'reptiles_small_fish_lafeberSlider'),
          max: measured(23, 'reptiles_small_fish_lafeberSlider'),
        },
        intervalDays: {
          min: estimated(20, 'docs/09 2–3 clutches per season'),
          max: estimated(60, 'docs/09 2–3 clutches per season'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(1, 'reptiles_small_fish_lafeberSlider'),
        max: measured(3, 'reptiles_small_fish_lafeberSlider'),
      },
      max: estimated(3, 'docs/09 maximum 3'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: estimated(
        300,
        'docs/09 38 L per 2.5 cm carapace (估) × 20 cm typical carapace',
      ),
      landAreaM2: estimated(0.1, 'dry basking dock large enough for the whole carapace'),
      adultsPerEnclosure: estimated(1, 'docs/09 water volume rule applies per turtle'),
    },
    diets: [
      { fish: 0.2, aquatic_invertebrate: 0.3, plant: 0.3, mollusc: 0.2 },
      { plant: 0.5, periphyton: 0.1, aquatic_invertebrate: 0.2, carrion: 0.2 },
      { fish: 0.3, amphibian: 0.2, mollusc: 0.2, plant: 0.3 },
      { aquatic_invertebrate: 0.3, plant: 0.3, food: 0.4 },
    ],
    preySizeRatio: { min: 0.0001, opt: 0.01, max: 0.1 },
    defenses: [['shell'], ['shell', 'size'], ['shell', 'hiding'], ['shell', 'camouflage']],
    habitats: [
      ['surface', 'shore'],
      ['benthic', 'shore'],
    ],
  },

  softshell_turtle: {
    kind: 'cohort',
    latinStem: 'Apalon',
    nounZh: '鱉',
    flags: ['needs_uvb', 'needs_basking', 'territorial', 'air_breather'],
    massMg: {
      min: estimated(
        125000,
        `adult male ≈ 0.5 kg wet; ${DRY_FRACTION}`,
        'reptiles_small_fish_mdcSoftshell',
      ),
      max: derived(
        2750000,
        'reptiles_small_fish_mdcSoftshell',
        `docs/09 ≤ 11 kg wet; ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: estimated(250, 'docs/09 carapace 13–48 cm; males ≤ 25 cm'),
    tolerance: {
      temperatureC: {
        min: estimated(20, 'warm-water active range; care sheets cite water 24–28 °C'),
        max: measured(34, 'reptiles_small_fish_softshellThermal'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater rivers and lakes'),
        max: estimated(1, 'freshwater only'),
      },
      ph: {
        min: estimated(6, 'no data; typical freshwater range'),
        max: estimated(8.5, 'no data; typical freshwater range'),
      },
      nh3MaxMgL: REPTILE_NH3,
      no2MaxMgL: REPTILE_NO2,
      o2MinMgL: estimated(
        2,
        'pharyngeal and cutaneous aquatic respiration supplement lungs while buried',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(
          25 * YEAR_DAYS,
          'docs/09 25 years short (估)',
          'reptiles_small_fish_mdcSoftshell',
        ),
        typLow: estimated(
          30 * YEAR_DAYS,
          'docs/09 30 years typical (估)',
          'reptiles_small_fish_mdcSoftshell',
        ),
        typHigh: estimated(
          30 * YEAR_DAYS,
          'docs/09 30 years typical (估)',
          'reptiles_small_fish_mdcSoftshell',
        ),
        max: estimated(
          50 * YEAR_DAYS,
          'docs/09 50 years long (估)',
          'reptiles_small_fish_mdcSoftshell',
        ),
      },
      gameCapDays: estimated(18250, 'docs/09 game cap (估)'),
      maturityDays: {
        min: measured(4 * YEAR_DAYS, 'reptiles_small_fish_mdcSoftshell'),
        max: measured(9 * YEAR_DAYS, 'reptiles_small_fish_mdcSoftshell'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(3, 'reptiles_small_fish_mdcSoftshell'),
          max: measured(39, 'reptiles_small_fish_mdcSoftshell'),
        },
        intervalDays: {
          min: estimated(20, 'docs/09 up to 3 clutches per season'),
          max: estimated(365, 'docs/09 at least 1 clutch per year'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 solitary, aggressive'),
        max: estimated(1, 'docs/09 solitary, aggressive'),
      },
      max: estimated(1, 'docs/09 solitary'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: estimated(285, 'docs/09 285 L for males up to 2,270 L for large females'),
      adultsPerEnclosure: estimated(1, 'docs/09 solitary'),
    },
    diets: [
      { fish: 0.4, crustacean: 0.3, amphibian: 0.3 },
      { aquatic_invertebrate: 0.5, crustacean: 0.3, fish: 0.2 },
      { crustacean: 0.4, fish: 0.3, mollusc: 0.1, carrion: 0.2 },
      { fish: 0.5, aquatic_invertebrate: 0.3, food: 0.2 },
    ],
    preySizeRatio: { min: 0.0001, opt: 0.01, max: 0.1 },
    defenses: [
      ['burrowing', 'camouflage'],
      ['size', 'burrowing'],
      ['burrowing'],
      ['camouflage', 'hiding'],
    ],
    habitats: [
      ['infaunal', 'benthic'],
      ['benthic', 'shore'],
    ],
  },

  planktivore_fish: {
    kind: 'cohort',
    latinStem: 'Rasbor',
    nounZh: '波魚',
    flags: [],
    massMg: {
      min: derived(
        20,
        'reptiles_small_fish_froese2006',
        `docs/09 2 cm: ${FISH_LW} ${DRY_FRACTION}`,
      ),
      max: derived(
        2500,
        'reptiles_small_fish_froese2006',
        `docs/09 10 cm: ${FISH_LW} ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: measured(45, 'reptiles_small_fish_wikiHarlequinRasbora'),
    tolerance: {
      temperatureC: {
        min: measured(18, 'reptiles_small_fish_fishbaseGuppy'),
        max: measured(28, 'reptiles_small_fish_fishbaseGuppy'),
      },
      salinityPpt: {
        min: measured(0, 'reptiles_small_fish_fishbaseGuppy'),
        max: FISH_SALINITY_MAX,
      },
      ph: {
        min: measured(6, 'reptiles_small_fish_wikiHarlequinRasbora'),
        max: estimated(8.4, 'marine damselfish in reef water pH 8.1–8.4'),
      },
      nh3MaxMgL: FISH_NH3,
      no2MaxMgL: FISH_NO2_SENSITIVE,
      o2MinMgL: measured(3, 'reptiles_small_fish_epaDo1986'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(70, 'reptiles_small_fish_elifeKillifish'),
        typLow: estimated(1 * YEAR_DAYS, 'docs/09 guppy 1–2 years'),
        typHigh: estimated(3 * YEAR_DAYS, 'docs/09 neon tetra 2–3 years'),
        max: estimated(15 * YEAR_DAYS, 'docs/09 damselfish 8–15 years'),
      },
      gameCapDays: estimated(5475, 'docs/09 game cap; damselfish 15 years'),
      maturityDays: {
        min: measured(14, 'reptiles_small_fish_elifeKillifish'),
        max: estimated(365, 'docs/09 harlequin rasbora 9–12 months'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(20, 'reptiles_small_fish_fishbaseGuppy'),
          max: measured(100, 'reptiles_small_fish_wikiHarlequinRasbora'),
        },
        intervalDays: {
          min: estimated(7, 'egg-scattering tetras and rasboras spawn weekly when conditioned'),
          max: measured(28, 'reptiles_small_fish_fishbaseGuppy'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(6, 'docs/09 6–12 per 100 L (估)'),
        max: estimated(12, 'docs/09 6–12 per 100 L (估)'),
      },
      max: estimated(25, 'docs/09 20–30 per 100 L for fish ≤ 3 cm'),
      unit: 'individuals_per_100L',
    },
    diets: [
      { zooplankton: 0.8, protozoa: 0.1, food: 0.1 },
      { zooplankton: 0.6, aquatic_invertebrate: 0.2, flying_insect: 0.1, food: 0.1 },
      { zooplankton: 0.5, phytoplankton: 0.2, periphyton: 0.1, food: 0.2 },
      { zooplankton: 0.6, egg: 0.2, detritus: 0.1, food: 0.1 },
    ],
    preySizeRatio: { min: 0.000001, opt: 0.0001, max: 0.01 },
    defenses: [['schooling'], ['schooling', 'camouflage'], ['hiding'], ['schooling', 'hiding']],
    habitats: [['pelagic'], ['pelagic', 'surface']],
  },

  grazer_fish: {
    kind: 'cohort',
    latinStem: 'Otocinc',
    nounZh: '甲鯰',
    flags: [],
    massMg: {
      min: derived(
        35,
        'reptiles_small_fish_froese2006',
        `docs/09 2.4 cm: ${FISH_LW} ${DRY_FRACTION}`,
      ),
      max: derived(
        8400,
        'reptiles_small_fish_froese2006',
        `docs/09 15 cm: ${FISH_LW} ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: estimated(50, 'docs/09 2.4–15 cm; otocinclus to small bristlenose'),
    tolerance: {
      temperatureC: {
        min: estimated(20, 'tropical South American catfish and reef blennies'),
        max: estimated(28, 'tropical South American catfish and reef blennies'),
      },
      salinityPpt: {
        min: estimated(0, 'freshwater loricariids'),
        max: estimated(
          35,
          'marine algae blennies in full seawater',
          'reptiles_small_fish_fishbaseSalarias',
        ),
      },
      ph: {
        min: estimated(5.5, 'soft acidic South American waters'),
        max: estimated(8.4, 'marine reef water'),
      },
      nh3MaxMgL: FISH_NH3,
      no2MaxMgL: FISH_NO2_SENSITIVE,
      o2MinMgL: measured(3, 'reptiles_small_fish_epaDo1986'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(2 * YEAR_DAYS, 'docs/09 blenny 2–6 years'),
        typLow: estimated(3 * YEAR_DAYS, 'docs/09 otocinclus 3–5 years'),
        typHigh: estimated(5 * YEAR_DAYS, 'docs/09 otocinclus 3–5, bristlenose 4–5 years'),
        max: estimated(12 * YEAR_DAYS, 'docs/09 bristlenose up to 8–12 years'),
      },
      gameCapDays: estimated(4380, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(
          150,
          'otocinclus reach L50 18.7–20.1 mm SL in ~5 months',
          'reptiles_small_fish_otocinclusBrazJBiol',
        ),
        max: estimated(545, 'docs/09 blenny about 18 months'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(16, 'reptiles_small_fish_otocinclusBrazJBiol'),
          max: measured(202, 'reptiles_small_fish_otocinclusBrazJBiol'),
        },
        intervalDays: {
          min: estimated(14, 'year-round batch spawning'),
          max: estimated(30, 'year-round batch spawning'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1, 'docs/09 bristlenose and blenny 1 per 100 L'),
        max: estimated(6, 'docs/09 otocinclus 6 per 100 L'),
      },
      max: estimated(10, 'docs/09 otocinclus 10 per 100 L'),
      unit: 'individuals_per_100L',
    },
    diets: [
      { periphyton: 0.6, biofilm: 0.3, detritus: 0.1 },
      { periphyton: 0.5, macroalgae: 0.3, biofilm: 0.2 },
      { biofilm: 0.4, periphyton: 0.3, plant: 0.1, food: 0.2 },
      { periphyton: 0.5, detritus: 0.2, aquatic_invertebrate: 0.1, food: 0.2 },
    ],
    preySizeRatio: { min: 0.00001, opt: 0.001, max: 0.01 },
    defenses: [['armor'], ['armor', 'hiding'], ['camouflage', 'hiding'], ['armor', 'spines']],
    habitats: [
      ['benthic', 'epiphytic'],
      ['crevice', 'benthic'],
    ],
  },

  benthic_omnivore_fish: {
    kind: 'cohort',
    latinStem: 'Corydor',
    nounZh: '鼠魚',
    flags: [],
    massMg: {
      min: derived(
        260,
        'reptiles_small_fish_froese2006',
        `docs/09 4.7 cm: ${FISH_LW} ${DRY_FRACTION}`,
      ),
      max: derived(
        2500,
        'reptiles_small_fish_froese2006',
        `docs/09 10 cm: ${FISH_LW} ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: estimated(65, 'corydoras 6.6–7.1 cm SL max; gobies and loaches 5–10 cm'),
    tolerance: {
      temperatureC: {
        min: measured(18, 'reptiles_small_fish_fishbaseCorydoras'),
        max: measured(30, 'reptiles_small_fish_wikiKuhliLoach'),
      },
      salinityPpt: {
        min: measured(0, 'reptiles_small_fish_fishbaseCorydoras'),
        max: estimated(
          35,
          'amphidromous and marine gobies',
          'reptiles_small_fish_fishbaseRhinogobius',
        ),
      },
      ph: {
        min: measured(5.5, 'reptiles_small_fish_wikiKuhliLoach'),
        max: estimated(8.4, 'marine gobies in reef water'),
      },
      nh3MaxMgL: FISH_NH3,
      no2MaxMgL: FISH_NO2_TOLERANT,
      o2MinMgL: estimated(
        2.5,
        'corydoras and loaches gulp air for intestinal respiration',
        'reptiles_small_fish_epaDo1986',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(2 * YEAR_DAYS, 'docs/09 gobies 2–5 years (估)'),
        typLow: estimated(5 * YEAR_DAYS, 'docs/09 corydoras 5–10 years'),
        typHigh: measured(10 * YEAR_DAYS, 'reptiles_small_fish_wikiKuhliLoach'),
        max: measured(14 * YEAR_DAYS, 'reptiles_small_fish_wikiKuhliLoach'),
      },
      gameCapDays: estimated(5475, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(180, 'docs/09 6–18 months'),
        max: estimated(545, 'docs/09 6–18 months'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(46, 'reptiles_small_fish_amazonasGoby'),
          max: measured(100, 'reptiles_small_fish_fishbaseCorydoras'),
        },
        intervalDays: {
          min: estimated(14, 'well-fed corydoras spawn every 2–4 weeks'),
          max: measured(28, 'reptiles_small_fish_amazonasGoby'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(6, 'docs/09 6–8 per 100 L (估)'),
        max: estimated(8, 'docs/09 6–8 per 100 L (估)'),
      },
      max: estimated(12, 'docs/09 12 per 100 L (估)'),
      unit: 'individuals_per_100L',
    },
    diets: [
      { detritus: 0.3, aquatic_invertebrate: 0.4, food: 0.3 },
      { aquatic_invertebrate: 0.5, crustacean: 0.2, detritus: 0.2, food: 0.1 },
      { detritus: 0.3, biofilm: 0.2, aquatic_invertebrate: 0.3, plant: 0.1, food: 0.1 },
      { aquatic_invertebrate: 0.4, mollusc: 0.2, egg: 0.2, detritus: 0.2 },
    ],
    preySizeRatio: { min: 0.00001, opt: 0.001, max: 0.05 },
    defenses: [
      ['spines', 'armor'],
      ['burrowing', 'hiding'],
      ['camouflage', 'hiding'],
      ['mucus', 'burrowing'],
    ],
    habitats: [['benthic'], ['benthic', 'infaunal']],
  },

  piscivore_fish: {
    kind: 'cohort',
    latinStem: 'Dendrochir',
    nounZh: '蓑鮋',
    flags: [],
    massMg: {
      min: derived(
        1100,
        'reptiles_small_fish_froese2006',
        `docs/09 7.6 cm: ${FISH_LW} ${DRY_FRACTION}`,
      ),
      max: derived(
        20000,
        'reptiles_small_fish_froese2006',
        `docs/09 20 cm: ${FISH_LW} ${DRY_FRACTION}`,
      ),
    },
    typicalLengthMm: estimated(130, 'between pike cichlid 76 mm SL and dwarf lionfish 178 mm'),
    tolerance: {
      temperatureC: {
        min: measured(22, 'reptiles_small_fish_fishbasePterois'),
        max: measured(28, 'reptiles_small_fish_fishbasePterois'),
      },
      salinityPpt: {
        min: estimated(
          0,
          'freshwater pike cichlids',
          'reptiles_small_fish_seriouslyFishCrenicichla',
        ),
        max: derived(
          34,
          'reptiles_small_fish_liveaquariaDwarfLionfish',
          'specific gravity 1.025 at 25 °C ≈ 34 ppt',
        ),
      },
      ph: {
        min: measured(5, 'reptiles_small_fish_seriouslyFishCrenicichla'),
        max: measured(8.4, 'reptiles_small_fish_liveaquariaDwarfLionfish'),
      },
      nh3MaxMgL: FISH_NH3,
      no2MaxMgL: FISH_NO2_SENSITIVE,
      o2MinMgL: estimated(
        4,
        'active predators and reef fish need well-oxygenated water',
        'reptiles_small_fish_epaDo1986',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(4 * YEAR_DAYS, 'docs/09 lower end of 5–8 years'),
        typLow: estimated(5 * YEAR_DAYS, 'docs/09 dwarf lionfish and pike cichlid 5–8 years'),
        typHigh: estimated(8 * YEAR_DAYS, 'docs/09 dwarf lionfish and pike cichlid 5–8 years'),
        max: measured(10 * YEAR_DAYS, 'reptiles_small_fish_fishbasePterois'),
      },
      gameCapDays: measured(3650, 'reptiles_small_fish_fishbasePterois'),
      maturityDays: {
        min: estimated(300, 'docs/09 about 1 year (估)'),
        max: estimated(450, 'docs/09 about 1 year (估)'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(25, 'reptiles_small_fish_seriouslyFishCrenicichla'),
          max: measured(50, 'reptiles_small_fish_seriouslyFishCrenicichla'),
        },
        intervalDays: {
          min: estimated(30, 'brood-guarding cichlid respawns after fry disperse'),
          max: estimated(60, 'brood-guarding cichlid respawns after fry disperse'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: derived(
          0.53,
          'reptiles_small_fish_liveaquariaDwarfLionfish',
          '1 fish per 50 gal (189 L) = 100 / 189',
        ),
        max: derived(
          0.65,
          'reptiles_small_fish_seriouslyFishCrenicichla',
          '1 fish per 154 L = 100 / 154',
        ),
      },
      max: estimated(1, 'docs/09 maximum 1 per 100 L'),
      unit: 'individuals_per_100L',
    },
    minEnclosure: {
      lengthCm: measured(90, 'reptiles_small_fish_seriouslyFishCrenicichla'),
      waterVolumeL: measured(154, 'reptiles_small_fish_seriouslyFishCrenicichla'),
    },
    diets: [
      { fish: 0.7, crustacean: 0.3 },
      { crustacean: 0.6, fish: 0.4 },
      { fish: 0.5, crustacean: 0.2, aquatic_invertebrate: 0.3 },
      { fish: 0.5, aquatic_invertebrate: 0.2, terrestrial_invertebrate: 0.2, food: 0.1 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.03, max: 0.15 },
    defenses: [['venom', 'spines'], ['camouflage', 'hiding'], ['size'], ['venom', 'camouflage']],
    habitats: [['pelagic'], ['crevice', 'benthic']],
  },
};
