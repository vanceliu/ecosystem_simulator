import type { ArchetypeData, SourcedRange } from '../archetype';
import { derived as d, estimated as e, measured as m, type Sourced } from '../sourced';
import type { ArchetypeGroups } from './groupTypes';

const r = (min: Sourced, max: Sourced): SourcedRange => ({ min, max });

const DOCS09_EST = 'docs/09 §5 provisional value (估)';
const NH3_AF = 'acute LC50 × 0.1 application factor';
const NH3_AS_N = 'mg NH3 × 14/17 = mg NH3-N';

/** docs/02, docs/09: snail, shrimp, bivalve, sea_urchin, brittle_star, sponge, tunicate, coral, crayfish, mantis_shrimp, odonate_nymph, predatory_insect */
export const AQUATIC_BENTHIC: Readonly<
  Partial<Record<ArchetypeGroups['aquatic_benthic'], ArchetypeData>>
> = {
  snail: {
    kind: 'cohort',
    latinStem: 'Neritin',
    nounZh: '螺',
    flags: [],
    massMg: r(
      e(
        5,
        '7 mm Physa ≈ 50 mg wet incl. shell × prosobranch SFDW/WW 10.6%',
        'aquatic_benthic_weightConversion',
      ),
      e(
        1600,
        '39 mm snail ≈ 15 g wet incl. shell × prosobranch SFDW/WW 10.6%',
        'aquatic_benthic_weightConversion',
      ),
    ),
    typicalLengthMm: e(17, 'geometric mean of docs/09 shell length 7–39 mm'),
    tolerance: {
      temperatureC: r(
        e(8, 'temperate pond snails overwinter active near 8 °C'),
        e(32, 'tropical aquarium snails; no species-level CTmax collected'),
      ),
      salinityPpt: r(
        e(0, 'freshwater pulmonates (F class)'),
        e(36, 'reef nerites and Nassarius in full seawater (M class)'),
      ),
      ph: r(
        e(6.5, 'shell dissolution below ≈ 6.5'),
        e(8.8, 'hard alkaline water and reef water tolerated'),
      ),
      nh3MaxMgL: m(0.13, 'aquatic_benthic_snailAmmonia'),
      no2MaxMgL: e(
        1,
        'freshwater macroinvertebrate 96-h LC50 0.25–2.4 mg NO2-N/L; snails among the more tolerant',
        'aquatic_benthic_insectToxicity',
      ),
      o2MinMgL: m(0.89, 'aquatic_benthic_hypoxiaThresholds'),
    },
    lifeHistory: {
      lifespanDays: {
        min: m(50, 'aquatic_benthic_snailEkologia'),
        typLow: m(365, 'aquatic_benthic_snailActaSci'),
        typHigh: m(730, 'aquatic_benthic_snailPlanorbella'),
        max: m(2200, 'aquatic_benthic_snailNassarius'),
      },
      gameCapDays: m(2200, 'aquatic_benthic_snailNassarius'),
      maturityDays: r(
        m(28, 'aquatic_benthic_snailEkologia'),
        m(105, 'aquatic_benthic_snailPlanorbella'),
      ),
      reproduction: {
        mode: 'eggs',
        clutch: r(m(1, 'aquatic_benthic_snailEkologia'), m(11, 'aquatic_benthic_snailEkologia')),
        intervalDays: r(
          e(2, 'continuous egg-capsule laying over ≈ 20 weeks (docs/09)'),
          e(7, 'continuous egg-capsule laying over ≈ 20 weeks (docs/09)'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: r(m(13, 'aquatic_benthic_snailSedici'), m(84, 'aquatic_benthic_snailSedici')),
      max: m(1800, 'aquatic_benthic_snailEkologia'),
      unit: 'individuals_per_m2',
    },
    diets: [
      { periphyton: 0.5, biofilm: 0.3, detritus: 0.2 },
      { biofilm: 0.4, detritus: 0.4, food: 0.2 },
      { plant: 0.4, periphyton: 0.3, detritus: 0.3 },
      { mollusc: 0.5, carrion: 0.3, detritus: 0.2 },
    ],
    preySizeRatio: { min: 0.05, opt: 0.3, max: 1 },
    defenses: [['shell'], ['shell', 'mucus'], ['shell', 'hiding'], ['shell', 'burrowing']],
    habitats: [
      ['benthic', 'epiphytic'],
      ['benthic', 'infaunal'],
    ],
  },

  shrimp: {
    kind: 'cohort',
    latinStem: 'Neocarid',
    nounZh: '蝦',
    flags: [],
    massMg: r(
      d(26, 'aquatic_benthic_weightConversion', '0.1 g wet (docs/09) × Decapoda DW/WW 26.2%'),
      d(52, 'aquatic_benthic_weightConversion', '0.2 g wet (docs/09) × Decapoda DW/WW 26.2%'),
    ),
    typicalLengthMm: m(25, 'aquatic_benthic_shrimpNeocaridina'),
    tolerance: {
      temperatureC: r(
        e(12, 'Neocaridina survive unheated tanks; no CTmin collected'),
        e(30, 'reproduction impaired at high temperature; no CTmax collected'),
      ),
      salinityPpt: r(
        e(0, 'freshwater caridean shrimp (F class)'),
        e(36, 'marine cleaner shrimp in full seawater (M class)'),
      ),
      ph: r(e(6.2, 'aquarium husbandry range'), e(8.5, 'aquarium husbandry range')),
      nh3MaxMgL: d(
        0.16,
        'aquatic_benthic_shrimpAmmonia',
        'L. vannamei juvenile safe level at 25–35 ppt applied to small shrimp',
      ),
      no2MaxMgL: e(
        1,
        'freshwater value; L. vannamei safe level 6.1 mg NO2-N/L at 15 ppt falls with chloride',
        'aquatic_benthic_shrimpNitrite',
      ),
      o2MinMgL: m(2.45, 'aquatic_benthic_hypoxiaThresholds'),
    },
    lifeHistory: {
      lifespanDays: {
        min: m(365, 'aquatic_benthic_shrimpNeocaridina'),
        typLow: m(450, 'aquatic_benthic_shrimpBiodiversitas'),
        typHigh: m(730, 'aquatic_benthic_shrimpNeocaridina'),
        max: m(1100, 'aquatic_benthic_shrimpBreeders'),
      },
      gameCapDays: e(1500, 'docs/09 §4 provisional game cap (估)'),
      maturityDays: r(
        m(30, 'aquatic_benthic_shrimpNeocaridina'),
        m(75, 'aquatic_benthic_shrimpBiodiversitas'),
      ),
      reproduction: {
        mode: 'brood',
        clutch: r(
          m(20, 'aquatic_benthic_shrimpNeocaridina'),
          m(60, 'aquatic_benthic_shrimpBiodiversitas'),
        ),
        intervalDays: r(
          m(21, 'aquatic_benthic_shrimpBiodiversitas'),
          m(28, 'aquatic_benthic_shrimpBiodiversitas'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: r(
        m(0.26, 'aquatic_benthic_shrimpBiodiversitas'),
        m(2.5, 'aquatic_benthic_shrimpBiodiversitas'),
      ),
      max: m(5, 'aquatic_benthic_shrimpBiodiversitas'),
      unit: 'individuals_per_L',
    },
    diets: [
      { biofilm: 0.5, detritus: 0.3, periphyton: 0.2 },
      { detritus: 0.4, food: 0.4, biofilm: 0.2 },
      { periphyton: 0.4, biofilm: 0.3, detritus: 0.2, plant: 0.1 },
      { carrion: 0.4, food: 0.3, detritus: 0.2, zooplankton: 0.1 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.01, max: 0.05 },
    defenses: [['hiding'], ['camouflage'], ['armor'], ['camouflage', 'hiding']],
    habitats: [
      ['benthic', 'epiphytic'],
      ['benthic', 'crevice'],
    ],
  },

  bivalve: {
    kind: 'cohort',
    latinStem: 'Corbicul',
    nounZh: '蜆',
    flags: [],
    massMg: r(
      e(
        0.9,
        '3 mm Sphaeriidae ≈ 10 mg wet incl. shell × Bivalvia SFDW/WW 8.7%',
        'aquatic_benthic_weightConversion',
      ),
      e(
        700,
        '30 mm Corbicula ≈ 8 g wet incl. shell × Bivalvia SFDW/WW 8.7%',
        'aquatic_benthic_weightConversion',
      ),
    ),
    typicalLengthMm: e(10, 'geometric mean of docs/09 shell length 3–30 mm'),
    tolerance: {
      temperatureC: r(
        e(4, 'temperate sphaeriids and Corbicula overwinter'),
        e(32, 'Corbicula summer die-offs above ≈ 32 °C'),
      ),
      salinityPpt: r(
        e(0, 'freshwater sphaeriids and Corbicula (F class)'),
        e(36, 'marine clams in full seawater (M class)'),
      ),
      ph: r(e(6.5, 'shell dissolution below ≈ 6.5'), e(8.8, 'alkaline hard water tolerated')),
      nh3MaxMgL: d(
        0.08,
        'aquatic_benthic_bivalveAmmonia',
        `adult Corbicula 0.80 mg NH3-N/L; ${NH3_AF}`,
      ),
      no2MaxMgL: e(
        1,
        'freshwater macroinvertebrate 96-h LC50 0.25–2.4 mg NO2-N/L',
        'aquatic_benthic_insectToxicity',
      ),
      o2MinMgL: m(1.42, 'aquatic_benthic_hypoxiaThresholds'),
    },
    lifeHistory: {
      lifespanDays: {
        min: e(365, 'docs/09 §4 fingernail clam lower lifespan (估)'),
        typLow: m(730, 'aquatic_benthic_bivalveDayton'),
        typHigh: m(1100, 'aquatic_benthic_bivalveDayton'),
        max: m(1100, 'aquatic_benthic_bivalveJConch'),
      },
      gameCapDays: m(1100, 'aquatic_benthic_bivalveJConch'),
      maturityDays: r(m(90, 'aquatic_benthic_bivalveMdc'), m(180, 'aquatic_benthic_bivalveDayton')),
      reproduction: {
        mode: 'brood',
        clutch: r(m(20, 'aquatic_benthic_bivalveMdc'), m(2000, 'aquatic_benthic_bivalveDayton')),
        intervalDays: r(
          e(1, 'Corbicula releases juveniles daily during spawning season'),
          e(180, 'sphaeriids release one or two broods per year'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: r(
        m(60, 'aquatic_benthic_bivalveKonstanz'),
        m(500, 'aquatic_benthic_bivalveKonstanz'),
      ),
      max: m(3520, 'aquatic_benthic_bivalveJConch'),
      unit: 'individuals_per_m2',
    },
    diets: [
      { phytoplankton: 0.7, bacteria: 0.2, detritus: 0.1 },
      { phytoplankton: 0.5, bacteria: 0.3, detritus: 0.2 },
      { bacteria: 0.5, detritus: 0.3, phytoplankton: 0.2 },
      { detritus: 0.5, bacteria: 0.3, phytoplankton: 0.2 },
    ],
    defenses: [['shell'], ['shell', 'burrowing'], ['shell', 'size'], ['shell', 'hiding']],
    habitats: [['infaunal'], ['benthic', 'sessile']],
  },

  sea_urchin: {
    kind: 'cohort',
    latinStem: 'Tripneus',
    nounZh: '海膽',
    flags: [],
    massMg: r(
      e(1000, '5 cm test ≈ 30 g wet × Echinoidea AFDW/WW 3.5%', 'aquatic_benthic_weightConversion'),
      e(
        8800,
        '10 cm test ≈ 250 g wet × Echinoidea AFDW/WW 3.5%',
        'aquatic_benthic_weightConversion',
      ),
    ),
    typicalLengthMm: e(70, 'geometric mean of docs/09 test diameter 5–10 cm'),
    tolerance: {
      temperatureC: r(
        e(18, 'tropical reef urchins; reef lower limit'),
        m(34.8, 'aquatic_benthic_urchinThermal'),
      ),
      salinityPpt: r(
        e(25, 'larval mortality rises at 25 ppt; stenohaline echinoderm'),
        e(38, 'reef seawater upper range'),
      ),
      ph: r(e(7.6, 'reef aquarium range'), e(8.6, 'reef aquarium range')),
      nh3MaxMgL: d(
        0.12,
        'aquatic_benthic_reefAmmonia',
        `L. variegatus embryo LOEC 0.149 mg/L UAN; ${NH3_AS_N}`,
      ),
      no2MaxMgL: e(5, 'nitrite toxicity low in seawater; no echinoderm data collected'),
      o2MinMgL: m(1.22, 'aquatic_benthic_hypoxiaThresholds'),
    },
    lifeHistory: {
      lifespanDays: {
        min: m(365, 'aquatic_benthic_urchinJstage'),
        typLow: m(1825, 'aquatic_benthic_urchinJstage'),
        typHigh: m(2555, 'aquatic_benthic_urchinJstage'),
        max: m(4380, 'aquatic_benthic_urchinJstage'),
      },
      gameCapDays: m(4500, 'aquatic_benthic_urchinJstage'),
      maturityDays: r(e(180, DOCS09_EST), e(365, DOCS09_EST)),
      reproduction: {
        mode: 'eggs',
        clutch: r(
          e(100000, 'broadcast spawner; small tropical species'),
          e(2000000, 'broadcast spawner; large tropical species'),
        ),
        intervalDays: r(e(30, 'lunar spawning periodicity'), e(365, 'annual spawning')),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: r(
        m(1, 'aquatic_benthic_urchinLiveAquaria'),
        d(1.33, 'aquatic_benthic_urchinLiveAquaria', 'one per 75 L × 100 / 75'),
      ),
      max: m(2, 'aquatic_benthic_urchinReeflex'),
      unit: 'individuals_per_100L',
    },
    minEnclosure: {
      waterVolumeL: m(75, 'aquatic_benthic_urchinLiveAquaria'),
      adultsPerEnclosure: m(1, 'aquatic_benthic_urchinLiveAquaria'),
    },
    diets: [
      { periphyton: 0.6, macroalgae: 0.4 },
      { macroalgae: 0.7, periphyton: 0.2, detritus: 0.1 },
      { periphyton: 0.5, biofilm: 0.3, detritus: 0.2 },
      { macroalgae: 0.5, periphyton: 0.3, sessile_invertebrate: 0.2 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.05, max: 0.5 },
    defenses: [['spines'], ['spines', 'venom'], ['spines', 'camouflage'], ['spines', 'size']],
    habitats: [['benthic', 'crevice'], ['benthic']],
  },

  brittle_star: {
    kind: 'cohort',
    latinStem: 'Ophiact',
    nounZh: '蛇尾',
    flags: [],
    massMg: r(
      e(
        3.7,
        '3 mm disc ≈ 0.05 g wet × Ophiuroidea AFDW/WW 7.4%',
        'aquatic_benthic_weightConversion',
      ),
      e(
        37,
        '5.5 mm disc ≈ 0.5 g wet incl. arms × Ophiuroidea AFDW/WW 7.4%',
        'aquatic_benthic_weightConversion',
      ),
    ),
    typicalLengthMm: e(40, 'arm span of 3–5.5 mm disc brittle stars (docs/09)'),
    tolerance: {
      temperatureC: r(e(18, 'tropical reef ophiuroids'), e(30, 'tropical reef ophiuroids')),
      salinityPpt: r(e(25, 'stenohaline echinoderm'), e(38, 'reef seawater upper range')),
      ph: r(e(7.6, 'reef aquarium range'), e(8.6, 'reef aquarium range')),
      nh3MaxMgL: e(0.12, 'sea_urchin value applied to ophiuroids', 'aquatic_benthic_reefAmmonia'),
      no2MaxMgL: e(5, 'nitrite toxicity low in seawater; no echinoderm data collected'),
      o2MinMgL: m(1.22, 'aquatic_benthic_hypoxiaThresholds'),
    },
    lifeHistory: {
      lifespanDays: {
        min: e(365, DOCS09_EST),
        typLow: m(1095, 'aquatic_benthic_brittleMarlin'),
        typHigh: m(1825, 'aquatic_benthic_brittleMarlin'),
        max: m(1825, 'aquatic_benthic_brittleMarlin'),
      },
      gameCapDays: m(1825, 'aquatic_benthic_brittleMarlin'),
      maturityDays: r(
        m(365, 'aquatic_benthic_brittleMarlin'),
        m(365, 'aquatic_benthic_brittleMarlin'),
      ),
      reproduction: {
        mode: 'brood',
        clutch: r(e(50, 'brooding ophiuroid lower clutch'), m(100, 'aquatic_benthic_brittleUwFhl')),
        intervalDays: r(e(180, 'brooding ophiuroid'), m(365, 'aquatic_benthic_brittleUwFhl')),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: r(
        e(20, 'docs/09 gives no typical density'),
        e(100, 'docs/09 gives no typical density'),
      ),
      max: e(1000, 'docs/09 §5 maximum 100–1,000 per 100 L (估)'),
      unit: 'individuals_per_100L',
    },
    diets: [
      { detritus: 0.6, carrion: 0.4 },
      { food: 0.5, detritus: 0.3, carrion: 0.2 },
      { detritus: 0.5, zooplankton: 0.3, bacteria: 0.2 },
      { carrion: 0.4, aquatic_invertebrate: 0.3, detritus: 0.2, fish: 0.1 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.05, max: 0.5 },
    defenses: [
      ['autotomy'],
      ['autotomy', 'hiding'],
      ['spines', 'autotomy'],
      ['autotomy', 'burrowing'],
    ],
    habitats: [
      ['crevice', 'benthic'],
      ['infaunal', 'crevice'],
    ],
  },

  sponge: {
    kind: 'cohort',
    latinStem: 'Haliclon',
    nounZh: '海綿',
    flags: [],
    massMg: r(
      e(170, 'fragment ≈ 1 g wet × Demospongiae DW/WW 16.8%', 'aquatic_benthic_weightConversion'),
      e(8400, 'colony ≈ 50 g wet × Demospongiae DW/WW 16.8%', 'aquatic_benthic_weightConversion'),
    ),
    typicalLengthMm: e(50, 'encrusting patch of a few cm² to dm² (docs/09)'),
    tolerance: {
      temperatureC: r(
        e(10, 'freshwater Spongillidae and temperate species'),
        e(31, 'reef upper range'),
      ),
      salinityPpt: r(
        e(0, 'freshwater Spongillidae (F class)'),
        e(38, 'reef seawater upper range (M class)'),
      ),
      ph: r(e(6.5, 'freshwater sponges'), e(8.6, 'reef seawater')),
      nh3MaxMgL: e(0.05, 'no sponge data collected; set near coral sensitivity'),
      no2MaxMgL: e(2, 'no sponge data collected'),
      o2MinMgL: e(
        2,
        'sponges absent from Vaquer-Sunyer & Duarte compilation',
        'aquatic_benthic_hypoxiaThresholds',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: e(90, 'docs/09 §5 colony lifespan of months'),
        typLow: m(365, 'aquatic_benthic_spongeMarlin'),
        typHigh: e(1095, 'docs/09 §5 colony lifespan 1 to several years'),
        max: e(3650, 'colonies indefinite; truncated at game cap', 'aquatic_benthic_spongeOldest'),
      },
      gameCapDays: e(3650, 'docs/09 §5 colony game cap (估)'),
      maturityDays: r(e(90, DOCS09_EST), e(365, DOCS09_EST)),
      reproduction: {
        mode: 'fragmentation',
        intervalDays: r(
          e(30, 'fragmentation and budding frequency'),
          e(180, 'seasonal larval release'),
        ),
      },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: e(180, 'no module turnover data collected for sponges'),
    },
    density: {
      typical: r(e(5, DOCS09_EST), e(20, DOCS09_EST)),
      max: e(20, 'docs/09 ≈ 500 cm² per 100 L ÷ ≈ 25 cm² per fragment'),
      unit: 'individuals_per_100L',
    },
    diets: [
      { bacteria: 0.7, doc: 0.2, phytoplankton: 0.1 },
      { bacteria: 0.5, phytoplankton: 0.3, detritus: 0.2 },
      { doc: 0.5, bacteria: 0.5 },
      { bacteria: 0.6, phytoplankton: 0.2, doc: 0.1, detritus: 0.1 },
    ],
    defenses: [['spines'], ['toxin'], ['spines', 'toxin'], ['toxin', 'size']],
    habitats: [['sessile', 'crevice'], ['sessile']],
  },

  tunicate: {
    kind: 'cohort',
    latinStem: 'Clavelin',
    nounZh: '海鞘',
    flags: [],
    massMg: r(
      e(60, 'small colony ≈ 1 g wet × Ascidiacea DW/WW 6.3%', 'aquatic_benthic_weightConversion'),
      e(
        1900,
        '15 cm solitary ascidian ≈ 30 g wet × Ascidiacea DW/WW 6.3%',
        'aquatic_benthic_weightConversion',
      ),
    ),
    typicalLengthMm: e(50, 'solitary ≤ 15 cm, colonies of 2 mm zooids (docs/09)'),
    tolerance: {
      temperatureC: r(
        e(15, 'warm-temperate and tropical ascidians'),
        e(30, 'tropical upper range'),
      ),
      salinityPpt: r(e(25, 'stenohaline marine filter feeder'), e(38, 'reef seawater upper range')),
      ph: r(e(7.6, 'reef aquarium range'), e(8.6, 'reef aquarium range')),
      nh3MaxMgL: e(0.05, 'no ascidian data collected; set near coral sensitivity'),
      no2MaxMgL: e(5, 'nitrite toxicity low in seawater; no ascidian data collected'),
      o2MinMgL: e(
        2,
        'ascidians absent from Vaquer-Sunyer & Duarte compilation',
        'aquatic_benthic_hypoxiaThresholds',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: m(365, 'aquatic_benthic_tunicateMarlin'),
        typLow: m(730, 'aquatic_benthic_tunicateMarlin'),
        typHigh: m(1095, 'aquatic_benthic_tunicateMarlin'),
        max: m(1095, 'aquatic_benthic_tunicateMarlin'),
      },
      gameCapDays: m(1095, 'aquatic_benthic_tunicateMarlin'),
      maturityDays: r(
        m(30, 'aquatic_benthic_tunicateMarlin'),
        m(90, 'aquatic_benthic_tunicateMarlin'),
      ),
      reproduction: {
        mode: 'budding',
        intervalDays: r(m(7, 'aquatic_benthic_tunicatePnas'), m(7, 'aquatic_benthic_tunicatePnas')),
      },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: m(14, 'aquatic_benthic_tunicatePnas'),
    },
    density: {
      typical: r(e(2, DOCS09_EST), e(5, DOCS09_EST)),
      max: e(10, DOCS09_EST),
      unit: 'individuals_per_100L',
    },
    diets: [
      { bacteria: 0.5, phytoplankton: 0.4, detritus: 0.1 },
      { phytoplankton: 0.6, bacteria: 0.3, detritus: 0.1 },
      { bacteria: 0.7, phytoplankton: 0.2, doc: 0.1 },
      { phytoplankton: 0.4, bacteria: 0.3, detritus: 0.3 },
    ],
    defenses: [['toxin'], ['armor'], ['toxin', 'armor'], ['camouflage']],
    habitats: [['sessile'], ['sessile', 'crevice']],
  },

  coral: {
    kind: 'cohort',
    latinStem: 'Acropor',
    nounZh: '珊瑚',
    flags: ['symbiont_host', 'calcifier'],
    massMg: r(
      e(10, 'fragment ≈ 5 cm² tissue at ≈ 2 mg AFDW/cm²'),
      e(1000, 'colony ≈ 500 cm² tissue at ≈ 2 mg AFDW/cm²'),
    ),
    typicalLengthMm: e(50, 'aquarium colony span; polyps 1 mm–3 cm (docs/09)'),
    tolerance: {
      temperatureC: r(
        m(15.7, 'aquatic_benthic_coralLimits'),
        e(
          32,
          'bleaching ≈ 1–2 °C above summer mean; reef weekly max 35.5 °C is transient',
          'aquatic_benthic_coralLimits',
        ),
      ),
      salinityPpt: r(
        m(25.4, 'aquatic_benthic_coralLimits'),
        m(41.1, 'aquatic_benthic_coralLimits'),
      ),
      ph: r(m(7.3, 'aquatic_benthic_coralLimits'), e(8.6, 'reef aquarium upper range')),
      nh3MaxMgL: d(0.029, 'aquatic_benthic_reefAmmonia', `chronic 0.035 mg/L UAN; ${NH3_AS_N}`),
      no2MaxMgL: e(5, 'nitrite toxicity low in seawater; no coral data collected'),
      o2MinMgL: m(0.69, 'aquatic_benthic_hypoxiaThresholds'),
    },
    lifeHistory: {
      lifespanDays: {
        min: e(730, 'small colonies lost to partial mortality within years'),
        typLow: e(3650, 'docs/09 §5 colonies live decades'),
        typHigh: e(7300, 'docs/09 §5 colony game cap (估)'),
        max: d(1556000, 'aquatic_benthic_coralGuinness', '4,265 yr × 365 d'),
      },
      gameCapDays: e(7300, 'docs/09 §5 colony game cap (估)'),
      maturityDays: r(e(730, DOCS09_EST), e(2920, DOCS09_EST)),
      reproduction: {
        mode: 'budding',
        intervalDays: r(
          e(7, 'continuous polyp budding in aquaria', 'aquatic_benthic_coralLaRochelle'),
          e(60, 'slow-growing LPS budding', 'aquatic_benthic_coralLaRochelle'),
        ),
      },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: m(1460, 'aquatic_benthic_coralHal'),
    },
    density: {
      typical: r(e(10, DOCS09_EST), e(30, DOCS09_EST)),
      max: e(40, DOCS09_EST),
      unit: 'individuals_per_100L',
    },
    diets: [
      { zooplankton: 0.5, phytoplankton: 0.2, bacteria: 0.2, doc: 0.1 },
      { zooplankton: 0.7, detritus: 0.3 },
      { bacteria: 0.4, doc: 0.3, detritus: 0.3 },
      { zooplankton: 0.4, food: 0.3, aquatic_invertebrate: 0.2, detritus: 0.1 },
    ],
    preySizeRatio: { min: 0.000001, opt: 0.0001, max: 0.05 },
    defenses: [['venom'], ['venom', 'mucus'], ['armor'], ['toxin']],
    habitats: [['sessile'], ['sessile', 'crevice']],
  },

  crayfish: {
    kind: 'cohort',
    latinStem: 'Procamb',
    nounZh: '螯蝦',
    flags: [],
    massMg: r(
      e(260, 'dwarf crayfish ≈ 1 g wet × Decapoda DW/WW 26.2%', 'aquatic_benthic_weightConversion'),
      e(
        105000,
        'large redclaw ≈ 400 g wet × Decapoda DW/WW 26.2%',
        'aquatic_benthic_weightConversion',
      ),
    ),
    typicalLengthMm: e(100, 'red swamp crayfish adult; dwarf 30–40 mm, redclaw to 250 mm'),
    tolerance: {
      temperatureC: r(
        e(4, 'temperate crayfish overwinter in cold water', 'aquatic_benthic_crayfishThermal'),
        e(
          33,
          'above culture range 16.9–28.5 °C; tropical redclaw tolerate low 30s',
          'aquatic_benthic_crayfishThermal',
        ),
      ),
      salinityPpt: r(
        e(0, 'freshwater (F class)'),
        e(15, 'red swamp crayfish tolerate brackish water'),
      ),
      ph: r(e(6, 'soft-water crayfish'), e(9, 'field records to pH ≈ 9.9 in macrophyte stands')),
      nh3MaxMgL: e(
        0.2,
        'crayfish ammonia tolerant; P. clarkii 96-h LC50 135–300 mg/L total ammonia (pH not reported)',
      ),
      no2MaxMgL: e(
        0.5,
        'recommended holding level for adult P. clarkii; juvenile 96-h LC50 5.94 mg/L (Hymel 1985, secondary)',
      ),
      o2MinMgL: e(
        1.5,
        'P. clarkii persists at ≈ 1.4 mg O2/L in the field; marine decapod mean LC50 2.45',
        'aquatic_benthic_hypoxiaThresholds',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: m(365, 'aquatic_benthic_crayfishRedSwamp'),
        typLow: m(730, 'aquatic_benthic_crayfishRedSwamp'),
        typHigh: m(1825, 'aquatic_benthic_crayfishRedSwamp'),
        max: m(2190, 'aquatic_benthic_crayfishRedSwamp'),
      },
      gameCapDays: m(2190, 'aquatic_benthic_crayfishRedSwamp'),
      maturityDays: r(
        m(90, 'aquatic_benthic_crayfishDwarfAmazonas'),
        m(365, 'aquatic_benthic_crayfishRedSwamp'),
      ),
      reproduction: {
        mode: 'brood',
        clutch: r(
          m(20, 'aquatic_benthic_crayfishDwarfGarnelio'),
          m(800, 'aquatic_benthic_crayfishRedclaw'),
        ),
        intervalDays: r(
          e(30, '3–5 redclaw broods per season over ≈ 150 d', 'aquatic_benthic_crayfishRedclaw'),
          e(50, '3–5 redclaw broods per season over ≈ 150 d', 'aquatic_benthic_crayfishRedclaw'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: r(
        d(0.5, 'aquatic_benthic_crayfishRedclaw', 'redclaw one per 200 L × 100 / 200'),
        d(6.7, 'aquatic_benthic_crayfishDwarfGarnelio', 'dwarf pair per 30 L × 100 / 30'),
      ),
      max: m(10, 'aquatic_benthic_crayfishDwarfGarnelio'),
      unit: 'individuals_per_100L',
    },
    minEnclosure: {
      waterVolumeL: m(30, 'aquatic_benthic_crayfishDwarfGarnelio'),
      adultsPerEnclosure: m(2, 'aquatic_benthic_crayfishDwarfGarnelio'),
    },
    diets: [
      { detritus: 0.3, plant: 0.3, litter: 0.2, aquatic_invertebrate: 0.2 },
      { carrion: 0.3, food: 0.3, detritus: 0.2, aquatic_invertebrate: 0.2 },
      { aquatic_invertebrate: 0.3, mollusc: 0.2, plant: 0.2, detritus: 0.2, fish: 0.1 },
      { plant: 0.4, litter: 0.3, detritus: 0.2, egg: 0.1 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.05, max: 1 },
    defenses: [['armor'], ['armor', 'size'], ['armor', 'hiding'], ['armor', 'autotomy']],
    habitats: [
      ['benthic', 'burrow'],
      ['benthic', 'crevice'],
    ],
  },

  mantis_shrimp: {
    kind: 'cohort',
    latinStem: 'Gonodact',
    nounZh: '蝦蛄',
    flags: ['territorial'],
    massMg: r(
      e(
        790,
        '4 cm stomatopod ≈ 3 g wet × Decapoda DW/WW 26.2%',
        'aquatic_benthic_weightConversion',
      ),
      e(
        3900,
        '9 cm stomatopod ≈ 15 g wet × Decapoda DW/WW 26.2%',
        'aquatic_benthic_weightConversion',
      ),
    ),
    typicalLengthMm: m(70, 'aquatic_benthic_mantisAdw'),
    tolerance: {
      temperatureC: r(e(20, 'tropical reef stomatopods'), e(30, 'tropical reef stomatopods')),
      salinityPpt: r(e(28, 'stenohaline reef crustacean'), e(38, 'reef seawater upper range')),
      ph: r(e(7.6, 'reef aquarium range'), e(8.6, 'reef aquarium range')),
      nh3MaxMgL: d(
        0.16,
        'aquatic_benthic_shrimpAmmonia',
        'L. vannamei safe level at 35 ppt applied to marine stomatopods',
      ),
      no2MaxMgL: d(
        25.7,
        'aquatic_benthic_shrimpNitrite',
        'L. vannamei safe level at 35 ppt applied to marine stomatopods',
      ),
      o2MinMgL: m(2.45, 'aquatic_benthic_hypoxiaThresholds'),
    },
    lifeHistory: {
      lifespanDays: {
        min: m(1095, 'aquatic_benthic_mantisSeaLifeBase'),
        typLow: m(1460, 'aquatic_benthic_mantisSeaLifeBase'),
        typHigh: m(2555, 'aquatic_benthic_mantisSeaLifeBase'),
        max: m(2920, 'aquatic_benthic_mantisSeaLifeBase'),
      },
      gameCapDays: m(2920, 'aquatic_benthic_mantisSeaLifeBase'),
      maturityDays: r(e(300, DOCS09_EST), e(365, DOCS09_EST)),
      reproduction: {
        mode: 'brood',
        clutch: r(e(1000, 'small gonodactylid egg mass'), m(50000, 'aquatic_benthic_mantisAdw')),
        intervalDays: r(e(60, 'repeat brooding within a season'), e(365, 'annual brood')),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: r(m(1, 'aquatic_benthic_mantisAdw'), m(1, 'aquatic_benthic_mantisAdw')),
      max: m(1, 'aquatic_benthic_mantisAdw'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: e(40, 'nano reef tank for ≤ 9 cm stomatopods'),
      adultsPerEnclosure: m(1, 'aquatic_benthic_mantisAdw'),
    },
    diets: [
      { crustacean: 0.5, mollusc: 0.4, fish: 0.1 },
      { fish: 0.5, crustacean: 0.4, aquatic_invertebrate: 0.1 },
      { mollusc: 0.6, crustacean: 0.3, carrion: 0.1 },
      { crustacean: 0.4, aquatic_invertebrate: 0.3, fish: 0.2, carrion: 0.1 },
    ],
    preySizeRatio: { min: 0.005, opt: 0.1, max: 1 },
    defenses: [
      ['armor', 'hiding'],
      ['armor', 'size'],
      ['hiding', 'burrowing'],
      ['armor', 'burrowing'],
    ],
    habitats: [
      ['crevice', 'burrow'],
      ['burrow', 'infaunal'],
    ],
  },

  odonate_nymph: {
    kind: 'cohort',
    latinStem: 'Libellul',
    nounZh: '水蠆',
    flags: ['metamorphosis_exit'],
    massMg: r(
      e(6, 'damselfly larva ≈ 30 mg wet × insect DW/WW ≈ 20%'),
      e(100, 'dragonfly larva ≈ 0.5 g wet (docs/09) × insect DW/WW ≈ 20%'),
    ),
    typicalLengthMm: e(35, 'damselfly ≤ 25 mm, dragonfly ≈ 50 mm (docs/09)'),
    tolerance: {
      temperatureC: r(e(2, 'temperate larvae overwinter under ice'), e(32, 'warm pond larvae')),
      salinityPpt: r(e(0, 'freshwater (F class)'), e(5, 'few odonates tolerate oligohaline water')),
      ph: r(e(4.5, 'bog and acid-water species'), e(9, 'eutrophic ponds')),
      nh3MaxMgL: d(
        0.15,
        'aquatic_benthic_insectToxicity',
        `aquatic insect LC50 1.8 mg NH3/L; ${NH3_AS_N}; ${NH3_AF}`,
      ),
      no2MaxMgL: e(
        1,
        'freshwater macroinvertebrate 96-h LC50 0.25–2.4 mg NO2-N/L; odonates ammonia tolerant',
        'aquatic_benthic_odonateAmmonia',
      ),
      o2MinMgL: e(2, 'rectal-gill and caudal-lamella breathers; no LC50 collected'),
    },
    lifeHistory: {
      lifespanDays: {
        min: m(60, 'aquatic_benthic_odonateBds'),
        typLow: m(365, 'aquatic_benthic_odonateBds'),
        typHigh: m(730, 'aquatic_benthic_odonateBds'),
        max: m(3650, 'aquatic_benthic_odonateBds'),
      },
      gameCapDays: e(3650, 'docs/09 §5 aquatic-stage game cap (估)'),
      maturityDays: r(m(60, 'aquatic_benthic_odonateBds'), m(730, 'aquatic_benthic_odonateBds')),
      reproduction: {
        mode: 'eggs',
        clutch: r(
          e(100, 'adult oviposits outside the tank'),
          e(1000, 'adult oviposits outside the tank'),
        ),
      },
      senescence: 'metamorphosis_exit',
      recruitment: 'none',
      aquaticStageDays: r(
        m(60, 'aquatic_benthic_odonateBds'),
        m(730, 'aquatic_benthic_odonateBds'),
      ),
    },
    density: {
      typical: r(e(3, DOCS09_EST), e(6, DOCS09_EST)),
      max: e(10, DOCS09_EST),
      unit: 'individuals_per_100L',
    },
    diets: [
      { aquatic_invertebrate: 0.5, zooplankton: 0.3, crustacean: 0.2 },
      { aquatic_invertebrate: 0.4, crustacean: 0.3, fish: 0.2, amphibian: 0.1 },
      { zooplankton: 0.6, aquatic_invertebrate: 0.4 },
      { crustacean: 0.5, aquatic_invertebrate: 0.3, fish: 0.2 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.05, max: 0.5 },
    defenses: [['camouflage'], ['hiding'], ['camouflage', 'hiding'], ['autotomy']],
    habitats: [
      ['benthic', 'epiphytic'],
      ['infaunal', 'benthic'],
    ],
  },

  predatory_insect: {
    kind: 'cohort',
    latinStem: 'Dytisc',
    nounZh: '龍蝨',
    flags: ['cannibal', 'air_breather'],
    massMg: r(
      e(50, '2 cm water scorpion ≈ 0.2 g wet × insect DW/WW ≈ 25%'),
      e(2000, '10 cm giant water bug ≈ 8 g wet × insect DW/WW ≈ 25%'),
    ),
    typicalLengthMm: e(35, 'diving beetle ≈ 30–35 mm; docs/09 range 2–10 cm'),
    tolerance: {
      temperatureC: r(e(4, 'temperate adults overwinter in water'), e(32, 'warm pond species')),
      salinityPpt: r(e(0, 'freshwater (F class)'), e(5, 'few species tolerate oligohaline water')),
      ph: r(e(4.5, 'acid-water species'), e(9, 'eutrophic ponds')),
      nh3MaxMgL: d(
        0.15,
        'aquatic_benthic_insectToxicity',
        `aquatic insect LC50 1.8 mg NH3/L; ${NH3_AS_N}; ${NH3_AF}`,
      ),
      no2MaxMgL: e(
        1,
        'freshwater macroinvertebrate 96-h LC50 0.25–2.4 mg NO2-N/L',
        'aquatic_benthic_insectToxicity',
      ),
      o2MinMgL: e(0.5, 'air breathers using surface air stores or siphons'),
    },
    lifeHistory: {
      lifespanDays: {
        min: m(365, 'aquatic_benthic_predInsectNepa'),
        typLow: m(365, 'aquatic_benthic_predInsectNepa'),
        typHigh: m(730, 'aquatic_benthic_predInsectBelostoma'),
        max: m(1095, 'aquatic_benthic_predInsectDytiscus'),
      },
      gameCapDays: m(1095, 'aquatic_benthic_predInsectDytiscus'),
      maturityDays: r(
        m(60, 'aquatic_benthic_predInsectNepa'),
        e(365, 'diving beetles need a land pupation site; univoltine'),
      ),
      reproduction: {
        mode: 'eggs',
        clutch: r(m(20, 'aquatic_benthic_predInsectNepa'), m(30, 'aquatic_benthic_predInsectNepa')),
        intervalDays: r(
          m(6, 'aquatic_benthic_predInsectBelostoma'),
          m(13, 'aquatic_benthic_predInsectBelostoma'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: r(e(1, DOCS09_EST), e(2, DOCS09_EST)),
      max: e(4, DOCS09_EST),
      unit: 'individuals_per_100L',
    },
    diets: [
      { aquatic_invertebrate: 0.4, fish: 0.3, amphibian: 0.2, crustacean: 0.1 },
      { aquatic_invertebrate: 0.6, crustacean: 0.2, zooplankton: 0.2 },
      { aquatic_invertebrate: 0.4, fish: 0.3, carrion: 0.3 },
      { mollusc: 0.5, aquatic_invertebrate: 0.3, crustacean: 0.2 },
    ],
    preySizeRatio: { min: 0.005, opt: 0.1, max: 2 },
    defenses: [['camouflage'], ['toxin'], ['venom'], ['hiding']],
    habitats: [
      ['pelagic', 'epiphytic'],
      ['benthic', 'epiphytic'],
    ],
  },
};
