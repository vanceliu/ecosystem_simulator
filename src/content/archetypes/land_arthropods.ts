import type { ArchetypeData } from '../archetype';
import { derived, estimated, measured } from '../sourced';
import type { ArchetypeGroups } from './groupTypes';

const DOCS09 = 'docs/09 §8 provisional value (估)';
const DAILY_LAYING = 'continuous layer: one reproductive event per day';

/** docs/02, docs/09: detritivore_mite, predatory_mite, fungus_gnat, fruit_fly, cricket, rove_beetle, darkling_beetle, spider, centipede, pseudoscorpion, ant */
export const LAND_ARTHROPODS: Readonly<
  Partial<Record<ArchetypeGroups['land_arthropods'], ArchetypeData>>
> = {
  detritivore_mite: {
    kind: 'cohort',
    latinStem: 'Tyroph',
    nounZh: '腐蟎',
    flags: [],
    massMg: {
      min: estimated(0.001, 'astigmatid ≈ 0.3 mm body, dry mass ≈ 1 µg (length–mass scaling)'),
      max: estimated(0.02, 'large oribatid ≈ 0.6 mm sclerotised body, dry mass ≈ 20 µg'),
    },
    typicalLengthMm: estimated(
      0.4,
      'docs/09 adult 0.3–0.5 mm midpoint',
      'land_arthropods_oribatidaWiki',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(
          5,
          'survives below the 10.8–12 °C development threshold',
          'land_arthropods_tyrophagusTemperature',
        ),
        max: measured(34, 'land_arthropods_tyrophagusTemperature'),
      },
      ph: {
        min: estimated(4, 'acid forest litter hosts dense oribatid communities'),
        max: estimated(8.5, 'calcareous soils and compost'),
      },
      humidityMinPercent: estimated(
        60,
        'life tables run at 45–85% RH; growth best at 80% RH',
        'land_arthropods_tyrophagusBran',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(21, 'land_arthropods_tyrophagusDiet'),
        typLow: estimated(60, DOCS09),
        typHigh: estimated(180, DOCS09),
        max: estimated(
          700,
          'docs/09 (估); oribatid generations last up to two years',
          'land_arthropods_oribatidaWiki',
        ),
      },
      gameCapDays: estimated(700, DOCS09),
      maturityDays: {
        min: estimated(9, 'docs/09: astigmatid egg to adult at 25–28 °C'),
        max: estimated(14, 'docs/09: astigmatid egg to adult at 25–28 °C'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(3, '≈ 140 lifetime eggs over ≈ 6 weeks of laying'),
          max: estimated(13, 'docs/09 maximum 528 lifetime eggs over ≈ 6 weeks of laying'),
        },
        intervalDays: { min: estimated(1, DAILY_LAYING), max: estimated(1, DAILY_LAYING) },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(32985, 'land_arthropods_oribatidDensity'),
        max: measured(117352, 'land_arthropods_oribatidDensity'),
      },
      max: estimated(400000, 'docs/09; outbreak on surplus food'),
      unit: 'individuals_per_m2',
    },
    diets: [
      { fungi: 0.5, detritus: 0.3, food: 0.2 },
      { food: 0.6, fungi: 0.3, detritus: 0.1 },
      { litter: 0.5, fungi: 0.3, detritus: 0.2 },
      { detritus: 0.4, fungi: 0.3, carrion: 0.3 },
    ],
    defenses: [['hiding'], ['armor'], ['armor', 'toxin'], ['burrowing']],
    habitats: [
      ['soil', 'leaf_litter'],
      ['ground', 'leaf_litter'],
    ],
  },

  predatory_mite: {
    kind: 'cohort',
    latinStem: 'Stratio',
    nounZh: '盾蟎',
    flags: [],
    massMg: {
      min: estimated(0.005, '0.4 mm laelapid, dry mass ≈ 5 µg (length–mass scaling)'),
      max: estimated(0.03, '1 mm laelapid or macrochelid, dry mass ≈ 30 µg'),
    },
    typicalLengthMm: measured(0.5, 'land_arthropods_stratiolaelapsWiki'),
    tolerance: {
      temperatureC: {
        min: estimated(
          10,
          'development slows sharply in cool substrate',
          'land_arthropods_stratiolaelapsWiki',
        ),
        max: estimated(32, 'greenhouse soil predator; reared at 21–25 °C'),
      },
      ph: {
        min: estimated(4.5, 'peat-based growing media'),
        max: estimated(8, 'mineral potting soils'),
      },
      humidityMinPercent: estimated(
        70,
        'adapted to moist media; reared at 70–80% RH',
        'land_arthropods_stratiolaelapsDiet',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(21, DOCS09),
        typLow: measured(27.3, 'land_arthropods_stratiolaelapsCabrera'),
        typHigh: estimated(30, DOCS09),
        max: estimated(42, DOCS09),
      },
      gameCapDays: estimated(60, DOCS09),
      maturityDays: {
        min: measured(9.7, 'land_arthropods_stratiolaelapsDiet'),
        max: measured(21, 'land_arthropods_stratiolaelapsDiet'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: derived(
            1.4,
            'land_arthropods_stratiolaelapsCabrera',
            '26.5 eggs ÷ 18.6 d oviposition',
          ),
          max: measured(3, 'land_arthropods_stratiolaelapsWiki'),
        },
        intervalDays: { min: estimated(1, DAILY_LAYING), max: estimated(1, DAILY_LAYING) },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(54, 'docs/09 soil density'),
        max: estimated(323, 'docs/09 soil density'),
      },
      max: estimated(1000, DOCS09),
      unit: 'individuals_per_m2',
    },
    diets: [
      { terrestrial_invertebrate: 0.8, egg: 0.2 },
      { terrestrial_invertebrate: 0.6, egg: 0.3, detritus: 0.1 },
      { terrestrial_invertebrate: 0.5, carrion: 0.3, egg: 0.2 },
      { terrestrial_invertebrate: 0.7, detritus: 0.2, carrion: 0.1 },
    ],
    preySizeRatio: { min: 0.05, opt: 0.5, max: 3 },
    defenses: [['hiding'], ['armor'], ['burrowing'], ['hiding', 'armor']],
    habitats: [['soil'], ['leaf_litter', 'ground']],
  },

  fungus_gnat: {
    kind: 'cohort',
    latinStem: 'Bradys',
    nounZh: '蕈蚊',
    flags: ['escapes_open_lid'],
    massMg: {
      min: estimated(0.02, '2 mm male sciarid, dry mass ≈ 20 µg (length–mass scaling)'),
      max: estimated(0.15, '4 mm gravid female sciarid, dry mass ≈ 150 µg'),
    },
    typicalLengthMm: estimated(3, 'docs/09 adult 2–4 mm midpoint'),
    tolerance: {
      temperatureC: {
        min: measured(10, 'land_arthropods_bradysiaKorea'),
        max: measured(30, 'land_arthropods_bradysiaDifformis'),
      },
      ph: {
        min: estimated(4.5, 'peat and mushroom substrates'),
        max: estimated(8, 'mineral potting soils'),
      },
      humidityMinPercent: estimated(
        70,
        'larvae need wet substrate; adults reared at 80% RH',
        'land_arthropods_bradysiaDifformis',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(3, 'land_arthropods_bradysiaKorea'),
        typLow: measured(4.2, 'land_arthropods_bradysiaKorea'),
        typHigh: measured(7, 'land_arthropods_bradysiaKorea'),
        max: measured(13.3, 'land_arthropods_bradysiaKorea'),
      },
      gameCapDays: estimated(35, DOCS09),
      maturityDays: {
        min: measured(19.1, 'land_arthropods_bradysiaKorea'),
        max: measured(22.2, 'land_arthropods_bradysiaKorea'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(82.7, 'land_arthropods_bradysiaKorea'),
          max: measured(131.8, 'land_arthropods_bradysiaKorea'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: { min: estimated(0, DOCS09), max: estimated(10, DOCS09) },
      max: estimated(1000, 'docs/09 (估); outbreak on wet substrate'),
      unit: 'individuals_per_m2',
    },
    diets: [
      { fungi: 0.6, plant: 0.2, detritus: 0.2 },
      { fungi: 0.4, detritus: 0.4, litter: 0.2 },
      { plant: 0.4, fungi: 0.4, detritus: 0.2 },
      { fungi: 0.5, detritus: 0.3, food: 0.2 },
    ],
    defenses: [['hiding'], ['burrowing'], ['hiding', 'burrowing'], ['camouflage']],
    habitats: [
      ['soil', 'aerial'],
      ['leaf_litter', 'aerial'],
    ],
  },

  fruit_fly: {
    kind: 'cohort',
    latinStem: 'Drosoph',
    nounZh: '果蠅',
    flags: ['escapes_open_lid'],
    massMg: {
      min: measured(0.219, 'land_arthropods_drosophilaDryMass'),
      max: estimated(
        0.6,
        'D. hydei ≈ 3 mm, about twice D. melanogaster dry mass',
        'land_arthropods_drosophilaDryMass',
      ),
    },
    typicalLengthMm: measured(2.5, 'land_arthropods_drosophilaWiki'),
    tolerance: {
      temperatureC: {
        min: measured(12, 'land_arthropods_drosophilaWiki'),
        max: measured(30, 'land_arthropods_drosophilaWiki'),
      },
      ph: {
        min: estimated(3.5, 'fermenting fruit substrate'),
        max: estimated(8, 'neutral to mildly alkaline substrate'),
      },
      humidityMinPercent: estimated(50, 'cultures kept moist; adults desiccate below ≈ 50% RH'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(20, DOCS09),
        typLow: estimated(30, DOCS09),
        typHigh: derived(
          41.5,
          'land_arthropods_drosophilaWiki',
          '≈ 50 d egg to death − 8.5 d egg to adult at 25 °C',
        ),
        max: estimated(60, DOCS09),
      },
      gameCapDays: estimated(75, DOCS09),
      maturityDays: {
        min: measured(7, 'land_arthropods_drosophilaWiki'),
        max: measured(19, 'land_arthropods_drosophilaWiki'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(40, 'docs/09 daily egg output'),
          max: measured(100, 'land_arthropods_drosophilaWiki'),
        },
        intervalDays: { min: estimated(1, DAILY_LAYING), max: estimated(1, DAILY_LAYING) },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(0, 'transient escapees from feeder cultures'),
        max: estimated(20, 'transient escapees from feeder cultures'),
      },
      max: estimated(300, 'enclosure with rotting fruit and closed lid'),
      unit: 'individuals_per_enclosure',
    },
    diets: [
      { fruit: 0.6, food: 0.2, fungi: 0.2 },
      { food: 0.6, fruit: 0.3, detritus: 0.1 },
      { fruit: 0.4, fungi: 0.4, detritus: 0.2 },
      { fungi: 0.6, fruit: 0.3, detritus: 0.1 },
    ],
    defenses: [['hiding'], ['camouflage'], ['hiding', 'camouflage'], ['burrowing']],
    habitats: [
      ['aerial', 'ground'],
      ['aerial', 'arboreal'],
    ],
  },

  cricket: {
    kind: 'cohort',
    latinStem: 'Achet',
    nounZh: '蟋蟀',
    flags: ['cannibal'],
    massMg: {
      min: derived(
        92,
        'land_arthropods_cricketDryMatter',
        '0.4 g wet (docs/09) × 22.9% dry matter',
      ),
      max: estimated(
        280,
        'Gryllus bimaculatus ≈ 1 g wet × 28.4% dry matter',
        'land_arthropods_cricketDryMatter',
      ),
    },
    typicalLengthMm: derived(18.5, 'land_arthropods_cricketWiki', 'midpoint of adult 16–21 mm'),
    tolerance: {
      temperatureC: {
        min: measured(18, 'land_arthropods_cricketTemperature'),
        max: measured(38, 'land_arthropods_cricketTemperature'),
      },
      ph: {
        min: estimated(5, 'egg-laying substrate'),
        max: estimated(8.5, 'egg-laying substrate'),
      },
      humidityMinPercent: estimated(
        40,
        'eggs need moist substrate; adults tolerate dry air',
        'land_arthropods_cricketWiki',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(20.19, 'land_arthropods_cricketTemperature'),
        typLow: estimated(30, DOCS09),
        typHigh: estimated(45, DOCS09),
        max: estimated(90, DOCS09),
      },
      gameCapDays: estimated(290, 'docs/09 (估): longest development plus adult life'),
      maturityDays: {
        min: measured(66.26, 'land_arthropods_cricketTemperature'),
        max: measured(200.5, 'land_arthropods_cricketTemperature'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: derived(
            2,
            'land_arthropods_cricketTemperature',
            '101 lifetime eggs at 18 °C ÷ ≈ 50 d laying',
          ),
          max: derived(
            30,
            'land_arthropods_cricketTemperature',
            '1,360 lifetime eggs at 26 °C ÷ ≈ 45 d laying',
          ),
        },
        intervalDays: { min: estimated(1, DAILY_LAYING), max: estimated(1, DAILY_LAYING) },
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: {
        min: estimated(0, 'docs/09: self-sustaining populations rare'),
        max: estimated(5, 'docs/09: self-sustaining populations rare'),
      },
      max: estimated(50, 'feeder escapees in a planted enclosure'),
      unit: 'individuals_per_enclosure',
    },
    diets: [
      { plant: 0.4, food: 0.3, detritus: 0.2, egg: 0.1 },
      { food: 0.5, fruit: 0.2, carrion: 0.2, egg: 0.1 },
      { plant: 0.3, litter: 0.3, terrestrial_invertebrate: 0.2, egg: 0.2 },
      { fruit: 0.3, plant: 0.3, carrion: 0.2, fungi: 0.2 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.02, max: 0.3 },
    defenses: [['hiding'], ['autotomy'], ['hiding', 'autotomy'], ['camouflage']],
    habitats: [
      ['ground', 'leaf_litter'],
      ['ground', 'burrow'],
    ],
  },

  rove_beetle: {
    kind: 'cohort',
    latinStem: 'Dalot',
    nounZh: '隱翅蟲',
    flags: ['cannibal'],
    massMg: {
      min: estimated(0.1, '3 mm slender staphylinid, dry mass ≈ 0.1 mg (length–mass scaling)'),
      max: estimated(0.5, '4.5 mm staphylinid, dry mass ≈ 0.5 mg'),
    },
    typicalLengthMm: derived(3.5, 'land_arthropods_dalotiaKsu', 'midpoint of adult 3–4 mm'),
    tolerance: {
      temperatureC: {
        min: estimated(12, 'greenhouse soil predator; development slows in cool media'),
        max: estimated(
          32,
          'life cycle completed in 11–12 d at 30 °C',
          'land_arthropods_dalotiaKsu',
        ),
      },
      ph: {
        min: estimated(4.5, 'peat-based growing media', 'land_arthropods_dalotiaKsu'),
        max: estimated(8, 'mineral potting soils'),
      },
      humidityMinPercent: estimated(
        70,
        'rearing medium kept moist at all times',
        'land_arthropods_dalotiaKsu',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(30, DOCS09),
        typLow: estimated(48, DOCS09),
        typHigh: measured(50, 'land_arthropods_dalotiaKsu'),
        max: estimated(60, DOCS09),
      },
      gameCapDays: estimated(80, DOCS09),
      maturityDays: {
        min: measured(11, 'land_arthropods_dalotiaKsu'),
        max: measured(22, 'land_arthropods_dalotiaKsu'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(1, 'low daily output on scarce prey'),
          max: derived(2.3, 'land_arthropods_dalotiaKsu', 'up to 114 eggs ÷ ≈ 50 d lifespan'),
        },
        intervalDays: { min: estimated(1, DAILY_LAYING), max: estimated(1, DAILY_LAYING) },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: { min: estimated(1, DOCS09), max: estimated(10, DOCS09) },
      max: estimated(100, DOCS09),
      unit: 'individuals_per_m2',
    },
    diets: [
      { terrestrial_invertebrate: 0.7, egg: 0.1, fungi: 0.1, detritus: 0.1 },
      { terrestrial_invertebrate: 0.8, egg: 0.2 },
      { terrestrial_invertebrate: 0.5, carrion: 0.2, fungi: 0.2, detritus: 0.1 },
      { terrestrial_invertebrate: 0.6, egg: 0.2, food: 0.2 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.3, max: 1.5 },
    defenses: [['hiding'], ['toxin'], ['burrowing'], ['hiding', 'toxin']],
    habitats: [
      ['soil', 'leaf_litter'],
      ['ground', 'leaf_litter'],
    ],
  },

  darkling_beetle: {
    kind: 'cohort',
    latinStem: 'Tenebr',
    nounZh: '擬步甲',
    flags: ['cannibal'],
    massMg: {
      min: estimated(
        2,
        'Alphitobius ≈ 6 mm, dry mass ≈ 2 mg (length–mass scaling)',
        'land_arthropods_mealwormDryMatter',
      ),
      max: estimated(
        250,
        'Zophobas ≈ 25 mm, ≈ 0.6 g wet × 42.2% dry matter',
        'land_arthropods_mealwormDryMatter',
      ),
    },
    typicalLengthMm: derived(
      15,
      'land_arthropods_mealwormWiki',
      'midpoint of Tenebrio adult 12.5–18 mm',
    ),
    tolerance: {
      temperatureC: {
        min: estimated(
          10,
          'no oviposition below 14 °C; adults survive cooler',
          'land_arthropods_tenebrioReview',
        ),
        max: estimated(35, 'growth optimum 25–28 °C', 'land_arthropods_tenebrioReview'),
      },
      ph: {
        min: estimated(5, 'dry grain and litter substrate'),
        max: estimated(8.5, 'dry grain and litter substrate'),
      },
      humidityMinPercent: estimated(
        30,
        'egg-laying drops at 20% RH; needs a dry zone',
        'land_arthropods_tenebrioReview',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(60, 'short-lived adults on poor food (2–3 months)'),
        typLow: measured(180, 'land_arthropods_mealwormWiki'),
        typHigh: measured(365, 'land_arthropods_mealwormWiki'),
        max: estimated(450, 'Zophobas adults outlive Tenebrio'),
      },
      gameCapDays: estimated(485, DOCS09),
      maturityDays: {
        min: estimated(60, 'docs/09 (估): Tenebrio egg to adult at 25–30 °C'),
        max: estimated(120, 'docs/09 (估): Tenebrio egg to adult at 25–30 °C'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(2, 'docs/09 lower 100 lifetime eggs over ≈ 2 months'),
          max: derived(5.6, 'land_arthropods_mealwormWiki', '≈ 500 lifetime eggs ÷ ≈ 90 d laying'),
        },
        intervalDays: { min: estimated(1, DAILY_LAYING), max: estimated(1, DAILY_LAYING) },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(0, 'docs/09: rare feeder escapees'),
        max: estimated(10, 'docs/09: rare feeder escapees'),
      },
      max: estimated(
        100,
        'enclosure with dry zone and surplus food',
        'land_arthropods_tenebrioWeight',
      ),
      unit: 'individuals_per_enclosure',
    },
    diets: [
      { detritus: 0.4, food: 0.3, litter: 0.2, carrion: 0.1 },
      { food: 0.5, plant: 0.2, fruit: 0.2, detritus: 0.1 },
      { litter: 0.4, detritus: 0.3, fungi: 0.2, carrion: 0.1 },
      { food: 0.3, plant: 0.2, detritus: 0.2, carrion: 0.2, egg: 0.1 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.01, max: 0.5 },
    defenses: [['armor'], ['toxin'], ['armor', 'toxin'], ['hiding']],
    habitats: [
      ['ground', 'leaf_litter'],
      ['ground', 'soil'],
    ],
  },

  spider: {
    kind: 'cohort',
    latinStem: 'Pholc',
    nounZh: '蛛',
    flags: ['cannibal'],
    massMg: {
      min: estimated(2, '7 mm pholcid, ≈ 7 mg wet × 0.3'),
      max: estimated(30, '10 mm hunting spider, ≈ 100 mg wet × 0.3'),
    },
    typicalLengthMm: measured(8, 'land_arthropods_pholcusWiki'),
    tolerance: {
      temperatureC: {
        min: estimated(8, 'synanthropic spider of unheated buildings'),
        max: estimated(35, 'tropical house-spider populations'),
      },
      ph: {
        min: estimated(4, 'not substrate-bound'),
        max: estimated(8.5, 'not substrate-bound'),
      },
      humidityMinPercent: estimated(40, 'house spider; tolerates dry indoor air'),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(223, 'land_arthropods_pholcusSunshineCoast'),
        typLow: estimated(400, DOCS09),
        typHigh: derived(
          730,
          'land_arthropods_pholcusWiki',
          'up to 2 years after maturity × 365 d',
        ),
        max: measured(774, 'land_arthropods_pholcusSunshineCoast'),
      },
      gameCapDays: estimated(1140, 'docs/09 (估): maturity plus maximum adult life'),
      maturityDays: {
        min: estimated(180, 'docs/09 (估) 6 months'),
        max: derived(365, 'land_arthropods_pholcusWiki', '≈ 1 year from birth to maturity'),
      },
      reproduction: {
        mode: 'brood',
        clutch: {
          min: estimated(20, 'docs/09 (估) eggs per sac'),
          max: measured(50, 'land_arthropods_pholcusSunshineCoast'),
        },
        intervalDays: {
          min: estimated(
            30,
            '2–8 sacs over the adult life',
            'land_arthropods_pholcusSunshineCoast',
          ),
          max: estimated(
            90,
            '2–8 sacs over the adult life',
            'land_arthropods_pholcusSunshineCoast',
          ),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: { min: estimated(0, DOCS09), max: estimated(2, DOCS09) },
      max: estimated(4, 'webs overlap but prey limits a small enclosure'),
      unit: 'individuals_per_enclosure',
    },
    diets: [
      { flying_insect: 0.7, terrestrial_invertebrate: 0.3 },
      { flying_insect: 0.5, terrestrial_invertebrate: 0.5 },
      { terrestrial_invertebrate: 0.6, flying_insect: 0.3, egg: 0.1 },
      { flying_insect: 0.9, egg: 0.1 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.1, max: 1.5 },
    defenses: [['venom'], ['venom', 'hiding'], ['venom', 'camouflage'], ['venom', 'autotomy']],
    habitats: [
      ['arboreal', 'aerial'],
      ['ground', 'leaf_litter'],
    ],
  },

  centipede: {
    kind: 'cohort',
    latinStem: 'Lithob',
    nounZh: '石蜈蚣',
    flags: [],
    massMg: {
      min: estimated(10, '18 mm lithobiid, ≈ 35 mg wet × 0.3'),
      max: estimated(30, '30 mm lithobiid, ≈ 100 mg wet × 0.3'),
    },
    typicalLengthMm: derived(24, 'land_arthropods_lithobiusWiki', 'midpoint of adult 18–30 mm'),
    tolerance: {
      temperatureC: {
        min: estimated(2, 'temperate litter species, active in cool months'),
        max: estimated(30, 'avoids warm, dry surface layers'),
      },
      ph: {
        min: estimated(4, 'acid woodland litter'),
        max: estimated(8, 'calcareous soils'),
      },
      humidityMinPercent: estimated(
        75,
        'lithobiids desiccate quickly; live under stones and logs',
        'land_arthropods_lithobiusWiki',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(1100, DOCS09),
        typLow: derived(1825, 'land_arthropods_lithobiusWiki', '5 years × 365 d'),
        typHigh: derived(2190, 'land_arthropods_lithobiusWiki', '6 years × 365 d'),
        max: estimated(2500, 'docs/09 longest lifespan'),
      },
      gameCapDays: estimated(2500, 'docs/09 game cap'),
      maturityDays: {
        min: estimated(540, 'docs/09 ≈ 730 d; 18 months in warm litter'),
        max: estimated(900, 'docs/09 ≈ 730 d; 30 months in cool litter'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(10, 'eggs laid singly in soil over a breeding bout'),
          max: estimated(25, 'docs/09 ≈ 25 eggs per year'),
        },
        intervalDays: {
          min: estimated(
            180,
            'one or two breeding bouts per year',
            'land_arthropods_lithobiusDensity',
          ),
          max: estimated(365, 'single autumn breeding peak', 'land_arthropods_lithobiusDensity'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(7.58, 'land_arthropods_lithobiusDensity'),
        max: measured(24.07, 'land_arthropods_lithobiusDensity'),
      },
      max: estimated(100, DOCS09),
      unit: 'individuals_per_m2',
    },
    diets: [
      { terrestrial_invertebrate: 0.8, flying_insect: 0.1, carrion: 0.1 },
      { terrestrial_invertebrate: 0.5, mollusc: 0.2, flying_insect: 0.2, carrion: 0.1 },
      { terrestrial_invertebrate: 0.7, flying_insect: 0.2, egg: 0.1 },
      { terrestrial_invertebrate: 0.9, carrion: 0.1 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.2, max: 1 },
    defenses: [['venom'], ['venom', 'autotomy'], ['venom', 'hiding'], ['venom', 'burrowing']],
    habitats: [
      ['leaf_litter', 'soil'],
      ['ground', 'crevice'],
    ],
  },

  pseudoscorpion: {
    kind: 'cohort',
    latinStem: 'Chelif',
    nounZh: '擬蠍',
    flags: [],
    massMg: {
      min: estimated(0.05, '1.5 mm chthoniid, dry mass ≈ 50 µg (length–mass scaling)'),
      max: estimated(1, '4.5 mm cheliferid, ≈ 3 mg wet × 0.3'),
    },
    typicalLengthMm: derived(3.5, 'land_arthropods_cheliferWiki', 'midpoint of body 2.5–4.5 mm'),
    tolerance: {
      temperatureC: {
        min: estimated(5, 'temperate litter and bark dweller'),
        max: estimated(
          32,
          'tolerates warm buildings and bird nests',
          'land_arthropods_cheliferWiki',
        ),
      },
      ph: {
        min: estimated(4, 'acid forest litter'),
        max: estimated(8, 'calcareous litter'),
      },
      humidityMinPercent: estimated(
        60,
        'litter species need humid microhabitat; house species tolerate drier air',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(365, DOCS09),
        typLow: estimated(730, DOCS09),
        typHigh: derived(
          1095,
          'land_arthropods_cheliferWiki',
          'adults usually live 3 years × 365 d',
        ),
        max: derived(1460, 'land_arthropods_cheliferWiki', 'adults live up to 4 years × 365 d'),
      },
      gameCapDays: derived(
        1460,
        'land_arthropods_cheliferWiki',
        'adults live up to 4 years × 365 d',
      ),
      maturityDays: {
        min: derived(304, 'land_arthropods_cheliferWiki', '10 months × 30.4 d'),
        max: derived(730, 'land_arthropods_cheliferWiki', '24 months × 30.4 d'),
      },
      reproduction: {
        mode: 'brood',
        clutch: {
          min: measured(20, 'land_arthropods_cheliferWiki'),
          max: measured(40, 'land_arthropods_cheliferWiki'),
        },
        intervalDays: {
          min: estimated(180, 'one or two broods per year'),
          max: estimated(365, 'one brood per year'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: { min: estimated(10, DOCS09), max: estimated(100, DOCS09) },
      max: estimated(500, DOCS09),
      unit: 'individuals_per_m2',
    },
    diets: [
      { terrestrial_invertebrate: 0.9, egg: 0.1 },
      { terrestrial_invertebrate: 0.7, flying_insect: 0.3 },
      { terrestrial_invertebrate: 0.8, egg: 0.2 },
      { terrestrial_invertebrate: 0.6, flying_insect: 0.2, egg: 0.2 },
    ],
    preySizeRatio: { min: 0.01, opt: 0.2, max: 1 },
    defenses: [['venom'], ['venom', 'hiding'], ['venom', 'armor'], ['venom', 'burrowing']],
    habitats: [
      ['leaf_litter', 'soil'],
      ['crevice', 'arboreal'],
    ],
  },

  ant: {
    kind: 'cohort',
    latinStem: 'Formic',
    nounZh: '蟻',
    flags: ['territorial'],
    massMg: {
      min: estimated(0.02, '1 mm worker (ghost or pharaoh ant), dry mass ≈ 20 µg'),
      max: estimated(1.5, '5 mm worker, ≈ 5 mg wet × 0.3'),
    },
    typicalLengthMm: estimated(3, 'docs/09 worker 1–5 mm midpoint'),
    tolerance: {
      temperatureC: {
        min: estimated(10, 'workers forage above ≈ 10 °C'),
        max: estimated(40, 'tropical tramp ants forage on warm surfaces'),
      },
      ph: {
        min: estimated(4, 'nests in acid to alkaline soils'),
        max: estimated(9, 'nests in acid to alkaline soils'),
      },
      humidityMinPercent: estimated(
        30,
        'invading species range from dry pavement to moist substrate',
        'land_arthropods_bioDudeAnts',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(60, DOCS09),
        typLow: estimated(120, DOCS09),
        typHigh: derived(365, 'land_arthropods_antWiki', 'lower end of 1–3 year worker lifespan'),
        max: estimated(365, 'docs/09 worker game cap'),
      },
      gameCapDays: estimated(365, 'docs/09 worker cap (估); colony 3,650 d'),
      maturityDays: {
        min: estimated(30, 'worker egg to adult in warm nests'),
        max: estimated(60, 'worker egg to adult in cool nests'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(10, 'queen daily egg output, small colony'),
          max: estimated(100, 'queen daily egg output, established colony'),
        },
        intervalDays: { min: estimated(1, DAILY_LAYING), max: estimated(1, DAILY_LAYING) },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(0, 'docs/09: invader, absent in a closed enclosure'),
        max: estimated(0, 'docs/09: invader, absent in a closed enclosure'),
      },
      max: estimated(500, 'docs/09: one colony; workers foraging in one enclosure'),
      unit: 'individuals_per_enclosure',
    },
    diets: [
      { terrestrial_invertebrate: 0.3, food: 0.3, fruit: 0.2, carrion: 0.2 },
      { terrestrial_invertebrate: 0.5, carrion: 0.3, egg: 0.2 },
      { food: 0.5, fruit: 0.3, terrestrial_invertebrate: 0.2 },
      { plant: 0.2, food: 0.3, terrestrial_invertebrate: 0.3, carrion: 0.2 },
    ],
    preySizeRatio: { min: 0.05, opt: 0.5, max: 5 },
    defenses: [['venom'], ['venom', 'armor'], ['toxin'], ['armor', 'hiding']],
    habitats: [
      ['ground', 'soil'],
      ['ground', 'arboreal'],
    ],
  },
};
