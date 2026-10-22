import type { Archetype } from '../../src/content/archetype';
import { estimated } from '../../src/content/sourced';

const e = (value: number) => estimated(value, 'test fixture');
const range = (min: number, max: number) => ({ min: e(min), max: e(max) });

/** Synthetic aquatic animal used to test generation independently of authored data. */
export const TEST_COHORT: Archetype = {
  id: 'copepod',
  nameZh: '測試橈足類',
  layer: 'L3',
  zone: 'W',
  kind: 'cohort',
  category: 'crustaceans',
  metabolicClass: 'invertebrate',
  salinityClasses: ['F', 'B', 'M'],
  vectors: ['pond_water'],
  latinStem: 'Cyclo',
  nounZh: '劍水蚤',
  flags: [],
  massMg: range(0.002, 0.05),
  typicalLengthMm: e(1),
  tolerance: {
    temperatureC: range(2, 32),
    salinityPpt: range(0, 35),
    ph: range(6, 9),
    nh3MaxMgL: e(0.5),
    no2MaxMgL: e(5),
    o2MinMgL: e(2),
  },
  lifeHistory: {
    lifespanDays: { min: e(20), typLow: e(30), typHigh: e(45), max: e(75) },
    gameCapDays: e(75),
    maturityDays: range(7, 22),
    reproduction: { mode: 'eggs', clutch: range(20, 70), intervalDays: range(1, 3) },
    senescence: 'gompertz',
    recruitment: 'normal',
  },
  density: { typical: range(1, 50), max: e(40000), unit: 'individuals_per_L' },
  diets: [
    { phytoplankton: 0.7, detritus: 0.3 },
    { protozoa: 0.6, phytoplankton: 0.4 },
    { detritus: 1 },
    { biofilm: 0.5, bacteria: 0.5 },
  ],
  preySizeRatio: { min: 0.001, opt: 0.01, max: 0.1 },
  defenses: [[], ['hiding'], ['shell'], ['toxin']],
  habitats: [['pelagic'], ['benthic']],
};

/** Synthetic photosynthetic biomass group. */
export const TEST_BIOMASS: Archetype = {
  id: 'diatom',
  nameZh: '測試矽藻',
  layer: 'L1-P',
  zone: 'W',
  kind: 'biomass',
  category: 'algae_plants',
  metabolicClass: 'alga',
  salinityClasses: ['F', 'B', 'M'],
  vectors: ['background'],
  niche: 'surface',
  kinetics: { muMax: e(1), halfSat: { nitrogen: e(0.02), phosphorus: e(0.003) } },
  latinStem: 'Navicul',
  nounZh: '矽藻',
  flags: ['photosynthetic'],
  massMg: range(1e-9, 1e-7),
  typicalLengthMm: e(0.02),
  tolerance: { temperatureC: range(0, 35), salinityPpt: range(0, 35), ph: range(5, 9.5) },
  lifeHistory: {
    lifespanDays: { min: e(0.3), typLow: e(1), typHigh: e(3), max: e(17) },
    gameCapDays: e(30),
    maturityDays: range(0.2, 17),
    reproduction: { mode: 'fission' },
    senescence: 'clonal_aging',
    recruitment: 'normal',
    clonalMaxGenerations: range(300, 1000),
  },
  density: { typical: range(100, 1000), max: e(4e5), unit: 'cells_per_mL' },
  trophicMode: 'photoautotroph',
  morphologies: ['舟形', '羽紋', '中心', '鏈狀', '星狀', '扇形', '棒狀', '群體'],
  specialisedMetabolism: '矽需求減半',
  light: { halfSaturation: e(30), optimum: e(200) },
};

/** Synthetic land animal: humidity locus instead of salinity. */
export const TEST_LAND: Archetype = {
  ...TEST_COHORT,
  id: 'springtail',
  zone: 'T',
  category: 'insects',
  salinityClasses: [],
  latinStem: 'Folsom',
  nounZh: '跳蟲',
  tolerance: {
    temperatureC: range(5, 30),
    ph: range(4, 8),
    humidityMinPercent: e(80),
  },
};
