import type { ArchetypeData, SourcedRange } from '../archetype';
import { derived, estimated, measured, type Sourced } from '../sourced';
import type { SourceId } from '../sources';
import type { ArchetypeGroups } from './groupTypes';

const DAYS_PER_YEAR = 365;
const MG_PER_KG = 1e6;
const FISH_DRY_FRACTION = 0.25;
const CEPHALOPOD_DRY_FRACTION = 0.2;
const DECAPOD_DRY_FRACTION = 0.25;
const DOCS09 = 'docs/09 §10';

const range = (min: Sourced, max: Sourced): SourcedRange => ({ min, max });

const years = (value: number, source: SourceId): Sourced =>
  derived(value * DAYS_PER_YEAR, source, `${value} years × ${DAYS_PER_YEAR}`);

const yearsEstimated = (value: number, note: string, source?: SourceId): Sourced =>
  estimated(value * DAYS_PER_YEAR, `${note}; ${value} years × ${DAYS_PER_YEAR}`, source);

const dryMass = (wetKg: number, fraction: number, source: SourceId): Sourced =>
  derived(
    Math.round(wetKg * fraction * MG_PER_KG),
    source,
    `${wetKg} kg wet mass × ${fraction} dry fraction × 10⁶ mg/kg`,
  );

const dryMassEstimated = (wetKg: number, fraction: number, note: string): Sourced =>
  estimated(
    Math.round(wetKg * fraction * MG_PER_KG),
    `${note}; ${wetKg} kg wet mass × ${fraction} dry fraction × 10⁶ mg/kg`,
  );

/** specific gravity at 25 °C → practical salinity (UNESCO seawater density table) */
type SpecificGravity = '1.020' | '1.023' | '1.025';
const SG_TO_PPT: Readonly<Record<SpecificGravity, number>> = {
  '1.020': 27,
  '1.023': 31,
  '1.025': 34,
};
const sgPpt = (sg: SpecificGravity, source: SourceId): Sourced =>
  derived(
    SG_TO_PPT[sg],
    source,
    `specific gravity ${sg} at 25 °C converted to salinity via the seawater density table`,
  );

const REEF_FISH_NH3 =
  'no species data; set below the Epinephelus coioides juvenile safe free-NH3 level 0.21 mg/L';
const REEF_FISH_NO2 =
  'no species data; marine teleosts tolerate nitrite well in seawater (E. coioides safe level ≈ 6 mg N/L)';
const CEPHALOPOD_WATER =
  'no toxicity data for adults; cephalopods are kept far below fish limits in husbandry';

export const LARGE_MARINE: Readonly<
  Partial<Record<ArchetypeGroups['large_marine'], ArchetypeData>>
> = {
  grouper: {
    kind: 'cohort',
    latinStem: 'Epinephel',
    nounZh: '石斑',
    flags: ['territorial'],
    massMg: range(
      dryMass(2, FISH_DRY_FRACTION, 'large_marine_pantherGrouper'),
      dryMass(3.5, FISH_DRY_FRACTION, 'large_marine_pantherGrouper'),
    ),
    typicalLengthMm: derived(600, 'large_marine_pantherGrouper', 'midpoint of adult 50–70 cm'),
    tolerance: {
      temperatureC: range(
        estimated(
          18,
          'care range 22–26 °C widened for subtropical Epinephelus',
          'large_marine_liveaquariaPantherGrouper',
        ),
        estimated(
          32,
          'E. coioides reared at 26.5–30 °C; upper limit set 2 °C above',
          'large_marine_caberoy2000',
        ),
      ),
      salinityPpt: range(
        measured(8, 'large_marine_caberoy2000'),
        measured(40, 'large_marine_caberoy2000'),
      ),
      ph: range(
        estimated(
          7.8,
          'care minimum pH 8.1 widened by 0.3',
          'large_marine_liveaquariaPantherGrouper',
        ),
        measured(8.4, 'large_marine_liveaquariaPantherGrouper'),
      ),
      nh3MaxMgL: derived(
        0.173,
        'large_marine_zheng2012',
        'safe free NH3 0.21 mg NH3/L × 14/17 to mg NH3-N/L',
      ),
      no2MaxMgL: derived(
        6.3,
        'large_marine_zheng2012',
        'safe nitrite 20.8 mg/L for 10.5 cm fry, read as NO₂⁻, × 14/46 to mg N/L',
      ),
      o2MinMgL: estimated(
        4,
        'toxicity tests held at 4.5–5.5 mg/L; minimum set slightly below',
        'large_marine_zheng2012',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(9, 'large_marine_pantherGrouper'),
        typLow: years(15, 'large_marine_pantherGrouper'),
        typHigh: years(15, 'large_marine_pantherGrouper'),
        max: years(37, 'large_marine_pantherGrouper'),
      },
      gameCapDays: years(37, 'large_marine_pantherGrouper'),
      maturityDays: range(
        yearsEstimated(2, `${DOCS09} 2–3 years（估）; protogynous`),
        yearsEstimated(3, `${DOCS09} 2–3 years（估）; protogynous`),
      ),
      reproduction: { mode: 'eggs' },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(
        measured(1, 'large_marine_pantherGrouper'),
        measured(1, 'large_marine_pantherGrouper'),
      ),
      max: measured(1, 'large_marine_pantherGrouper'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(240, `${DOCS09} 缸長 240 cm（估）`),
      waterVolumeL: measured(680, 'large_marine_pantherGrouper'),
      adultsPerEnclosure: measured(1, 'large_marine_pantherGrouper'),
    },
    diets: [
      { fish: 0.6, crustacean: 0.4 },
      { fish: 0.85, crustacean: 0.15 },
      { crustacean: 0.6, fish: 0.3, mollusc: 0.1 },
      { fish: 0.5, crustacean: 0.3, food: 0.2 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.03, max: 0.15 },
    defenses: [['size'], ['camouflage', 'size'], ['hiding', 'size'], ['camouflage']],
    habitats: [
      ['crevice', 'benthic'],
      ['benthic', 'pelagic'],
    ],
  },

  lionfish: {
    kind: 'cohort',
    latinStem: 'Pteroi',
    nounZh: '獅子魚',
    flags: [],
    massMg: range(
      dryMassEstimated(0.5, FISH_DRY_FRACTION, `${DOCS09} adult 0.5–1.2 kg`),
      dryMassEstimated(1.2, FISH_DRY_FRACTION, `${DOCS09} adult 0.5–1.2 kg`),
    ),
    typicalLengthMm: estimated(380, `${DOCS09} adult 30–47 cm; midpoint`),
    tolerance: {
      temperatureC: range(
        measured(10, 'large_marine_kimball2004'),
        estimated(
          32,
          'tropical reef species; chronic upper limit well below acute CTmax ≈ 39.5 °C',
        ),
      ),
      salinityPpt: range(
        measured(7, 'large_marine_jud2015'),
        estimated(40, 'no upper-limit data; set at hypersaline reef-lagoon level'),
      ),
      ph: range(
        estimated(7.8, 'no data; typical marine aquarium tolerance'),
        estimated(8.4, 'no data; typical marine aquarium tolerance'),
      ),
      nh3MaxMgL: estimated(0.1, REEF_FISH_NH3, 'large_marine_zheng2012'),
      no2MaxMgL: estimated(5, REEF_FISH_NO2, 'large_marine_zheng2012'),
      o2MinMgL: estimated(3.5, 'no data; sit-and-wait predator with low activity'),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimated(5, `${DOCS09} 5／10／15+; not stated in cited reproduction study`),
        typLow: yearsEstimated(10, `${DOCS09} 5／10／15+`),
        typHigh: yearsEstimated(10, `${DOCS09} 5／10／15+`),
        max: yearsEstimated(15, `${DOCS09} 5／10／15+`),
      },
      gameCapDays: yearsEstimated(15, `${DOCS09} game cap 5,475 days`),
      maturityDays: range(
        estimated(270, 'males mature at ≥ 100 mm TL, before 1 year', 'large_marine_gardner2015'),
        measured(365, 'large_marine_gardner2015'),
      ),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          measured(1800, 'large_marine_gardner2015'),
          measured(41945, 'large_marine_gardner2015'),
        ),
        intervalDays: range(
          measured(2, 'large_marine_gardner2015'),
          measured(4.1, 'large_marine_gardner2015'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(estimated(1, `${DOCS09} 每缸 1`), estimated(1, `${DOCS09} 每缸 1`)),
      max: estimated(1, `${DOCS09} 每缸 1`),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(150, `${DOCS09} 缸長 150 cm（估）`),
      waterVolumeL: estimated(450, `${DOCS09} 450 L; aquarium guidance ≈ 120 gal`),
      adultsPerEnclosure: estimated(1, `${DOCS09} 每缸 1`),
    },
    diets: [
      { fish: 0.7, crustacean: 0.3 },
      { crustacean: 0.6, fish: 0.4 },
      { fish: 0.9, crustacean: 0.1 },
      { fish: 0.5, crustacean: 0.4, aquatic_invertebrate: 0.1 },
    ],
    preySizeRatio: { min: 0.0005, opt: 0.01, max: 0.1 },
    defenses: [
      ['venom', 'spines'],
      ['venom', 'spines', 'camouflage'],
      ['venom', 'spines', 'size'],
      ['venom', 'spines', 'hiding'],
    ],
    habitats: [
      ['crevice', 'pelagic'],
      ['benthic', 'crevice'],
    ],
  },

  tang: {
    kind: 'cohort',
    latinStem: 'Acanthur',
    nounZh: '倒吊',
    flags: ['territorial'],
    massMg: range(
      dryMass(0.1, FISH_DRY_FRACTION, 'large_marine_biotaTang'),
      dryMass(2, FISH_DRY_FRACTION, 'large_marine_biotaTang'),
    ),
    typicalLengthMm: estimated(300, `${DOCS09} adult 18–45 cm; geometric midpoint`),
    tolerance: {
      temperatureC: range(
        estimated(21, 'no data; tropical reef grazer'),
        estimated(30, 'no data; tropical reef grazer'),
      ),
      salinityPpt: range(
        estimated(27, 'no data; stenohaline reef fish, aquarium sg ≥ 1.020'),
        estimated(37, 'no data; stenohaline reef fish'),
      ),
      ph: range(
        estimated(7.9, 'no data; typical reef aquarium tolerance'),
        estimated(8.4, 'no data; typical reef aquarium tolerance'),
      ),
      nh3MaxMgL: estimated(
        0.05,
        `${REEF_FISH_NH3}; tangs are sensitive reef fish`,
        'large_marine_zheng2012',
      ),
      no2MaxMgL: estimated(3, REEF_FISH_NO2, 'large_marine_zheng2012'),
      o2MinMgL: estimated(5, 'no data; active diurnal reef grazer'),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(5, 'large_marine_biotaTang'),
        typLow: years(15, 'large_marine_biotaTang'),
        typHigh: years(15, 'large_marine_biotaTang'),
        max: years(40, 'large_marine_biotaTang'),
      },
      gameCapDays: years(40, 'large_marine_biotaTang'),
      maturityDays: range(
        estimated(300, `${DOCS09} about 1 year（估）`),
        estimated(450, `${DOCS09} about 1 year（估）`),
      ),
      reproduction: { mode: 'eggs' },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(measured(1, 'large_marine_biotaTang'), measured(1, 'large_marine_biotaTang')),
      max: measured(1, 'large_marine_biotaTang'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(180, 'large_marine_biotaTang'),
      waterVolumeL: measured(380, 'large_marine_biotaTang'),
      adultsPerEnclosure: measured(1, 'large_marine_biotaTang'),
    },
    diets: [
      { periphyton: 0.6, macroalgae: 0.4 },
      { macroalgae: 0.7, periphyton: 0.3 },
      { periphyton: 0.5, macroalgae: 0.3, detritus: 0.2 },
      { periphyton: 0.5, macroalgae: 0.3, food: 0.2 },
    ],
    defenses: [['spines'], ['spines', 'schooling'], ['spines', 'hiding'], ['spines', 'size']],
    habitats: [
      ['pelagic', 'benthic'],
      ['pelagic', 'crevice'],
    ],
  },

  triggerfish: {
    kind: 'cohort',
    latinStem: 'Balistoid',
    nounZh: '炮彈魚',
    flags: ['territorial'],
    massMg: range(
      dryMassEstimated(1, FISH_DRY_FRACTION, `${DOCS09} adult 1–2 kg`),
      dryMassEstimated(2, FISH_DRY_FRACTION, `${DOCS09} adult 1–2 kg`),
    ),
    typicalLengthMm: derived(
      400,
      'large_marine_fishbaseClownTrigger',
      'max 50 cm TL × 0.8 for typical adult',
    ),
    tolerance: {
      temperatureC: range(
        estimated(
          20,
          'care range 22.2–25.6 °C widened 2 °C',
          'large_marine_liveaquariaClownTrigger',
        ),
        estimated(
          30,
          'care range 22.2–25.6 °C widened for tropical reef fish',
          'large_marine_liveaquariaClownTrigger',
        ),
      ),
      salinityPpt: range(
        sgPpt('1.020', 'large_marine_liveaquariaClownTrigger'),
        sgPpt('1.025', 'large_marine_liveaquariaClownTrigger'),
      ),
      ph: range(
        measured(8.1, 'large_marine_liveaquariaClownTrigger'),
        measured(8.4, 'large_marine_liveaquariaClownTrigger'),
      ),
      nh3MaxMgL: estimated(0.1, REEF_FISH_NH3, 'large_marine_zheng2012'),
      no2MaxMgL: estimated(5, REEF_FISH_NO2, 'large_marine_zheng2012'),
      o2MinMgL: estimated(4, 'no data; active reef predator'),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimated(8, `${DOCS09} 8／12／20`, 'large_marine_fishbaseClownTrigger'),
        typLow: yearsEstimated(12, `${DOCS09} 8／12／20`, 'large_marine_fishbaseClownTrigger'),
        typHigh: yearsEstimated(12, `${DOCS09} 8／12／20`, 'large_marine_fishbaseClownTrigger'),
        max: yearsEstimated(20, `${DOCS09} 8／12／20`, 'large_marine_fishbaseClownTrigger'),
      },
      gameCapDays: yearsEstimated(20, `${DOCS09} game cap 7,300 days`),
      maturityDays: range(
        yearsEstimated(1, `${DOCS09} 1–2 years（估）`),
        yearsEstimated(2, `${DOCS09} 1–2 years（估）`),
      ),
      reproduction: { mode: 'eggs' },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(
        measured(1, 'large_marine_liveaquariaClownTrigger'),
        measured(1, 'large_marine_liveaquariaClownTrigger'),
      ),
      max: measured(1, 'large_marine_liveaquariaClownTrigger'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(120, `${DOCS09} footprint 120 × 120 cm`),
      waterVolumeL: estimated(
        900,
        `${DOCS09} 900 L; LiveAquaria lists 300 gal`,
        'large_marine_liveaquariaClownTrigger',
      ),
      adultsPerEnclosure: measured(1, 'large_marine_liveaquariaClownTrigger'),
    },
    diets: [
      { echinoderm: 0.4, crustacean: 0.35, mollusc: 0.25 },
      { crustacean: 0.5, mollusc: 0.3, echinoderm: 0.2 },
      { mollusc: 0.5, crustacean: 0.3, sessile_invertebrate: 0.2 },
      { crustacean: 0.4, echinoderm: 0.2, macroalgae: 0.2, fish: 0.2 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.02, max: 0.2 },
    defenses: [['armor', 'spines'], ['armor', 'hiding'], ['armor', 'spines', 'size'], ['armor']],
    habitats: [
      ['benthic', 'crevice'],
      ['pelagic', 'benthic'],
    ],
  },

  moray: {
    kind: 'cohort',
    latinStem: 'Gymnothor',
    nounZh: '鯙',
    flags: ['territorial'],
    massMg: range(
      dryMassEstimated(0.3, FISH_DRY_FRACTION, 'no data; small snowflake-type moray'),
      dryMassEstimated(3, FISH_DRY_FRACTION, 'no data; 1 m class moray'),
    ),
    typicalLengthMm: estimated(
      600,
      'snowflake eel wild ≤ 100 cm, captive mostly < 60 cm',
      'large_marine_liveaquariaSnowflakeEel',
    ),
    tolerance: {
      temperatureC: range(
        estimated(
          20,
          'care range 22.2–25.6 °C widened 2 °C',
          'large_marine_liveaquariaSnowflakeEel',
        ),
        estimated(
          30,
          'care range 22.2–25.6 °C widened for tropical reef fish',
          'large_marine_liveaquariaSnowflakeEel',
        ),
      ),
      salinityPpt: range(
        sgPpt('1.020', 'large_marine_liveaquariaSnowflakeEel'),
        sgPpt('1.025', 'large_marine_liveaquariaSnowflakeEel'),
      ),
      ph: range(
        measured(8.1, 'large_marine_liveaquariaSnowflakeEel'),
        measured(8.4, 'large_marine_liveaquariaSnowflakeEel'),
      ),
      nh3MaxMgL: estimated(0.15, `${REEF_FISH_NH3}; hardy species`, 'large_marine_zheng2012'),
      no2MaxMgL: estimated(6, REEF_FISH_NO2, 'large_marine_zheng2012'),
      o2MinMgL: estimated(3.5, 'no data; sedentary crevice dweller'),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimated(10, `${DOCS09} 10／20／30; not listed by cited care sheet`),
        typLow: yearsEstimated(20, `${DOCS09} 10／20／30`),
        typHigh: yearsEstimated(20, `${DOCS09} 10／20／30`),
        max: yearsEstimated(30, `${DOCS09} 10／20／30`),
      },
      gameCapDays: yearsEstimated(30, `${DOCS09} game cap 10,950 days`),
      maturityDays: range(
        yearsEstimated(2, `${DOCS09} 2–4 years（估）`),
        yearsEstimated(4, `${DOCS09} 2–4 years（估）`),
      ),
      reproduction: { mode: 'eggs' },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(
        measured(1, 'large_marine_liveaquariaSnowflakeEel'),
        measured(1, 'large_marine_liveaquariaSnowflakeEel'),
      ),
      max: measured(1, 'large_marine_liveaquariaSnowflakeEel'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(120, `${DOCS09} 缸長 120 cm for small species`),
      waterVolumeL: derived(190, 'large_marine_liveaquariaSnowflakeEel', '50 gal × 3.785 L/gal'),
      adultsPerEnclosure: measured(1, 'large_marine_liveaquariaSnowflakeEel'),
    },
    diets: [
      { fish: 0.6, crustacean: 0.4 },
      { crustacean: 0.7, fish: 0.3 },
      { fish: 0.5, crustacean: 0.3, mollusc: 0.2 },
      { fish: 0.4, crustacean: 0.4, carrion: 0.2 },
    ],
    preySizeRatio: { min: 0.002, opt: 0.03, max: 0.2 },
    defenses: [
      ['hiding', 'mucus'],
      ['hiding', 'size'],
      ['camouflage', 'hiding', 'mucus'],
      ['hiding', 'mucus', 'size'],
    ],
    habitats: [
      ['crevice', 'benthic'],
      ['burrow', 'crevice'],
    ],
  },

  benthic_shark: {
    kind: 'cohort',
    latinStem: 'Chiloscyl',
    nounZh: '竹鯊',
    flags: [],
    massMg: range(
      dryMassEstimated(2, FISH_DRY_FRACTION, `${DOCS09} adult 2–4 kg`),
      dryMassEstimated(4, FISH_DRY_FRACTION, `${DOCS09} adult 2–4 kg`),
    ),
    typicalLengthMm: derived(
      1000,
      'large_marine_frdcBambooShark',
      'between maturity 82–87 cm TL and max 132 cm TL',
    ),
    tolerance: {
      temperatureC: range(
        estimated(18, 'no data; tropical to warm-temperate inshore range'),
        estimated(30, 'no data; reef-flat species'),
      ),
      salinityPpt: range(
        estimated(28, 'no data; inshore and intertidal habitats'),
        estimated(37, 'no data; inshore and intertidal habitats'),
      ),
      ph: range(
        estimated(7.8, 'no data; typical marine aquarium tolerance'),
        estimated(8.4, 'no data; typical marine aquarium tolerance'),
      ),
      nh3MaxMgL: estimated(
        0.05,
        'no data; elasmobranchs treated as ammonia-sensitive in husbandry',
      ),
      no2MaxMgL: estimated(5, REEF_FISH_NO2, 'large_marine_zheng2012'),
      o2MinMgL: estimated(
        2,
        'tolerates cyclic reef-flat hypoxia and short anoxia',
        'large_marine_chapman2011',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimated(
          15,
          `${DOCS09} 15／20／25; FRDC longevity ≥ 16 years`,
          'large_marine_frdcBambooShark',
        ),
        typLow: yearsEstimated(20, `${DOCS09} 15／20／25`, 'large_marine_frdcBambooShark'),
        typHigh: yearsEstimated(20, `${DOCS09} 15／20／25`, 'large_marine_frdcBambooShark'),
        max: yearsEstimated(25, `${DOCS09} 15／20／25`, 'large_marine_frdcBambooShark'),
      },
      gameCapDays: yearsEstimated(25, `${DOCS09} game cap 9,125 days`),
      maturityDays: range(
        yearsEstimated(4, `${DOCS09} 4–7 years（估）`),
        yearsEstimated(7, `${DOCS09} 4–7 years（估）`),
      ),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          measured(2, 'large_marine_harahush2007'),
          measured(2, 'large_marine_harahush2007'),
        ),
        intervalDays: range(
          derived(
            4.8,
            'large_marine_harahush2007',
            '365 days ÷ (152 eggs per year ÷ 2 per laying)',
          ),
          derived(
            6.3,
            'large_marine_harahush2007',
            '365 days ÷ (115 eggs per year ÷ 2 per laying)',
          ),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: range(estimated(1, `${DOCS09} 每缸 1–2`), estimated(2, `${DOCS09} 每缸 1–2`)),
      max: estimated(2, `${DOCS09} 每缸 1–2`),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(240, `${DOCS09} 缸長 240 cm（估）`),
      waterVolumeL: estimated(680, `${DOCS09} 680 L`),
      adultsPerEnclosure: estimated(2, `${DOCS09} 每缸 1–2`),
    },
    diets: [
      { crustacean: 0.5, aquatic_invertebrate: 0.3, fish: 0.2 },
      { fish: 0.5, crustacean: 0.3, mollusc: 0.2 },
      { aquatic_invertebrate: 0.4, crustacean: 0.4, mollusc: 0.2 },
      { crustacean: 0.4, fish: 0.3, carrion: 0.3 },
    ],
    preySizeRatio: { min: 0.0005, opt: 0.01, max: 0.08 },
    defenses: [['camouflage'], ['hiding', 'camouflage'], ['size'], ['hiding', 'size']],
    habitats: [['benthic'], ['benthic', 'crevice']],
  },

  marine_stingray: {
    kind: 'cohort',
    latinStem: 'Taeniur',
    nounZh: '海魟',
    flags: [],
    massMg: range(
      dryMassEstimated(1, FISH_DRY_FRACTION, `${DOCS09} adult 1–5 kg（估）`),
      dryMassEstimated(5, FISH_DRY_FRACTION, `${DOCS09} adult 1–5 kg（估）`),
    ),
    typicalLengthMm: estimated(
      700,
      `${DOCS09} total length about 70 cm`,
      'large_marine_ribbontailRay',
    ),
    tolerance: {
      temperatureC: range(
        estimated(22, 'no data; tropical reef ray'),
        estimated(30, 'no data; tropical reef ray'),
      ),
      salinityPpt: range(
        estimated(28, 'no data; reef and lagoon species'),
        estimated(37, 'no data; reef and lagoon species'),
      ),
      ph: range(
        estimated(7.9, 'no data; typical reef aquarium tolerance'),
        estimated(8.4, 'no data; typical reef aquarium tolerance'),
      ),
      nh3MaxMgL: estimated(0.03, 'no data; ribbontail rays are delicate in captivity'),
      no2MaxMgL: estimated(3, REEF_FISH_NO2, 'large_marine_zheng2012'),
      o2MinMgL: estimated(4.5, 'no data; active reef forager'),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimated(10, `${DOCS09} 10／15／20（估）`),
        typLow: yearsEstimated(15, `${DOCS09} 10／15／20（估）`),
        typHigh: yearsEstimated(15, `${DOCS09} 10／15／20（估）`),
        max: yearsEstimated(20, `${DOCS09} 10／15／20（估）`),
      },
      gameCapDays: yearsEstimated(20, `${DOCS09} game cap 7,300 days（估）`),
      maturityDays: range(
        yearsEstimated(3, `${DOCS09} 3–4 years（估）`),
        yearsEstimated(4, `${DOCS09} 3–4 years（估）`),
      ),
      reproduction: {
        mode: 'livebearer',
        clutch: range(
          estimated(1, `${DOCS09} litter ≤ 7（估）`),
          estimated(7, `${DOCS09} litter ≤ 7（估）`),
        ),
        intervalDays: range(
          estimated(300, 'no data; annual litter assumed'),
          estimated(365, 'no data; annual litter assumed'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'rare',
    },
    density: {
      typical: range(estimated(1, `${DOCS09} 每缸 1`), estimated(1, `${DOCS09} 每缸 1`)),
      max: estimated(1, `${DOCS09} 每缸 1`),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(240, `${DOCS09} 缸長 240 cm`, 'large_marine_ribbontailRay'),
      waterVolumeL: estimated(950, `${DOCS09} 950 L`, 'large_marine_ribbontailRay'),
      adultsPerEnclosure: estimated(1, `${DOCS09} 每缸 1`),
    },
    diets: [
      { crustacean: 0.5, aquatic_invertebrate: 0.3, mollusc: 0.2 },
      { aquatic_invertebrate: 0.5, crustacean: 0.3, mollusc: 0.2 },
      { mollusc: 0.5, crustacean: 0.3, aquatic_invertebrate: 0.2 },
      { crustacean: 0.4, aquatic_invertebrate: 0.3, fish: 0.3 },
    ],
    preySizeRatio: { min: 0.0002, opt: 0.005, max: 0.05 },
    defenses: [['venom'], ['venom', 'burrowing'], ['venom', 'camouflage'], ['venom', 'size']],
    habitats: [['benthic'], ['benthic', 'crevice']],
  },

  spiny_lobster: {
    kind: 'cohort',
    latinStem: 'Panulir',
    nounZh: '龍蝦',
    flags: [],
    massMg: range(
      dryMassEstimated(0.5, DECAPOD_DRY_FRACTION, `${DOCS09} adult 0.5–7 kg（估）`),
      dryMassEstimated(7, DECAPOD_DRY_FRACTION, `${DOCS09} adult 0.5–7 kg（估）`),
    ),
    typicalLengthMm: estimated(300, `${DOCS09} adult 25–45 cm（估）`),
    tolerance: {
      temperatureC: range(
        estimated(
          14,
          'no data; temperate Panulirus interruptus to tropical species',
          'large_marine_dohenySpinyLobster',
        ),
        estimated(30, 'no data; tropical spiny lobsters and reef crabs'),
      ),
      salinityPpt: range(
        estimated(28, 'no data; stenohaline marine decapods'),
        estimated(38, 'no data; stenohaline marine decapods'),
      ),
      ph: range(
        estimated(7.8, 'no data; typical marine aquarium tolerance'),
        estimated(8.4, 'no data; typical marine aquarium tolerance'),
      ),
      nh3MaxMgL: estimated(0.08, 'no Panulirus data; penaeid shrimp safe free NH3-N ≈ 0.08 mg/L'),
      no2MaxMgL: estimated(
        5,
        'no Panulirus data; penaeid shrimp safe nitrite-N 6–25 mg/L at 15–35 ppt',
      ),
      o2MinMgL: estimated(4, 'no data; large decapod'),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimated(
          10,
          `${DOCS09} 10／20／50（估）; P. interruptus reported to 75 years`,
          'large_marine_dohenySpinyLobster',
        ),
        typLow: yearsEstimated(20, `${DOCS09} 10／20／50（估）`, 'large_marine_dohenySpinyLobster'),
        typHigh: yearsEstimated(
          20,
          `${DOCS09} 10／20／50（估）`,
          'large_marine_dohenySpinyLobster',
        ),
        max: yearsEstimated(50, `${DOCS09} 10／20／50（估）`, 'large_marine_dohenySpinyLobster'),
      },
      gameCapDays: yearsEstimated(50, `${DOCS09} game cap 18,250 days（估）`),
      maturityDays: range(
        yearsEstimated(2, `${DOCS09} 2–5 years（估）; tropical species and crabs mature earlier`),
        years(5, 'large_marine_dohenySpinyLobster'),
      ),
      reproduction: {
        mode: 'brood',
        clutch: range(
          estimated(
            100000,
            `${DOCS09} 10–70 萬 eggs per brood（估）`,
            'large_marine_dohenySpinyLobster',
          ),
          estimated(
            700000,
            `${DOCS09} 10–70 萬 eggs per brood（估）`,
            'large_marine_dohenySpinyLobster',
          ),
        ),
        intervalDays: range(
          estimated(180, 'no data; one to two broods per year assumed'),
          estimated(365, 'no data; one to two broods per year assumed'),
        ),
      },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(estimated(1, `${DOCS09} 每缸 1`), estimated(1, `${DOCS09} 每缸 1`)),
      max: estimated(1, `${DOCS09} 每缸 1`),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(120, `${DOCS09} 缸長 120 cm`),
      waterVolumeL: estimated(285, `${DOCS09} 285 L`),
      adultsPerEnclosure: estimated(1, `${DOCS09} 每缸 1`),
    },
    diets: [
      { carrion: 0.4, mollusc: 0.4, detritus: 0.2 },
      { mollusc: 0.5, crustacean: 0.3, echinoderm: 0.2 },
      { carrion: 0.5, food: 0.3, macroalgae: 0.2 },
      { mollusc: 0.4, sessile_invertebrate: 0.3, carrion: 0.3 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.02, max: 0.2 },
    defenses: [
      ['armor', 'spines'],
      ['armor', 'hiding'],
      ['armor', 'autotomy'],
      ['armor', 'spines', 'size'],
    ],
    habitats: [
      ['crevice', 'benthic'],
      ['burrow', 'benthic'],
    ],
  },

  octopus: {
    kind: 'cohort',
    latinStem: 'Octopod',
    nounZh: '章魚',
    flags: ['escapes_open_lid', 'cannibal'],
    massMg: range(
      dryMass(0.4, CEPHALOPOD_DRY_FRACTION, 'large_marine_tonmoOctopus'),
      dryMass(0.8, CEPHALOPOD_DRY_FRACTION, 'large_marine_tonmoOctopus'),
    ),
    typicalLengthMm: measured(600, 'large_marine_tonmoOctopus'),
    tolerance: {
      temperatureC: range(
        estimated(13, 'O. vulgaris has been cultured at 13–16 °C', 'large_marine_domingues2010'),
        estimated(28, 'no data; warm limit of Octopus vulgaris range'),
      ),
      salinityPpt: range(
        estimated(
          32,
          'culture 36 ± 1 ppt; cephalopods are stenohaline',
          'large_marine_domingues2010',
        ),
        measured(37, 'large_marine_domingues2010'),
      ),
      ph: range(
        measured(7.9, 'large_marine_domingues2010'),
        estimated(8.4, 'no data; typical marine aquarium tolerance'),
      ),
      nh3MaxMgL: estimated(
        0.02,
        `${CEPHALOPOD_WATER}; culture kept total ammonia < 0.1 mg/L`,
        'large_marine_domingues2010',
      ),
      no2MaxMgL: estimated(1, CEPHALOPOD_WATER),
      o2MinMgL: derived(
        5.5,
        'large_marine_domingues2010',
        'culture kept O₂ > 75% saturation; 0.75 × 7.3 mg/L saturation at 20 °C, 36 ppt',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(1, 'large_marine_tonmoOctopus'),
        typLow: years(1.2, 'large_marine_tonmoOctopus'),
        typHigh: years(1.2, 'large_marine_tonmoOctopus'),
        max: years(2, 'large_marine_tonmoOctopus'),
      },
      gameCapDays: years(2, 'large_marine_tonmoOctopus'),
      maturityDays: range(
        estimated(240, `${DOCS09} 8–12 months（估）`),
        estimated(365, `${DOCS09} 8–12 months（估）`),
      ),
      reproduction: {
        mode: 'brood',
        clutch: range(
          measured(100, 'large_marine_tonmoOctopus'),
          measured(800, 'large_marine_tonmoOctopus'),
        ),
      },
      senescence: 'semelparous',
      recruitment: 'rare',
    },
    density: {
      typical: range(
        measured(1, 'large_marine_tonmoOctopus'),
        measured(1, 'large_marine_tonmoOctopus'),
      ),
      max: measured(1, 'large_marine_tonmoOctopus'),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: measured(120, 'large_marine_tonmoOctopus'),
      waterVolumeL: measured(190, 'large_marine_tonmoOctopus'),
      adultsPerEnclosure: measured(1, 'large_marine_tonmoOctopus'),
    },
    diets: [
      { crustacean: 0.6, mollusc: 0.4 },
      { mollusc: 0.6, crustacean: 0.4 },
      { crustacean: 0.5, mollusc: 0.3, fish: 0.2 },
      { crustacean: 0.4, mollusc: 0.3, food: 0.3 },
    ],
    preySizeRatio: { min: 0.005, opt: 0.05, max: 0.3 },
    defenses: [
      ['camouflage', 'hiding'],
      ['camouflage', 'autotomy'],
      ['venom', 'camouflage'],
      ['hiding', 'burrowing'],
    ],
    habitats: [
      ['crevice', 'benthic'],
      ['burrow', 'benthic'],
    ],
  },

  cuttlefish: {
    kind: 'cohort',
    latinStem: 'Sepia',
    nounZh: '烏賊',
    flags: ['cannibal'],
    massMg: range(
      dryMassEstimated(1, CEPHALOPOD_DRY_FRACTION, `${DOCS09} adult 1–4 kg`),
      dryMassEstimated(4, CEPHALOPOD_DRY_FRACTION, `${DOCS09} adult 1–4 kg`),
    ),
    typicalLengthMm: estimated(250, `${DOCS09} mantle 15–45 cm; geometric midpoint`),
    tolerance: {
      temperatureC: range(
        estimated(10, 'no data in cited source; lower limit of Sepia officinalis distribution'),
        measured(30, 'large_marine_domingues2001'),
      ),
      salinityPpt: range(
        estimated(
          27,
          'embryos hatch at 26.5 ppt but not below 23.9 ppt',
          'large_marine_domingues2001',
        ),
        derived(40, 'large_marine_domingues2001', 'culture salinity 37 ± 3 ppt upper bound'),
      ),
      ph: range(
        estimated(7.9, 'no data; typical marine aquarium tolerance'),
        estimated(8.4, 'no data; typical marine aquarium tolerance'),
      ),
      nh3MaxMgL: estimated(0.02, CEPHALOPOD_WATER),
      no2MaxMgL: estimated(1, CEPHALOPOD_WATER),
      o2MinMgL: estimated(5, 'no data; high-metabolism cephalopod'),
    },
    lifeHistory: {
      lifespanDays: {
        min: years(1, 'large_marine_laptikhovsky2003'),
        typLow: years(1.5, 'large_marine_laptikhovsky2003'),
        typHigh: years(1.5, 'large_marine_laptikhovsky2003'),
        max: years(2, 'large_marine_laptikhovsky2003'),
      },
      gameCapDays: years(2, 'large_marine_laptikhovsky2003'),
      maturityDays: range(
        derived(270, 'large_marine_laptikhovsky2003', 'about 9 months × 30 days'),
        estimated(330, 'about 9 months; upper bound + 2 months for cooler water'),
      ),
      reproduction: {
        mode: 'eggs',
        clutch: range(
          measured(144, 'large_marine_laptikhovsky2003'),
          measured(225, 'large_marine_laptikhovsky2003'),
        ),
      },
      senescence: 'semelparous',
      recruitment: 'normal',
    },
    density: {
      typical: range(estimated(1, `${DOCS09} 每缸 1–3`), estimated(3, `${DOCS09} 每缸 1–3`)),
      max: estimated(3, `${DOCS09} 每缸 1–3`),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      lengthCm: estimated(200, `${DOCS09} 缸長 200 cm（估）`),
      waterVolumeL: estimated(
        500,
        `${DOCS09} 500 L; culture groups of 5 in 250–300 L tanks`,
        'large_marine_domingues2001',
      ),
      adultsPerEnclosure: estimated(3, `${DOCS09} 每缸 1–3`),
    },
    diets: [
      { crustacean: 0.7, fish: 0.3 },
      { fish: 0.6, crustacean: 0.4 },
      { crustacean: 0.5, fish: 0.3, mollusc: 0.2 },
      { crustacean: 0.6, fish: 0.2, aquatic_invertebrate: 0.2 },
    ],
    preySizeRatio: { min: 0.002, opt: 0.03, max: 0.3 },
    defenses: [
      ['camouflage'],
      ['camouflage', 'hiding'],
      ['camouflage', 'toxin'],
      ['camouflage', 'burrowing'],
    ],
    habitats: [['benthic'], ['benthic', 'pelagic']],
  },

  sea_star: {
    kind: 'cohort',
    latinStem: 'Protorea',
    nounZh: '海星',
    flags: [],
    massMg: range(
      dryMassEstimated(0.3, 0.3, `${DOCS09} adult 0.3–0.5 kg; echinoderm dry fraction assumed 0.3`),
      dryMassEstimated(0.5, 0.3, `${DOCS09} adult 0.3–0.5 kg; echinoderm dry fraction assumed 0.3`),
    ),
    typicalLengthMm: derived(
      300,
      'large_marine_liveaquariaChocolateChipStar',
      'diameter 25–38 cm, rounded midpoint',
    ),
    tolerance: {
      temperatureC: range(
        estimated(
          20,
          'care range 22.2–25.6 °C widened 2 °C',
          'large_marine_liveaquariaChocolateChipStar',
        ),
        estimated(
          30,
          'care range 22.2–25.6 °C widened for tropical sea stars',
          'large_marine_liveaquariaChocolateChipStar',
        ),
      ),
      salinityPpt: range(
        sgPpt('1.023', 'large_marine_liveaquariaChocolateChipStar'),
        sgPpt('1.025', 'large_marine_liveaquariaChocolateChipStar'),
      ),
      ph: range(
        measured(8.1, 'large_marine_liveaquariaChocolateChipStar'),
        measured(8.4, 'large_marine_liveaquariaChocolateChipStar'),
      ),
      nh3MaxMgL: estimated(0.05, 'no data; echinoderms are sensitive to water quality'),
      no2MaxMgL: estimated(3, 'no data; echinoderms are sensitive to water quality'),
      o2MinMgL: estimated(4.5, 'no data; echinoderms are sensitive to hypoxia'),
    },
    lifeHistory: {
      lifespanDays: {
        min: yearsEstimated(5, `${DOCS09} 5／10／?（估）`),
        typLow: yearsEstimated(10, `${DOCS09} 5／10／?（估）`),
        typHigh: yearsEstimated(10, `${DOCS09} 5／10／?（估）`),
        max: yearsEstimated(15, `${DOCS09} maximum unknown; set to game cap`),
      },
      gameCapDays: yearsEstimated(15, `${DOCS09} game cap 5,475 days（估）`),
      maturityDays: range(
        estimated(600, `${DOCS09} about 2 years（估）`),
        estimated(900, `${DOCS09} about 2 years（估）`),
      ),
      reproduction: { mode: 'eggs' },
      senescence: 'gompertz',
      recruitment: 'none',
    },
    density: {
      typical: range(estimated(1, `${DOCS09} 每缸 1–3`), estimated(3, `${DOCS09} 每缸 1–3`)),
      max: estimated(3, `${DOCS09} 每缸 1–3`),
      unit: 'individuals_per_enclosure',
    },
    minEnclosure: {
      waterVolumeL: estimated(285, `${DOCS09} 285 L`, 'large_marine_liveaquariaChocolateChipStar'),
      adultsPerEnclosure: estimated(3, `${DOCS09} 每缸 1–3`),
    },
    diets: [
      { sessile_invertebrate: 0.6, carrion: 0.4 },
      { mollusc: 0.5, sessile_invertebrate: 0.3, carrion: 0.2 },
      { carrion: 0.4, detritus: 0.3, sessile_invertebrate: 0.3 },
      { sessile_invertebrate: 0.4, biofilm: 0.3, carrion: 0.3 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.05, max: 0.5 },
    defenses: [
      ['armor', 'spines'],
      ['armor', 'autotomy'],
      ['armor', 'toxin'],
      ['spines', 'toxin'],
    ],
    habitats: [['benthic'], ['benthic', 'crevice']],
  },
};
