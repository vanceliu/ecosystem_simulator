import type { ArchetypeId } from './archetypeIds';
import type { OceanRegion, RealmCode } from './location';
import type { SourceId } from './sources';

export interface NativeRange {
  /** terrestrial and freshwater realms */
  readonly realms: readonly RealmCode[];
  /** marine regions */
  readonly oceans: readonly OceanRegion[];
  readonly basis: 'measured' | 'estimated';
  readonly source?: SourceId;
}

export const REALM_NAMES_ZH: Readonly<Record<RealmCode, string>> = {
  NA: '新北區',
  NT: '新熱帶區',
  PA: '古北區',
  AT: '非洲熱帶區',
  IM: '東洋區',
  AU: '澳洲區',
  OC: '大洋洲區',
  AN: '南極區',
};

const ALL: readonly RealmCode[] = ['NA', 'NT', 'PA', 'AT', 'IM', 'AU', 'OC', 'AN'];
const ALL_NO_AN: readonly RealmCode[] = ['NA', 'NT', 'PA', 'AT', 'IM', 'AU', 'OC'];
const ALL_OCEANS: readonly OceanRegion[] = ['IP', 'ATL', 'EP', 'SO'];
const WARM_OCEANS: readonly OceanRegion[] = ['IP', 'ATL', 'EP'];

const cosmopolitan = (source: SourceId): NativeRange => ({
  realms: ALL,
  oceans: ALL_OCEANS,
  basis: 'measured',
  source,
});
const marineEverywhere: NativeRange = { realms: [], oceans: ALL_OCEANS, basis: 'estimated' };
const warmMarine: NativeRange = { realms: [], oceans: WARM_OCEANS, basis: 'estimated' };
const freshAndMarine: NativeRange = {
  realms: ALL_NO_AN,
  oceans: ALL_OCEANS,
  basis: 'estimated',
};
const allButAntarctic = (source?: SourceId): NativeRange =>
  source === undefined
    ? { realms: ALL_NO_AN, oceans: [], basis: 'estimated' }
    : { realms: ALL_NO_AN, oceans: [], basis: 'measured', source };
const realmsOf = (realms: readonly RealmCode[], source?: SourceId): NativeRange =>
  source === undefined
    ? { realms, oceans: [], basis: 'estimated' }
    : { realms, oceans: [], basis: 'measured', source };

/** docs/11 §6.3 */
export const NATIVE_RANGES: Readonly<Record<ArchetypeId, NativeRange>> = {
  aob: cosmopolitan('finlay2002'),
  nob: cosmopolitan('finlay2002'),
  heterotroph: cosmopolitan('finlay2002'),
  denitrifier: cosmopolitan('finlay2002'),
  water_mold: cosmopolitan('finlay2002'),
  biofilm: cosmopolitan('finlay2002'),
  diatom: cosmopolitan('finlay2002'),
  green_algae: cosmopolitan('finlay2002'),
  cyanobacteria: cosmopolitan('aadInvertebrates'),
  phytoplankton: cosmopolitan('finlay2002'),
  aquatic_plant: { realms: ALL_NO_AN, oceans: [], basis: 'estimated' },
  macroalgae: { realms: [], oceans: ALL_OCEANS, basis: 'measured', source: 'finlay2002' },
  zooxanthellae: warmMarine,
  ciliate: cosmopolitan('finlay2002'),
  rotifer: cosmopolitan('aadInvertebrates'),
  copepod: cosmopolitan('aadInvertebrates'),
  ostracod: cosmopolitan('finlay2002'),
  cladoceran: cosmopolitan('finlay2002'),
  amphipod: freshAndMarine,
  isopod: freshAndMarine,
  detritus_worm: freshAndMarine,
  nematode: cosmopolitan('aadInvertebrates'),
  bristle_worm: marineEverywhere,
  snail: { realms: ALL_NO_AN, oceans: WARM_OCEANS, basis: 'estimated' },
  shrimp: freshAndMarine,
  sea_urchin: marineEverywhere,
  brittle_star: marineEverywhere,
  bivalve: { realms: ALL_NO_AN, oceans: WARM_OCEANS, basis: 'estimated' },
  sponge: { realms: ALL_NO_AN, oceans: ALL_OCEANS, basis: 'estimated' },
  tunicate: marineEverywhere,
  coral: warmMarine,
  planarian: allButAntarctic(),
  hydra: allButAntarctic(),
  planktivore_fish: { realms: ALL_NO_AN, oceans: WARM_OCEANS, basis: 'estimated' },
  grazer_fish: { realms: ALL_NO_AN, oceans: WARM_OCEANS, basis: 'estimated' },
  benthic_omnivore_fish: { realms: ALL_NO_AN, oceans: WARM_OCEANS, basis: 'estimated' },
  odonate_nymph: allButAntarctic(),
  predatory_insect: allButAntarctic(),
  crayfish: realmsOf(['NA', 'PA', 'NT', 'AT', 'AU'], 'taxonDistribution'),
  mantis_shrimp: warmMarine,
  piscivore_fish: { realms: ALL_NO_AN, oceans: WARM_OCEANS, basis: 'estimated' },
  moss_liverwort: cosmopolitan('aadInvertebrates'),
  terrestrial_plant: realmsOf(ALL, 'aadInvertebrates'),
  bromeliad_epiphyte: realmsOf(['NT'], 'taxonDistribution'),
  saprotrophic_fungus: realmsOf(ALL, 'finlay2002'),
  soil_bacteria: realmsOf(ALL, 'finlay2002'),
  soil_nematode: realmsOf(ALL, 'aadInvertebrates'),
  springtail: realmsOf(ALL, 'aadInvertebrates'),
  terrestrial_isopod: allButAntarctic('aadInvertebrates'),
  millipede: allButAntarctic('aadInvertebrates'),
  potworm: realmsOf(ALL),
  earthworm: allButAntarctic('aadInvertebrates'),
  land_snail_slug: allButAntarctic(),
  detritivore_mite: realmsOf(ALL, 'aadInvertebrates'),
  predatory_mite: realmsOf(ALL, 'aadInvertebrates'),
  fungus_gnat: allButAntarctic(),
  fruit_fly: allButAntarctic(),
  cricket: allButAntarctic(),
  rove_beetle: allButAntarctic(),
  darkling_beetle: allButAntarctic(),
  spider: allButAntarctic('aadInvertebrates'),
  centipede: allButAntarctic('aadInvertebrates'),
  pseudoscorpion: allButAntarctic(),
  ant: allButAntarctic('hawaiiAnts'),
  dart_frog_small: realmsOf(['NT', 'AT'], 'taxonDistribution'),
  tree_frog: realmsOf(['NA', 'NT', 'PA', 'AT', 'IM', 'AU'], 'taxonDistribution'),
  semi_aquatic_toad: realmsOf(['PA', 'IM'], 'taxonDistribution'),
  aquatic_frog_dwarf: realmsOf(['AT'], 'taxonDistribution'),
  aquatic_frog_clawed: realmsOf(['AT'], 'taxonDistribution'),
  large_frog_ambush: realmsOf(['NT'], 'taxonDistribution'),
  large_frog_aquatic: realmsOf(['NA'], 'taxonDistribution'),
  newt: realmsOf(['PA', 'NA', 'IM'], 'taxonDistribution'),
  axolotl: realmsOf(['NT'], 'taxonDistribution'),
  small_arboreal_lizard: allButAntarctic(),
  semi_aquatic_lizard: realmsOf(['NT', 'IM', 'AU']),
  water_monitor: realmsOf(['IM', 'AU'], 'taxonDistribution'),
  garter_water_snake: realmsOf(['NA', 'NT'], 'taxonDistribution'),
  small_python: realmsOf(['AT', 'IM', 'AU'], 'taxonDistribution'),
  musk_turtle: realmsOf(['NA', 'NT'], 'taxonDistribution'),
  slider_turtle: realmsOf(['NA', 'NT'], 'taxonDistribution'),
  softshell_turtle: realmsOf(['NA', 'PA', 'AT', 'IM', 'AU'], 'taxonDistribution'),
  vampire_crab: realmsOf(['IM', 'AU'], 'taxonDistribution'),
  mangrove_crab: {
    realms: ['NA', 'NT', 'PA', 'AT', 'IM', 'AU'],
    oceans: WARM_OCEANS,
    basis: 'measured',
    source: 'taxonDistribution',
  },
  fiddler_crab: {
    realms: ['NA', 'NT', 'PA', 'AT', 'IM', 'AU'],
    oceans: WARM_OCEANS,
    basis: 'measured',
    source: 'taxonDistribution',
  },
  mudskipper: { realms: ['AT', 'IM', 'AU', 'PA'], oceans: ['IP', 'ATL'], basis: 'estimated' },
  arowana: realmsOf(['NT', 'IM', 'AU'], 'taxonDistribution'),
  gar: realmsOf(['NA', 'NT'], 'taxonDistribution'),
  bichir: realmsOf(['AT'], 'taxonDistribution'),
  snakehead: realmsOf(['AT', 'IM', 'PA'], 'taxonDistribution'),
  cichlid_pursuit_predator: realmsOf(['NT', 'AT'], 'taxonDistribution'),
  oscar: realmsOf(['NT'], 'taxonDistribution'),
  pacu: realmsOf(['NT'], 'taxonDistribution'),
  silver_dollar: realmsOf(['NT'], 'taxonDistribution'),
  koi: realmsOf(['PA', 'IM'], 'taxonDistribution'),
  goldfish: realmsOf(['PA', 'IM'], 'taxonDistribution'),
  large_pleco: realmsOf(['NT'], 'taxonDistribution'),
  giant_catfish: realmsOf(['NA', 'NT', 'PA', 'AT', 'IM', 'AU']),
  freshwater_stingray: realmsOf(['NT'], 'taxonDistribution'),
  fire_eel: realmsOf(['IM'], 'taxonDistribution'),
  scat: { realms: ['IM', 'AU'], oceans: ['IP'], basis: 'estimated' },
  grouper: warmMarine,
  lionfish: { realms: [], oceans: ['IP'], basis: 'measured', source: 'taxonDistribution' },
  tang: warmMarine,
  triggerfish: warmMarine,
  moray: warmMarine,
  benthic_shark: warmMarine,
  marine_stingray: warmMarine,
  spiny_lobster: warmMarine,
  octopus: marineEverywhere,
  cuttlefish: { realms: [], oceans: ['IP', 'ATL'], basis: 'measured', source: 'taxonDistribution' },
  sea_star: marineEverywhere,
};
