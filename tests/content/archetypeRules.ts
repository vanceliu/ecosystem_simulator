import type { Archetype, FoodKind, SourcedRange } from '../../src/content/archetype';
import { isSourced } from '../../src/content/sourced';
import { SOURCES } from '../../src/content/sources';

const ANIMAL_PREY: readonly FoodKind[] = [
  'protozoa',
  'zooplankton',
  'aquatic_invertebrate',
  'terrestrial_invertebrate',
  'flying_insect',
  'mollusc',
  'crustacean',
  'echinoderm',
  'sessile_invertebrate',
  'fish',
  'egg',
  'amphibian',
  'reptile',
];
const LATIN_STEM = /^[A-Z][a-z]{2,10}$/;
const DIET_SUM_TOLERANCE = 0.01;

function sourcingProblems(value: unknown, path: string, problems: string[]): void {
  if (isSourced(value)) {
    const sourced = value;
    if (!Number.isFinite(sourced.value)) problems.push(`${path}: not finite`);
    if (sourced.basis === 'measured' || sourced.basis === 'derived') {
      if (!(sourced.source in SOURCES)) problems.push(`${path}: unknown source ${sourced.source}`);
    }
    if (sourced.basis === 'derived' && sourced.derivation.length === 0) {
      problems.push(`${path}: derived value without derivation`);
    }
    if (sourced.basis === 'estimated') {
      if (sourced.note.length === 0) problems.push(`${path}: estimate without note`);
      if (sourced.source !== undefined && !(sourced.source in SOURCES)) {
        problems.push(`${path}: unknown source ${sourced.source}`);
      }
    }
    return;
  }
  if (typeof value !== 'object' || value === null) return;
  for (const [key, child] of Object.entries(value))
    sourcingProblems(child, `${path}.${key}`, problems);
}

const ordered = (range: SourcedRange): boolean => range.min.value <= range.max.value;

/** Returns every rule violation for one archetype; empty when valid. */
export function archetypeProblems(a: Archetype): string[] {
  const p: string[] = [];
  const check = (ok: boolean, message: string): void => {
    if (!ok) p.push(message);
  };
  sourcingProblems(a, a.id, p);

  check(LATIN_STEM.test(a.latinStem), `latinStem "${a.latinStem}" must match ${LATIN_STEM}`);
  check(a.nounZh.length > 0, 'nounZh empty');
  check(a.massMg.min.value > 0 && ordered(a.massMg), 'massMg must be positive and ordered');
  check(a.typicalLengthMm.value > 0, 'typicalLengthMm must be positive');

  const t = a.tolerance;
  check(ordered(t.temperatureC), 'temperature min > max');
  check(
    t.temperatureC.min.value >= -5 && t.temperatureC.max.value <= 55,
    'temperature outside −5–55 °C',
  );
  check(ordered(t.ph) && t.ph.min.value >= 2 && t.ph.max.value <= 11, 'pH range invalid');
  if (a.zone === 'W' || a.zone === 'A') {
    const s = t.salinityPpt;
    check(s !== undefined, 'salinityPpt required for W/A zones');
    if (s !== undefined) {
      check(ordered(s) && s.min.value >= 0 && s.max.value <= 45, 'salinity range invalid');
      const classes = a.salinityClasses;
      if (classes.includes('F')) check(s.min.value <= 0.5, 'F class requires salinity min ≤ 0.5');
      if (classes.includes('M')) check(s.max.value >= 30, 'M class requires salinity max ≥ 30');
      if (!classes.includes('M')) check(s.max.value < 30, 'no M class: salinity max must be < 30');
      if (!classes.includes('F'))
        check(s.min.value > 0.5, 'no F class: salinity min must be > 0.5');
    }
  } else {
    check(t.salinityPpt === undefined, 'land-only archetypes take no salinityPpt');
  }
  if (a.zone === 'T' || a.zone === 'A') {
    check(t.humidityMinPercent !== undefined, 'humidityMinPercent required for T/A zones');
  }
  if (a.kind === 'cohort' && a.zone !== 'T') {
    check(
      t.nh3MaxMgL !== undefined && t.no2MaxMgL !== undefined && t.o2MinMgL !== undefined,
      'aquatic animals need nh3MaxMgL, no2MaxMgL and o2MinMgL',
    );
  }

  const life = a.lifeHistory;
  const span = life.lifespanDays;
  check(
    span.min.value <= span.typLow.value &&
      span.typLow.value <= span.typHigh.value &&
      span.typHigh.value <= span.max.value,
    'lifespan must satisfy min ≤ typLow ≤ typHigh ≤ max',
  );
  check(life.gameCapDays.value >= span.typHigh.value, 'gameCapDays must be ≥ lifespan typHigh');
  check(ordered(life.maturityDays), 'maturity min > max');
  if (life.reproduction.clutch !== undefined)
    check(ordered(life.reproduction.clutch), 'clutch min > max');
  if (life.reproduction.intervalDays !== undefined) {
    check(ordered(life.reproduction.intervalDays), 'interval min > max');
  }
  if (life.senescence === 'modular')
    check(life.moduleLifespanDays !== undefined, 'modular needs moduleLifespanDays');
  if (life.senescence === 'clonal_aging') {
    check(life.clonalMaxGenerations !== undefined, 'clonal_aging needs clonalMaxGenerations');
  }
  if (life.senescence === 'metamorphosis_exit') {
    check(life.aquaticStageDays !== undefined, 'metamorphosis_exit needs aquaticStageDays');
    check(a.flags.includes('metamorphosis_exit'), 'metamorphosis_exit flag missing');
  }

  check(ordered(a.density.typical), 'density typical min > max');
  check(a.density.typical.max.value <= a.density.max.value, 'density typical max exceeds max');

  if (a.kind === 'cohort') {
    a.diets.forEach((diet, index) => {
      const weights = Object.values(diet);
      const sum = weights.reduce((total, weight) => total + weight, 0);
      check(
        weights.length > 0 && weights.every((w) => w > 0),
        `diet ${index} needs positive weights`,
      );
      check(Math.abs(sum - 1) <= DIET_SUM_TOLERANCE, `diet ${index} weights sum to ${sum}, not 1`);
    });
    const eatsAnimals = a.diets.some((diet) =>
      Object.keys(diet).some((food) => ANIMAL_PREY.includes(food as FoodKind)),
    );
    if (eatsAnimals) {
      const ratio = a.preySizeRatio;
      check(
        ratio !== undefined && ratio.min > 0 && ratio.min <= ratio.opt && ratio.opt <= ratio.max,
        'animal prey requires preySizeRatio with 0 < min ≤ opt ≤ max',
      );
    }
    check(
      a.habitats.every((habitat) => habitat.length > 0),
      'each habitat option must be non-empty',
    );
  } else {
    check(
      new Set(a.morphologies).size === 8 && a.morphologies.every((m) => m.length > 0),
      'eight distinct morphologies required',
    );
    check(a.specialisedMetabolism.length > 0, 'specialisedMetabolism empty');
    if (a.trophicMode === 'photoautotroph' || a.trophicMode === 'symbiont') {
      check(a.light !== undefined, 'photosynthetic groups need light');
      check(a.flags.includes('photosynthetic'), 'photosynthetic flag missing');
    }
  }
  return p;
}
