import type { ArchetypeData, SourcedRange } from '../archetype';
import { derived, estimated, measured, type Sourced } from '../sourced';
import type { SourceId } from '../sources';
import type { ArchetypeGroups } from './groupTypes';

const FISH_DRY_TO_WET = 0.25;
const MG_PER_KG = 1_000_000;
const DAYS_PER_YEAR = 365;

const range = (min: Sourced, max: Sourced): SourcedRange => ({ min, max });

const dryMass = (wetKg: number, source: SourceId): Sourced =>
  derived(
    Math.round(wetKg * MG_PER_KG * FISH_DRY_TO_WET),
    source,
    `${wetKg} kg wet mass × 0.25 fish dry:wet ratio`,
  );

const dryMassEstimate = (wetKg: number, note: string, source?: SourceId): Sourced =>
  estimated(
    Math.round(wetKg * MG_PER_KG * FISH_DRY_TO_WET),
    `${note}; ${wetKg} kg wet × 0.25 fish dry:wet ratio`,
    source,
  );

const years = (y: number, source: SourceId): Sourced =>
  measured(Math.round(y * DAYS_PER_YEAR), source);

const yearsEstimate = (y: number, note: string, source?: SourceId): Sourced =>
  estimated(Math.round(y * DAYS_PER_YEAR), note, source);

const freshwaterSaltMax = (ppt: number): Sourced =>
  estimated(ppt, 'stenohaline freshwater species; brief tolerance of slight salinity only');

const GENERIC_NH3 = 'no species ammonia data; generic tropical aquarium fish threshold';
const GENERIC_NO2 = 'no species nitrite data; generic value scaled to taxon sensitivity';
const GENERIC_O2 = 'no species hypoxia data; non-air-breathing tropical fish';
const DOCS09_ESTIMATE = 'docs/09 §10 (估)';

/** docs/02, docs/09: arowana, gar, bichir, snakehead, cichlid_pursuit_predator, oscar, pacu, silver_dollar, koi, goldfish, large_pleco, giant_catfish, freshwater_stingray, fire_eel, scat */
export const LARGE_FRESHWATER: Readonly<
  Partial<Record<ArchetypeGroups['large_freshwater'], ArchetypeData>>
> = {
  arowana: {
    kind: 'cohort',
    latinStem: 'Osteogl',
    nounZh: '龍魚',
    flags: ['territorial'],
    massMg: range(
      dryMass(3, 'large_freshwater_wikiSilverArowana'),
      dryMass(6, 'large_freshwater_fishbaseOsteoglossum'),
    ),
    typicalLengthMm: measured(900, 'large_freshwater_fishbaseOsteoglossum'),
    tolerance: {
      temperatureC: range(
        measured(24, 'large_freshwater_fishbaseOsteoglossum'),
        measured(30, 'large_freshwater_fishbaseOsteoglossum'),
      ),
      salinityPpt: range(
        measured(0, 'large_freshwater_fishbaseOsteoglossum'),
        freshwaterSaltMax(3),
      ),
      ph: range(
        estimated(6, 'Amazon floodplain black- and whitewater lakes'),
        estimated(7.5, 'Amazon floodplain black- and whitewater lakes'),
      ),
      nh3MaxMgL: estimated(0.05, GENERIC_NH3),
      no2MaxMgL: estimated(0.5, GENERIC_NO2),
      o2MinMgL: estimated(
        2,
        'floodplain-lake species described as adapting to low oxygen',
        'large_freshwater_fishbaseOsteoglossum',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(10, 'large_freshwater_wikiSilverArowana'),
        typLow: years(15, 'large_freshwater_wikiSilverArowana'),
        typHigh: years(15, 'large_freshwater_wikiSilverArowana'),
        max: years(20, 'large_freshwater_wikiSilverArowana'),
      },
      gameCapDays: measured(7300, 'large_freshwater_wikiSilverArowana'),
      maturityDays: range(yearsEstimate(3, DOCS09_ESTIMATE), yearsEstimate(4, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'brood',
        clutch: range(
          measured(12, 'large_freshwater_wikiSilverArowana'),
          measured(30, 'large_freshwater_wikiSilverArowana'),
        ),
        intervalDays: range(
          estimated(180, 'male mouthbroods ≈ 6 weeks; seasonal flood-pulse spawner'),
          estimated(365, 'male mouthbroods ≈ 6 weeks; seasonal flood-pulse spawner'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(
        measured(1, 'large_freshwater_wikiSilverArowana'),
        measured(1, 'large_freshwater_wikiSilverArowana'),
      ),
      max: measured(1, 'large_freshwater_wikiSilverArowana'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(240, 'large_freshwater_wikiSilverArowana'),
      waterVolumeL: measured(950, 'large_freshwater_wikiSilverArowana'),
      adultsPerEnclosure: measured(1, 'large_freshwater_wikiSilverArowana'),
    },
    diets: [
      { flying_insect: 0.4, terrestrial_invertebrate: 0.2, fish: 0.3, amphibian: 0.1 },
      { fish: 0.6, flying_insect: 0.2, crustacean: 0.1, amphibian: 0.1 },
      { terrestrial_invertebrate: 0.4, flying_insect: 0.3, fish: 0.2, food: 0.1 },
      { food: 0.5, fish: 0.3, flying_insect: 0.2 },
    ],
    preySizeRatio: { min: 0.0001, opt: 0.01, max: 0.1 },
    defenses: [['size'], ['armor'], ['size', 'armor'], ['camouflage']],
    habitats: [['surface', 'pelagic'], ['surface']],
  },

  gar: {
    kind: 'cohort',
    latinStem: 'Lepisost',
    nounZh: '雀鱔',
    flags: ['air_breather'],
    massMg: range(
      dryMass(1, 'large_freshwater_wikiLepisosteus'),
      dryMass(4.4, 'large_freshwater_fishbaseLepisosteus'),
    ),
    typicalLengthMm: measured(1000, 'large_freshwater_fishbaseLepisosteus'),
    tolerance: {
      temperatureC: range(
        measured(12, 'large_freshwater_fishbaseLepisosteus'),
        estimated(
          30,
          'southern US populations occupy summer waters near 30 °C; FishBase lists 12–20 °C',
          'large_freshwater_fishbaseLepisosteus',
        ),
      ),
      salinityPpt: range(
        measured(0, 'large_freshwater_fishbaseLepisosteus'),
        estimated(
          20,
          'recorded in brackish water; upper limit capped below marine',
          'large_freshwater_fishbaseLepisosteus',
        ),
      ),
      ph: range(
        estimated(6.5, 'lowland rivers, bayous and swamps'),
        estimated(8.5, 'lowland rivers, bayous and swamps'),
      ),
      nh3MaxMgL: estimated(0.1, `${GENERIC_NH3}; air-breathing lowers gill exposure`),
      no2MaxMgL: estimated(1, GENERIC_NO2),
      o2MinMgL: estimated(
        1,
        'facultative air-breather; survives hypoxic backwaters',
        'large_freshwater_fishbaseLepisosteus',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(10, 'large_freshwater_wikiLepisosteus'),
        typLow: years(18, 'large_freshwater_fishbaseLepisosteus'),
        typHigh: years(18, 'large_freshwater_fishbaseLepisosteus'),
        max: years(22, 'large_freshwater_wikiLepisosteus'),
      },
      gameCapDays: measured(8030, 'large_freshwater_wikiLepisosteus'),
      maturityDays: range(
        years(3, 'large_freshwater_wikiLepisosteus'),
        years(6, 'large_freshwater_wikiLepisosteus'),
      ),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          estimated(1000, 'adhesive eggs, several thousand per female (docs/09)'),
          estimated(10000, 'adhesive eggs, several thousand per female (docs/09)'),
        ),
        intervalDays: range(
          estimated(365, 'single spring spawning season'),
          estimated(365, 'single spring spawning season'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(
        measured(1, 'large_freshwater_wikiLepisosteus'),
        measured(3, 'large_freshwater_wikiLepisosteus'),
      ),
      max: measured(3, 'large_freshwater_wikiLepisosteus'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(150, 'large_freshwater_wikiLepisosteus'),
      waterVolumeL: measured(680, 'large_freshwater_wikiLepisosteus'),
      adultsPerEnclosure: measured(3, 'large_freshwater_wikiLepisosteus'),
    },
    diets: [
      { fish: 0.8, crustacean: 0.2 },
      { fish: 0.6, crustacean: 0.3, amphibian: 0.1 },
      { fish: 0.5, crustacean: 0.2, aquatic_invertebrate: 0.2, carrion: 0.1 },
      { food: 0.5, fish: 0.5 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.02, max: 0.2 },
    defenses: [['armor'], ['armor', 'size'], ['camouflage'], ['armor', 'toxin']],
    habitats: [['surface', 'pelagic'], ['pelagic']],
  },

  bichir: {
    kind: 'cohort',
    latinStem: 'Polypter',
    nounZh: '多鰭魚',
    flags: ['air_breather'],
    massMg: range(
      dryMass(1, 'large_freshwater_seriouslyFishPolypterus'),
      dryMass(3.4, 'large_freshwater_fishbasePolypterus'),
    ),
    typicalLengthMm: estimated(
      600,
      'adults 40–75 cm; maximum 75 cm SL',
      'large_freshwater_seriouslyFishPolypterus',
    ),
    tolerance: {
      temperatureC: range(
        measured(22, 'large_freshwater_seriouslyFishPolypterus'),
        measured(27, 'large_freshwater_seriouslyFishPolypterus'),
      ),
      salinityPpt: range(measured(0, 'large_freshwater_fishbasePolypterus'), freshwaterSaltMax(3)),
      ph: range(
        measured(6, 'large_freshwater_seriouslyFishPolypterus'),
        measured(8, 'large_freshwater_seriouslyFishPolypterus'),
      ),
      nh3MaxMgL: estimated(0.1, `${GENERIC_NH3}; air-breathing lowers gill exposure`),
      no2MaxMgL: estimated(1, GENERIC_NO2),
      o2MinMgL: estimated(1, 'air-breathing swamp species', 'large_freshwater_fishbasePolypterus'),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(10, 'large_freshwater_seriouslyFishPolypterus'),
        typLow: years(15, 'large_freshwater_seriouslyFishPolypterus'),
        typHigh: years(15, 'large_freshwater_seriouslyFishPolypterus'),
        max: years(20, 'large_freshwater_seriouslyFishPolypterus'),
      },
      gameCapDays: measured(7300, 'large_freshwater_seriouslyFishPolypterus'),
      maturityDays: range(yearsEstimate(3, DOCS09_ESTIMATE), yearsEstimate(4, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          estimated(200, 'egg scatterer, hundreds of eggs (docs/09 估)'),
          estimated(1000, 'egg scatterer, hundreds of eggs (docs/09 估)'),
        ),
        intervalDays: range(
          estimated(90, 'rainy-season spawner; rarely bred in aquaria'),
          estimated(365, 'rainy-season spawner; rarely bred in aquaria'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: range(
        measured(1, 'large_freshwater_seriouslyFishPolypterus'),
        measured(3, 'large_freshwater_seriouslyFishPolypterus'),
      ),
      max: measured(3, 'large_freshwater_seriouslyFishPolypterus'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(210, 'large_freshwater_seriouslyFishPolypterus'),
      waterVolumeL: measured(2300, 'large_freshwater_seriouslyFishPolypterus'),
      adultsPerEnclosure: measured(3, 'large_freshwater_seriouslyFishPolypterus'),
    },
    diets: [
      { fish: 0.4, aquatic_invertebrate: 0.3, crustacean: 0.3 },
      { aquatic_invertebrate: 0.5, crustacean: 0.3, mollusc: 0.2 },
      { fish: 0.6, crustacean: 0.2, amphibian: 0.2 },
      { food: 0.5, aquatic_invertebrate: 0.3, carrion: 0.2 },
    ],
    preySizeRatio: { min: 0.0005, opt: 0.01, max: 0.15 },
    defenses: [['armor'], ['armor', 'hiding'], ['hiding'], ['armor', 'size']],
    habitats: [['benthic', 'crevice'], ['benthic']],
  },

  snakehead: {
    kind: 'cohort',
    latinStem: 'Channa',
    nounZh: '鱧',
    flags: ['air_breather', 'territorial'],
    massMg: range(
      dryMassEstimate(3, '≈ 90 cm adult (docs/09 90–130 cm)'),
      dryMass(20, 'large_freshwater_fishbaseChanna'),
    ),
    typicalLengthMm: estimated(
      900,
      'adults 90–130 cm; FishBase common length 50 cm SL',
      'large_freshwater_fishbaseChanna',
    ),
    tolerance: {
      temperatureC: range(
        measured(20, 'large_freshwater_seriouslyFishChanna'),
        measured(30, 'large_freshwater_seriouslyFishChanna'),
      ),
      salinityPpt: range(measured(0, 'large_freshwater_fishbaseChanna'), freshwaterSaltMax(5)),
      ph: range(
        measured(6, 'large_freshwater_seriouslyFishChanna'),
        measured(8, 'large_freshwater_seriouslyFishChanna'),
      ),
      nh3MaxMgL: derived(
        0.54,
        'large_freshwater_snakeheadAmmonia',
        'congener Channa striatus prolonged-exposure ceiling 0.54 mg NH3-N/L at pH 8 applied to the genus',
      ),
      no2MaxMgL: derived(
        23.9,
        'large_freshwater_snakeheadNitrite',
        'Channa striata 96-h LC50 238.8 mg NO2-N/L × 0.1 acute-to-limit factor',
      ),
      o2MinMgL: estimated(
        0.5,
        'obligate air-breather; aquatic O2 only limits gill function',
        'large_freshwater_fishbaseChanna',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimate(10, DOCS09_ESTIMATE),
        typLow: yearsEstimate(15, DOCS09_ESTIMATE),
        typHigh: yearsEstimate(15, DOCS09_ESTIMATE),
        max: yearsEstimate(20, DOCS09_ESTIMATE),
      },
      gameCapDays: estimated(7300, DOCS09_ESTIMATE),
      maturityDays: range(
        years(2, 'large_freshwater_seriouslyFishChanna'),
        yearsEstimate(3, DOCS09_ESTIMATE),
      ),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          estimated(1000, 'floating eggs, several thousand; biparental guarding (docs/09)'),
          estimated(5000, 'floating eggs, several thousand; biparental guarding (docs/09)'),
        ),
        intervalDays: range(
          estimated(60, 'repeat spawner in warm season'),
          estimated(180, 'repeat spawner in warm season'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: range(estimated(1, DOCS09_ESTIMATE), estimated(1, DOCS09_ESTIMATE)),
      max: estimated(1, 'solitary, extremely aggressive adult (docs/09)'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(
        300,
        'docs/09; Seriously Fish requires at least 2 m',
        'large_freshwater_seriouslyFishChanna',
      ),
      waterVolumeL: estimated(2000, 'docs/09 §10', 'large_freshwater_seriouslyFishChanna'),
      adultsPerEnclosure: estimated(1, 'docs/09 §10', 'large_freshwater_seriouslyFishChanna'),
    },
    diets: [
      { fish: 0.8, crustacean: 0.1, amphibian: 0.1 },
      { fish: 0.6, amphibian: 0.2, terrestrial_invertebrate: 0.1, crustacean: 0.1 },
      { fish: 0.7, aquatic_invertebrate: 0.3 },
      { food: 0.4, fish: 0.6 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.03, max: 0.3 },
    defenses: [['size'], ['size', 'camouflage'], ['camouflage', 'hiding'], ['mucus', 'size']],
    habitats: [['surface', 'pelagic'], ['benthic']],
  },

  cichlid_pursuit_predator: {
    kind: 'cohort',
    latinStem: 'Cichla',
    nounZh: '孔雀鱸',
    flags: ['territorial'],
    massMg: range(
      dryMassEstimate(0.5, '≈ 30 cm adult (docs/09 30–99 cm)'),
      dryMass(6.8, 'large_freshwater_fishbaseCichla'),
    ),
    typicalLengthMm: estimated(
      600,
      'adults 30–99 cm; C. ocellaris max 75 cm SL',
      'large_freshwater_seriouslyFishCichla',
    ),
    tolerance: {
      temperatureC: range(
        measured(24, 'large_freshwater_seriouslyFishCichla'),
        measured(27, 'large_freshwater_seriouslyFishCichla'),
      ),
      salinityPpt: range(
        measured(0, 'large_freshwater_fishbaseCichla'),
        estimated(5, 'FishBase lists brackish occurrence', 'large_freshwater_fishbaseCichla'),
      ),
      ph: range(
        measured(6.5, 'large_freshwater_seriouslyFishCichla'),
        measured(7, 'large_freshwater_seriouslyFishCichla'),
      ),
      nh3MaxMgL: estimated(0.05, GENERIC_NH3),
      no2MaxMgL: derived(
        0.8,
        'large_freshwater_nitriteReview',
        'cichlid Oreochromis niloticus (≈ 90 g) 96-h LC50 8 mg N/L × 0.1 no-effect fraction',
      ),
      o2MinMgL: estimated(4, `${GENERIC_O2}; active pursuit predator of rapids`),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimate(8, DOCS09_ESTIMATE),
        typLow: yearsEstimate(10, DOCS09_ESTIMATE),
        typHigh: yearsEstimate(10, DOCS09_ESTIMATE),
        max: yearsEstimate(15, DOCS09_ESTIMATE),
      },
      gameCapDays: estimated(5475, DOCS09_ESTIMATE),
      maturityDays: range(yearsEstimate(1, DOCS09_ESTIMATE), yearsEstimate(2, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          derived(
            4500,
            'large_freshwater_fishbaseCichla',
            '9,000 eggs per kg × 0.5 kg small adult',
          ),
          estimated(10000, 'docs/09 §10 (估)', 'large_freshwater_fishbaseCichla'),
        ),
        intervalDays: range(
          measured(60, 'large_freshwater_fishbaseCichla'),
          estimated(90, 'peak at onset of rainy season', 'large_freshwater_fishbaseCichla'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: range(
        measured(1, 'large_freshwater_seriouslyFishCichla'),
        measured(2, 'large_freshwater_seriouslyFishCichla'),
      ),
      max: measured(2, 'large_freshwater_seriouslyFishCichla'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: derived(305, 'large_freshwater_seriouslyFishCichla', '10 ft × 30.48 cm'),
      waterVolumeL: derived(
        3400,
        'large_freshwater_seriouslyFishCichla',
        '10 × 3 × 4 ft = 120 ft³ × 28.3 L',
      ),
      adultsPerEnclosure: measured(2, 'large_freshwater_seriouslyFishCichla'),
    },
    diets: [
      { fish: 1 },
      { fish: 0.8, crustacean: 0.2 },
      { fish: 0.7, aquatic_invertebrate: 0.2, terrestrial_invertebrate: 0.1 },
      { food: 0.4, fish: 0.6 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.03, max: 0.25 },
    defenses: [['size'], ['schooling', 'size'], ['camouflage'], ['size', 'spines']],
    habitats: [['pelagic'], ['pelagic', 'crevice']],
  },

  oscar: {
    kind: 'cohort',
    latinStem: 'Astronot',
    nounZh: '星麗魚',
    flags: ['territorial'],
    massMg: range(
      dryMassEstimate(0.3, '≈ 25 cm adult (docs/09 25–45 cm)'),
      dryMass(1.6, 'large_freshwater_fishbaseAstronotus'),
    ),
    typicalLengthMm: measured(240, 'large_freshwater_fishbaseAstronotus'),
    tolerance: {
      temperatureC: range(
        measured(22, 'large_freshwater_fishbaseAstronotus'),
        estimated(
          30,
          'Amazon floodplain waters reach 30 °C; FishBase upper 25 °C is a husbandry figure',
          'large_freshwater_fishbaseAstronotus',
        ),
      ),
      salinityPpt: range(measured(0, 'large_freshwater_fishbaseAstronotus'), freshwaterSaltMax(5)),
      ph: range(
        measured(6, 'large_freshwater_fishbaseAstronotus'),
        measured(8, 'large_freshwater_fishbaseAstronotus'),
      ),
      nh3MaxMgL: estimated(0.05, GENERIC_NH3),
      no2MaxMgL: derived(
        0.8,
        'large_freshwater_nitriteReview',
        'cichlid Oreochromis niloticus (≈ 90 g) 96-h LC50 8 mg N/L × 0.1 no-effect fraction',
      ),
      o2MinMgL: derived(
        2.4,
        'large_freshwater_oscarHypoxia',
        'Pcrit 46 Torr ÷ 155 Torr air-saturated PO2 × 8.1 mg/L O2 saturation at 26 °C',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(10, 'large_freshwater_fishbaseAstronotus'),
        typLow: years(12, 'large_freshwater_fishbaseAstronotus'),
        typHigh: years(12, 'large_freshwater_fishbaseAstronotus'),
        max: years(20, 'large_freshwater_fishbaseAstronotus'),
      },
      gameCapDays: measured(7300, 'large_freshwater_fishbaseAstronotus'),
      maturityDays: range(yearsEstimate(1, DOCS09_ESTIMATE), yearsEstimate(1.5, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          measured(1000, 'large_freshwater_fishbaseAstronotus'),
          measured(2000, 'large_freshwater_fishbaseAstronotus'),
        ),
        intervalDays: range(
          measured(28, 'large_freshwater_fishbaseAstronotus'),
          measured(42, 'large_freshwater_fishbaseAstronotus'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: range(
        measured(1, 'large_freshwater_fishbaseAstronotus'),
        measured(2, 'large_freshwater_fishbaseAstronotus'),
      ),
      max: measured(2, 'large_freshwater_fishbaseAstronotus'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(120, 'large_freshwater_fishbaseAstronotus'),
      waterVolumeL: measured(285, 'large_freshwater_fishbaseAstronotus'),
      adultsPerEnclosure: measured(2, 'large_freshwater_fishbaseAstronotus'),
    },
    diets: [
      { aquatic_invertebrate: 0.4, fish: 0.3, crustacean: 0.3 },
      { food: 0.6, aquatic_invertebrate: 0.2, fish: 0.2 },
      { crustacean: 0.3, mollusc: 0.2, aquatic_invertebrate: 0.3, fruit: 0.2 },
      { fish: 0.5, terrestrial_invertebrate: 0.2, aquatic_invertebrate: 0.2, plant: 0.1 },
    ],
    preySizeRatio: { min: 0.0001, opt: 0.005, max: 0.1 },
    defenses: [['size'], ['spines'], ['camouflage'], ['hiding', 'spines']],
    habitats: [
      ['benthic', 'pelagic'],
      ['pelagic', 'crevice'],
    ],
  },

  pacu: {
    kind: 'cohort',
    latinStem: 'Colossom',
    nounZh: '白鯧',
    flags: [],
    massMg: range(
      dryMassEstimate(5, '≈ 70 cm adult (docs/09 70–108 cm)'),
      dryMass(40, 'large_freshwater_fishbaseColossoma'),
    ),
    typicalLengthMm: measured(700, 'large_freshwater_fishbaseColossoma'),
    tolerance: {
      temperatureC: range(
        measured(22, 'large_freshwater_fishbaseColossoma'),
        measured(28, 'large_freshwater_fishbaseColossoma'),
      ),
      salinityPpt: range(measured(0, 'large_freshwater_fishbaseColossoma'), freshwaterSaltMax(5)),
      ph: range(
        measured(5, 'large_freshwater_fishbaseColossoma'),
        measured(7.8, 'large_freshwater_fishbaseColossoma'),
      ),
      nh3MaxMgL: derived(
        0.13,
        'large_freshwater_tambacuAmmonia',
        'tambacu 96-h LC50 1.63 mg NH3/L × 14/17 (as N) × 0.1 application factor',
      ),
      no2MaxMgL: derived(
        0.09,
        'large_freshwater_matrinxaNitrite',
        'characiform Brycon cephalus 96-h LC50 0.86 mg NO2-N/L × 0.1 no-effect fraction',
      ),
      o2MinMgL: derived(
        1,
        'large_freshwater_tambaquiHypoxia',
        '72 h at 0.92 mg/L without mortality, rounded to 1.0',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(15, 'large_freshwater_wikiTambaqui'),
        typLow: years(40, 'large_freshwater_wikiTambaqui'),
        typHigh: years(40, 'large_freshwater_wikiTambaqui'),
        max: years(65, 'large_freshwater_wikiTambaqui'),
      },
      gameCapDays: measured(23725, 'large_freshwater_wikiTambaqui'),
      maturityDays: range(
        years(2, 'large_freshwater_wikiTambaqui'),
        years(2.5, 'large_freshwater_wikiTambaqui'),
      ),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          estimated(300000, 'smaller females; annual fecundity scales with mass'),
          measured(1000000, 'large_freshwater_wikiTambaqui'),
        ),
        intervalDays: range(
          measured(365, 'large_freshwater_wikiTambaqui'),
          measured(365, 'large_freshwater_wikiTambaqui'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(
        measured(1, 'large_freshwater_wikiTambaqui'),
        measured(1, 'large_freshwater_wikiTambaqui'),
      ),
      max: measured(1, 'large_freshwater_wikiTambaqui'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(300, 'large_freshwater_wikiTambaqui'),
      waterVolumeL: measured(2300, 'large_freshwater_wikiTambaqui'),
      adultsPerEnclosure: measured(1, 'large_freshwater_wikiTambaqui'),
    },
    diets: [
      { fruit: 0.6, plant: 0.2, zooplankton: 0.2 },
      { zooplankton: 0.4, aquatic_invertebrate: 0.2, fruit: 0.3, detritus: 0.1 },
      { plant: 0.5, fruit: 0.3, mollusc: 0.2 },
      { food: 0.7, fruit: 0.2, plant: 0.1 },
    ],
    preySizeRatio: { min: 0.000001, opt: 0.0001, max: 0.005 },
    defenses: [['size'], ['schooling'], ['size', 'schooling'], ['hiding']],
    habitats: [['pelagic'], ['pelagic', 'surface']],
  },

  silver_dollar: {
    kind: 'cohort',
    latinStem: 'Metynn',
    nounZh: '銀板',
    flags: [],
    massMg: range(
      dryMassEstimate(0.08, '≈ 12 cm adult (docs/09 14–18 cm, 0.1–0.2 kg)'),
      dryMass(0.153, 'large_freshwater_fishbaseMetynnis'),
    ),
    typicalLengthMm: measured(140, 'large_freshwater_fishbaseMetynnis'),
    tolerance: {
      temperatureC: range(
        measured(24, 'large_freshwater_fishbaseMetynnis'),
        measured(28, 'large_freshwater_fishbaseMetynnis'),
      ),
      salinityPpt: range(measured(0, 'large_freshwater_fishbaseMetynnis'), freshwaterSaltMax(2)),
      ph: range(
        measured(5, 'large_freshwater_fishbaseMetynnis'),
        measured(7, 'large_freshwater_fishbaseMetynnis'),
      ),
      nh3MaxMgL: estimated(
        0.08,
        'serrasalmid relative of tambacu (0.13 mg N/L); small body taken as more sensitive',
        'large_freshwater_tambacuAmmonia',
      ),
      no2MaxMgL: derived(
        0.09,
        'large_freshwater_matrinxaNitrite',
        'characiform Brycon cephalus 96-h LC50 0.86 mg NO2-N/L × 0.1 no-effect fraction',
      ),
      o2MinMgL: estimated(3, GENERIC_O2),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(5, 'large_freshwater_wikiSilverDollar'),
        typLow: years(10, 'large_freshwater_wikiSilverDollar'),
        typHigh: years(10, 'large_freshwater_wikiSilverDollar'),
        max: years(15, 'large_freshwater_wikiSilverDollar'),
      },
      gameCapDays: measured(5475, 'large_freshwater_wikiSilverDollar'),
      maturityDays: range(estimated(300, DOCS09_ESTIMATE), estimated(400, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          measured(1000, 'large_freshwater_wikiSilverDollar'),
          measured(2000, 'large_freshwater_wikiSilverDollar'),
        ),
        intervalDays: range(
          estimated(30, 'egg scatterer; repeat spawning in captivity'),
          estimated(90, 'egg scatterer; repeat spawning in captivity'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: range(
        measured(5, 'large_freshwater_wikiSilverDollar'),
        estimated(8, 'docs/09 §10: at most 8 per 285 L (估)'),
      ),
      max: estimated(8, 'docs/09 §10: at most 8 per 285 L (估)'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(150, 'large_freshwater_wikiSilverDollar'),
      waterVolumeL: measured(285, 'large_freshwater_wikiSilverDollar'),
      adultsPerEnclosure: estimated(8, 'docs/09 §10: at most 8 per 285 L (估)'),
    },
    diets: [
      { plant: 0.8, periphyton: 0.2 },
      { plant: 0.6, fruit: 0.2, aquatic_invertebrate: 0.2 },
      { plant: 0.5, food: 0.3, periphyton: 0.2 },
      { plant: 0.4, zooplankton: 0.3, terrestrial_invertebrate: 0.3 },
    ],
    preySizeRatio: { min: 0.00001, opt: 0.001, max: 0.01 },
    defenses: [['schooling'], ['schooling', 'hiding'], ['hiding'], ['size', 'schooling']],
    habitats: [['pelagic'], ['pelagic', 'surface']],
  },

  koi: {
    kind: 'cohort',
    latinStem: 'Cyprinus',
    nounZh: '鯉',
    flags: [],
    massMg: range(
      dryMassEstimate(2, '≈ 45 cm adult (docs/09 45–90 cm)'),
      dryMassEstimate(
        10,
        'large pond koi (docs/09); wild carp reach 40.1 kg',
        'large_freshwater_fishbaseCyprinus',
      ),
    ),
    typicalLengthMm: estimated(600, 'docs/09 45–90 cm', 'large_freshwater_pondTradeKoi'),
    tolerance: {
      temperatureC: range(
        measured(3, 'large_freshwater_fishbaseCyprinus'),
        measured(35, 'large_freshwater_fishbaseCyprinus'),
      ),
      salinityPpt: range(
        measured(0, 'large_freshwater_fishbaseCyprinus'),
        estimated(10, 'FishBase lists brackish occurrence', 'large_freshwater_fishbaseCyprinus'),
      ),
      ph: range(
        measured(6.5, 'large_freshwater_fishbaseCyprinus'),
        measured(9, 'large_freshwater_fishbaseCyprinus'),
      ),
      nh3MaxMgL: derived(
        0.1,
        'large_freshwater_carpAmmonia',
        'maximum sublethal 0.12 mg NH3/L × 14/17 (as N)',
      ),
      no2MaxMgL: estimated(
        2,
        'cyprinids considerably less nitrite-sensitive than salmonids and catfish',
        'large_freshwater_nitriteReview',
      ),
      o2MinMgL: estimated(
        1,
        'hypoxia-tolerant; gulps surface air below 0.5 mg/L, feeding falls below 3 mg/L',
        'large_freshwater_carpOxygen',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(25, 'large_freshwater_pondTradeKoi'),
        typLow: years(35, 'large_freshwater_pondTradeKoi'),
        typHigh: years(35, 'large_freshwater_pondTradeKoi'),
        max: years(50, 'large_freshwater_pondTradeKoi'),
      },
      gameCapDays: estimated(21900, DOCS09_ESTIMATE, 'large_freshwater_pondTradeKoi'),
      maturityDays: range(
        years(2, 'large_freshwater_pondTradeKoi'),
        years(3, 'large_freshwater_pondTradeKoi'),
      ),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          derived(356000, 'large_freshwater_pondTradeKoi', '89,000 eggs/kg/yr × 4 kg adult'),
          derived(740000, 'large_freshwater_pondTradeKoi', '185,000 eggs/kg/yr × 4 kg adult'),
        ),
        intervalDays: range(
          estimated(180, 'spring spawner at 15–20 °C; occasional second spawning'),
          estimated(365, 'spring spawner at 15–20 °C; occasional second spawning'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: range(
        measured(3, 'large_freshwater_pondTradeKoi'),
        measured(3, 'large_freshwater_pondTradeKoi'),
      ),
      max: measured(3, 'large_freshwater_pondTradeKoi'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: derived(2250, 'large_freshwater_pondTradeKoi', '750 L per fish × 3 fish'),
      adultsPerEnclosure: measured(3, 'large_freshwater_pondTradeKoi'),
    },
    diets: [
      { aquatic_invertebrate: 0.4, detritus: 0.2, plant: 0.2, mollusc: 0.2 },
      { food: 0.6, plant: 0.2, aquatic_invertebrate: 0.2 },
      { plant: 0.4, periphyton: 0.2, detritus: 0.2, zooplankton: 0.2 },
      { mollusc: 0.3, crustacean: 0.2, aquatic_invertebrate: 0.3, egg: 0.2 },
    ],
    preySizeRatio: { min: 0.000001, opt: 0.0001, max: 0.005 },
    defenses: [['size'], ['schooling'], ['size', 'schooling'], ['hiding']],
    habitats: [
      ['benthic', 'pelagic'],
      ['pelagic', 'surface'],
    ],
  },

  goldfish: {
    kind: 'cohort',
    latinStem: 'Carassi',
    nounZh: '金魚',
    flags: [],
    massMg: range(
      dryMassEstimate(0.3, '≈ 20 cm pond adult (docs/09 20–40 cm)'),
      dryMass(1.6, 'large_freshwater_fishbaseCarassius'),
    ),
    typicalLengthMm: estimated(
      250,
      'pond adults 20–40 cm; wild common length 10 cm',
      'large_freshwater_fishbaseCarassius',
    ),
    tolerance: {
      temperatureC: range(
        measured(0, 'large_freshwater_fishbaseCarassius'),
        measured(41, 'large_freshwater_fishbaseCarassius'),
      ),
      salinityPpt: range(
        measured(0, 'large_freshwater_fishbaseCarassius'),
        measured(15, 'large_freshwater_fishbaseCarassius'),
      ),
      ph: range(
        measured(6, 'large_freshwater_fishbaseCarassius'),
        measured(8, 'large_freshwater_fishbaseCarassius'),
      ),
      nh3MaxMgL: derived(
        0.28,
        'large_freshwater_goldfishAmmonia',
        '96-h LC50 199 µmol NH3/L × 14 mg N/mmol = 2.79 mg N/L × 0.1 application factor',
      ),
      no2MaxMgL: estimated(
        2,
        'cyprinids considerably less nitrite-sensitive than salmonids and catfish',
        'large_freshwater_nitriteReview',
      ),
      o2MinMgL: estimated(
        0.5,
        'anoxia-tolerant species (ethanol fermentation)',
        'large_freshwater_goldfishAmmonia',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(10, 'large_freshwater_guinnessGoldfish'),
        typLow: years(15, 'large_freshwater_guinnessGoldfish'),
        typHigh: years(15, 'large_freshwater_guinnessGoldfish'),
        max: years(43, 'large_freshwater_guinnessGoldfish'),
      },
      gameCapDays: measured(15695, 'large_freshwater_guinnessGoldfish'),
      maturityDays: range(yearsEstimate(1, DOCS09_ESTIMATE), yearsEstimate(2, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          estimated(1000, 'several thousand adhesive eggs per spawning (docs/09)'),
          estimated(5000, 'several thousand adhesive eggs per spawning (docs/09)'),
        ),
        intervalDays: range(
          measured(8, 'large_freshwater_fishbaseCarassius'),
          measured(10, 'large_freshwater_fishbaseCarassius'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: range(
        estimated(2, 'docs/09 §10: at least 2 per 800 L each'),
        estimated(2, 'docs/09 §10: at least 2 per 800 L each'),
      ),
      max: estimated(2, 'docs/09 §10: at least 2 per 800 L each'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: estimated(1600, 'docs/09 §10: 800 L per fish × 2 fish'),
      adultsPerEnclosure: estimated(2, 'docs/09 §10: social; at least 2'),
    },
    diets: [
      { zooplankton: 0.3, aquatic_invertebrate: 0.3, plant: 0.2, detritus: 0.2 },
      { food: 0.6, plant: 0.2, zooplankton: 0.2 },
      { plant: 0.5, periphyton: 0.3, detritus: 0.2 },
      { aquatic_invertebrate: 0.4, egg: 0.2, zooplankton: 0.2, detritus: 0.2 },
    ],
    preySizeRatio: { min: 0.000001, opt: 0.0001, max: 0.005 },
    defenses: [['schooling'], ['hiding'], ['size'], ['schooling', 'hiding']],
    habitats: [['pelagic', 'benthic'], ['pelagic']],
  },

  large_pleco: {
    kind: 'cohort',
    latinStem: 'Pterygopl',
    nounZh: '異型',
    flags: ['air_breather', 'territorial'],
    massMg: range(
      dryMassEstimate(0.3, '≈ 35 cm adult (docs/09 35–61 cm)'),
      dryMass(0.655, 'large_freshwater_fishbasePterygoplichthys'),
    ),
    typicalLengthMm: estimated(
      450,
      'docs/09 35–61 cm; P. pardalis max 57.8 cm TL',
      'large_freshwater_fishbasePterygoplichthys',
    ),
    tolerance: {
      temperatureC: range(
        measured(23, 'large_freshwater_fishbasePterygoplichthys'),
        measured(28, 'large_freshwater_fishbasePterygoplichthys'),
      ),
      salinityPpt: range(
        measured(0, 'large_freshwater_fishbasePterygoplichthys'),
        estimated(8, 'invasive populations enter low-salinity estuaries'),
      ),
      ph: range(
        estimated(6, 'wide pH range in invasive range; FishBase husbandry 7.0–7.5'),
        measured(7.5, 'large_freshwater_fishbasePterygoplichthys'),
      ),
      nh3MaxMgL: estimated(0.08, `${GENERIC_NH3}; hardy invasive loricariid`),
      no2MaxMgL: estimated(
        0.5,
        'catfishes among the most nitrite-sensitive warmwater taxa',
        'large_freshwater_nitriteReview',
      ),
      o2MinMgL: estimated(
        1,
        'facultative air-breather (gut respiration)',
        'large_freshwater_fishbasePterygoplichthys',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimate(10, DOCS09_ESTIMATE),
        typLow: yearsEstimate(15, DOCS09_ESTIMATE),
        typHigh: yearsEstimate(15, DOCS09_ESTIMATE),
        max: yearsEstimate(20, DOCS09_ESTIMATE),
      },
      gameCapDays: estimated(7300, DOCS09_ESTIMATE),
      maturityDays: range(yearsEstimate(2, DOCS09_ESTIMATE), yearsEstimate(3, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          estimated(500, 'burrow-nesting, male-guarded eggs (docs/09 估)'),
          estimated(3000, 'burrow-nesting, male-guarded eggs (docs/09 估)'),
        ),
        intervalDays: range(
          estimated(180, 'wet-season burrow spawner'),
          estimated(365, 'wet-season burrow spawner'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(estimated(1, DOCS09_ESTIMATE), estimated(1, DOCS09_ESTIMATE)),
      max: estimated(1, 'territorial adult; docs/09 §10'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(150, 'docs/09 §10'),
      waterVolumeL: estimated(285, 'docs/09 §10'),
      adultsPerEnclosure: estimated(1, 'docs/09 §10'),
    },
    diets: [
      { periphyton: 0.5, detritus: 0.3, biofilm: 0.2 },
      { detritus: 0.5, periphyton: 0.3, litter: 0.2 },
      { periphyton: 0.4, plant: 0.2, food: 0.4 },
      { detritus: 0.4, aquatic_invertebrate: 0.2, periphyton: 0.3, carrion: 0.1 },
    ],
    preySizeRatio: { min: 0.000001, opt: 0.0001, max: 0.002 },
    defenses: [['armor'], ['armor', 'spines'], ['armor', 'hiding'], ['hiding', 'spines']],
    habitats: [
      ['benthic', 'crevice'],
      ['burrow', 'benthic'],
    ],
  },

  giant_catfish: {
    kind: 'cohort',
    latinStem: 'Phractoc',
    nounZh: '鯰',
    flags: [],
    massMg: range(
      dryMassEstimate(10, '≈ 90 cm adult (docs/09 0.9–1.8 m)'),
      dryMass(44.2, 'large_freshwater_fishbasePhractocephalus'),
    ),
    typicalLengthMm: estimated(
      1200,
      'docs/09 0.9–1.8 m; redtail max 135 cm TL',
      'large_freshwater_fishbasePhractocephalus',
    ),
    tolerance: {
      temperatureC: range(
        measured(20, 'large_freshwater_fishbasePhractocephalus'),
        measured(26, 'large_freshwater_fishbasePhractocephalus'),
      ),
      salinityPpt: range(
        measured(0, 'large_freshwater_fishbasePhractocephalus'),
        freshwaterSaltMax(3),
      ),
      ph: range(
        measured(5.5, 'large_freshwater_fishbasePhractocephalus'),
        measured(7.5, 'large_freshwater_seriouslyFishPhractocephalus'),
      ),
      nh3MaxMgL: estimated(0.05, GENERIC_NH3),
      no2MaxMgL: estimated(
        0.5,
        'catfishes among the most nitrite-sensitive warmwater taxa',
        'large_freshwater_nitriteReview',
      ),
      o2MinMgL: estimated(3, GENERIC_O2),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimate(15, DOCS09_ESTIMATE),
        typLow: yearsEstimate(20, DOCS09_ESTIMATE),
        typHigh: yearsEstimate(20, DOCS09_ESTIMATE),
        max: yearsEstimate(30, DOCS09_ESTIMATE),
      },
      gameCapDays: estimated(10950, DOCS09_ESTIMATE),
      maturityDays: range(yearsEstimate(3, DOCS09_ESTIMATE), yearsEstimate(5, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          estimated(10000, 'migratory river spawner; not bred in aquaria'),
          estimated(100000, 'migratory river spawner; not bred in aquaria'),
        ),
        intervalDays: range(
          estimated(365, 'annual flood-season migration spawning'),
          estimated(365, 'annual flood-season migration spawning'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(estimated(1, DOCS09_ESTIMATE), estimated(1, DOCS09_ESTIMATE)),
      max: estimated(1, 'docs/09 §10'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(
        240,
        'docs/09 §10; Seriously Fish recommends 360 cm',
        'large_freshwater_seriouslyFishPhractocephalus',
      ),
      waterVolumeL: estimated(
        3800,
        'docs/09 §10; Seriously Fish recommends 10,368 L',
        'large_freshwater_seriouslyFishPhractocephalus',
      ),
      adultsPerEnclosure: estimated(1, 'docs/09 §10'),
    },
    diets: [
      { fish: 0.8, crustacean: 0.2 },
      { fish: 0.6, crustacean: 0.2, fruit: 0.2 },
      { fish: 0.5, carrion: 0.3, crustacean: 0.2 },
      { food: 0.4, fish: 0.6 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.05, max: 0.3 },
    defenses: [['size'], ['size', 'spines'], ['hiding'], ['camouflage', 'size']],
    habitats: [['benthic'], ['benthic', 'crevice']],
  },

  freshwater_stingray: {
    kind: 'cohort',
    latinStem: 'Potamotr',
    nounZh: '魟',
    flags: [],
    massMg: range(
      dryMassEstimate(5, 'docs/09 adult 5–15 kg', 'large_freshwater_fishbasePotamotrygon'),
      dryMassEstimate(
        15,
        'docs/09 adult 5–15 kg; FishBase maximum 34.2 kg',
        'large_freshwater_fishbasePotamotrygon',
      ),
    ),
    typicalLengthMm: estimated(
      450,
      'disc width 35–45 cm; FishBase maximum 50 cm WD',
      'large_freshwater_fishbasePotamotrygon',
    ),
    tolerance: {
      temperatureC: range(
        measured(24, 'large_freshwater_pfkStingrays'),
        measured(30, 'large_freshwater_pfkStingrays'),
      ),
      salinityPpt: range(
        measured(0, 'large_freshwater_fishbasePotamotrygon'),
        estimated(1, 'potamotrygonids cannot retain urea; no brackish tolerance'),
      ),
      ph: range(
        measured(5, 'large_freshwater_fishbasePotamotrygon'),
        estimated(7, 'tolerated in captivity; FishBase lists 5.0–6.0'),
      ),
      nh3MaxMgL: estimated(0.02, 'elasmobranch highly sensitive to nitrogenous waste in aquaria'),
      no2MaxMgL: estimated(
        0.2,
        'highly sensitive; requires low-conductivity water with frequent changes',
        'large_freshwater_pfkStingrays',
      ),
      o2MinMgL: estimated(5, 'requires well-oxygenated, low-conductivity water'),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(10, 'large_freshwater_pfkStingrays'),
        typLow: years(15, 'large_freshwater_pfkStingrays'),
        typHigh: years(15, 'large_freshwater_pfkStingrays'),
        max: years(20, 'large_freshwater_pfkStingrays'),
      },
      gameCapDays: measured(7300, 'large_freshwater_pfkStingrays'),
      maturityDays: range(yearsEstimate(3, DOCS09_ESTIMATE), yearsEstimate(4, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'livebearer',
        clutch: range(
          measured(3, 'large_freshwater_fishbasePotamotrygon'),
          measured(21, 'large_freshwater_fishbasePotamotrygon'),
        ),
        intervalDays: range(
          derived(120, 'large_freshwater_pfkStingrays', 'up to three litters per year: 365 ÷ 3'),
          measured(365, 'large_freshwater_pfkStingrays'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: range(
        measured(1, 'large_freshwater_pfkStingrays'),
        derived(2, 'large_freshwater_pfkStingrays', '5 per 1,800 L × 750 L ÷ 1,800 L, floored'),
      ),
      max: derived(2, 'large_freshwater_pfkStingrays', '5 per 1,800 L × 750 L ÷ 1,800 L, floored'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(180, 'large_freshwater_pfkStingrays'),
      waterVolumeL: measured(750, 'large_freshwater_pfkStingrays'),
      adultsPerEnclosure: derived(
        2,
        'large_freshwater_pfkStingrays',
        '5 per 1,800 L × 750 L ÷ 1,800 L, floored',
      ),
    },
    diets: [
      { aquatic_invertebrate: 0.4, crustacean: 0.4, fish: 0.2 },
      { crustacean: 0.3, mollusc: 0.3, fish: 0.4 },
      { aquatic_invertebrate: 0.5, mollusc: 0.3, crustacean: 0.2 },
      { food: 0.5, crustacean: 0.3, fish: 0.2 },
    ],
    preySizeRatio: { min: 0.00005, opt: 0.002, max: 0.05 },
    defenses: [
      ['venom'],
      ['venom', 'camouflage'],
      ['venom', 'burrowing'],
      ['camouflage', 'burrowing'],
    ],
    habitats: [['benthic'], ['benthic', 'infaunal']],
  },

  fire_eel: {
    kind: 'cohort',
    latinStem: 'Mastacemb',
    nounZh: '刺鰍',
    flags: ['territorial'],
    massMg: range(
      dryMassEstimate(0.5, '≈ 50 cm adult (docs/09 50–100 cm, ≈ 1 kg)'),
      dryMassEstimate(1.5, '≈ 100 cm adult (docs/09 50–100 cm, ≈ 1 kg)'),
    ),
    typicalLengthMm: estimated(
      700,
      'docs/09 50–100 cm; FishBase max 100 cm TL',
      'large_freshwater_fishbaseMastacembelus',
    ),
    tolerance: {
      temperatureC: range(
        measured(24, 'large_freshwater_fishbaseMastacembelus'),
        measured(28, 'large_freshwater_fishbaseMastacembelus'),
      ),
      salinityPpt: range(
        measured(0, 'large_freshwater_fishbaseMastacembelus'),
        freshwaterSaltMax(3),
      ),
      ph: range(
        measured(6, 'large_freshwater_fishbaseMastacembelus'),
        measured(8, 'large_freshwater_fishbaseMastacembelus'),
      ),
      nh3MaxMgL: estimated(0.05, GENERIC_NH3),
      no2MaxMgL: estimated(0.5, GENERIC_NO2),
      o2MinMgL: estimated(3, `${GENERIC_O2}; floodplain bottom dweller`),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(10, 'large_freshwater_seriouslyFishMastacembelus'),
        typLow: years(12, 'large_freshwater_seriouslyFishMastacembelus'),
        typHigh: years(12, 'large_freshwater_seriouslyFishMastacembelus'),
        max: years(15, 'large_freshwater_seriouslyFishMastacembelus'),
      },
      gameCapDays: measured(5475, 'large_freshwater_seriouslyFishMastacembelus'),
      maturityDays: range(yearsEstimate(2, DOCS09_ESTIMATE), yearsEstimate(3, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          estimated(500, 'no fecundity data; bred only accidentally in aquaria'),
          estimated(2000, 'no fecundity data; bred only accidentally in aquaria'),
        ),
        intervalDays: range(
          estimated(180, 'seasonal floodplain spawner'),
          estimated(365, 'seasonal floodplain spawner'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: range(
        measured(1, 'large_freshwater_seriouslyFishMastacembelus'),
        measured(1, 'large_freshwater_seriouslyFishMastacembelus'),
      ),
      max: measured(1, 'large_freshwater_seriouslyFishMastacembelus'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(120, 'large_freshwater_seriouslyFishMastacembelus'),
      waterVolumeL: estimated(
        400,
        'docs/09 §10; Seriously Fish lists 432 L',
        'large_freshwater_seriouslyFishMastacembelus',
      ),
      adultsPerEnclosure: measured(1, 'large_freshwater_seriouslyFishMastacembelus'),
    },
    diets: [
      { aquatic_invertebrate: 0.7, crustacean: 0.2, plant: 0.1 },
      { aquatic_invertebrate: 0.4, fish: 0.4, crustacean: 0.2 },
      { crustacean: 0.4, aquatic_invertebrate: 0.4, mollusc: 0.2 },
      { food: 0.5, aquatic_invertebrate: 0.3, fish: 0.2 },
    ],
    preySizeRatio: { min: 0.00005, opt: 0.002, max: 0.05 },
    defenses: [
      ['burrowing'],
      ['hiding', 'burrowing'],
      ['mucus', 'burrowing'],
      ['spines', 'hiding'],
    ],
    habitats: [
      ['benthic', 'infaunal'],
      ['benthic', 'crevice'],
    ],
  },

  scat: {
    kind: 'cohort',
    latinStem: 'Scatoph',
    nounZh: '金錢魚',
    flags: [],
    massMg: range(
      dryMassEstimate(0.2, '≈ 15 cm adult (docs/09 15–45 cm, 0.3–1 kg)'),
      dryMassEstimate(1, 'docs/09 maximum 1 kg at 45 cm'),
    ),
    typicalLengthMm: measured(200, 'large_freshwater_fishbaseScatophagus'),
    tolerance: {
      temperatureC: range(
        measured(20, 'large_freshwater_fishbaseScatophagus'),
        measured(28, 'large_freshwater_fishbaseScatophagus'),
      ),
      salinityPpt: range(
        estimated(
          2,
          'amphidromous; adults kept brackish (class B), juveniles enter fresh water',
          'large_freshwater_fishbaseScatophagus',
        ),
        estimated(
          25,
          'tolerates full seawater; range capped to brackish class B',
          'large_freshwater_fishbaseScatophagus',
        ),
      ),
      ph: range(
        estimated(7.5, 'brackish estuarine water'),
        estimated(8.5, 'brackish estuarine water'),
      ),
      nh3MaxMgL: estimated(0.1, `${GENERIC_NH3}; hardy estuarine omnivore`),
      no2MaxMgL: estimated(
        2,
        'brackish chloride strongly reduces nitrite uptake',
        'large_freshwater_nitriteReview',
      ),
      o2MinMgL: estimated(3, `${GENERIC_O2}; mangrove-estuary dweller`),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimate(8, DOCS09_ESTIMATE),
        typLow: yearsEstimate(12, DOCS09_ESTIMATE),
        typHigh: yearsEstimate(12, DOCS09_ESTIMATE),
        max: yearsEstimate(20, DOCS09_ESTIMATE),
      },
      gameCapDays: estimated(7300, DOCS09_ESTIMATE),
      maturityDays: range(estimated(300, DOCS09_ESTIMATE), estimated(450, DOCS09_ESTIMATE)),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          estimated(50000, 'pelagic eggs; marine multiple spawner'),
          estimated(200000, 'pelagic eggs; marine multiple spawner'),
        ),
        intervalDays: range(
          estimated(30, 'multiple spawner', 'large_freshwater_fishbaseScatophagus'),
          estimated(90, 'multiple spawner', 'large_freshwater_fishbaseScatophagus'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(
        estimated(3, 'docs/09 §10: at least 3; 5 per 600 L (估)'),
        estimated(5, 'docs/09 §10: at least 3; 5 per 600 L (估)'),
      ),
      max: estimated(5, 'docs/09 §10: 5 per 600 L (估)'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(150, 'docs/09 §10'),
      waterVolumeL: estimated(600, 'docs/09 §10 (估)'),
      adultsPerEnclosure: estimated(5, 'docs/09 §10: 5 per 600 L (估)'),
    },
    diets: [
      { detritus: 0.3, plant: 0.3, aquatic_invertebrate: 0.2, crustacean: 0.2 },
      { macroalgae: 0.3, periphyton: 0.3, detritus: 0.4 },
      { crustacean: 0.3, aquatic_invertebrate: 0.3, terrestrial_invertebrate: 0.2, plant: 0.2 },
      { food: 0.5, plant: 0.3, detritus: 0.2 },
    ],
    preySizeRatio: { min: 0.00005, opt: 0.002, max: 0.02 },
    defenses: [['venom'], ['venom', 'schooling'], ['schooling'], ['spines']],
    habitats: [['pelagic'], ['pelagic', 'benthic']],
  },
};
