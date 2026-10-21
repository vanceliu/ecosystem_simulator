import type { Source } from '../../sources';

/** Sources for the aquatic_small archetype group; keys are prefixed 'aquatic_small_'. */
export const AQUATIC_SMALL_SOURCES = {
  aquatic_small_faoRotiferLife: {
    title:
      'FAO Fisheries Tech. Paper 361, rotifer biology: lifespan 3.4–4.4 d at 25 °C, maturity 0.5–1.5 d, one egg per ~4 h',
    url: 'https://www.fao.org/4/w3732e/w3732e0f.htm',
  },
  aquatic_small_faoRotiferMorph: {
    title:
      'FAO Fisheries Tech. Paper 361, Brachionus plicatilis morphology: lorica 100–340 µm (L-type mean 239 µm), S-type optimum 28–35 °C',
    url: 'https://www.fao.org/4/w3732e/w3732e0g.htm',
  },
  aquatic_small_faoRotiferCulture: {
    title:
      'FAO Fisheries Tech. Paper 361, rotifer culture: salinity 1–97 ppt, freshwater 15–31 °C, O2 ≥ 1.2 mg/L, pH 6–8, free NH3 3–5 mg/L inhibits reproduction',
    url: 'https://www.fao.org/4/w3732e/w3732e0h.htm',
  },
  aquatic_small_calcofiRotiferMass: {
    title: 'Theilacker & Kimball 1984, CalCOFI Rep. 25: rotifer dry weight 0.10–0.47 µg per animal',
    url: 'https://calcofi.org/downloads/publications/calcofireports/v25/Vol_25_Theilacker___Kimball.pdf',
  },
  aquatic_small_jepsenAcartiaNh3: {
    title:
      'Jepsen et al., Tolerance of un-ionized ammonia in live feed cultures of the calanoid copepod Acartia tonsa (adult NOEC 477 µg NH3/L), Aquaculture Research',
    url: 'https://independent.academia.edu/PerJepsen',
  },
  aquatic_small_faoDaphnia: {
    title:
      'FAO Fisheries Tech. Paper 361, Daphnia and Moina culture: O2 < 1.0 mg/L lethal, NH3 < 0.2 mg/L, 20–100 animals/L',
    url: 'https://www.fao.org/4/W3732E/w3732e0x.htm',
  },
  aquatic_small_adwDaphnia: {
    title:
      'Animal Diversity Web, Daphnia magna: females 3–5 mm, brackish to 8 ppt, lifespan 40–56 d',
    url: 'https://animaldiversity.org/accounts/Daphnia_magna',
  },
  aquatic_small_bottrell1976: {
    title:
      'Bottrell et al. 1976, A review of some problems in zooplankton production studies, Norw. J. Zool. 24:419 (Daphnia ln W[µg] = 1.4681 + 2.8292 ln L[mm])',
  },
  aquatic_small_ricciardi1998: {
    title:
      'Ricciardi & Bourget 1998, Weight-to-weight conversion factors for marine benthic macroinvertebrates, MEPS 163:245 (AFDW ≈ 16% of wet weight for polychaetes and amphipods)',
    url: 'https://int-res.com/abstracts/meps/v163/p245-251',
  },
  aquatic_small_epaAmmonia2013: {
    title:
      'US EPA 2013, Aquatic Life Ambient Water Quality Criteria for Ammonia – Freshwater (GMAV/GMCV in mg TAN/L at pH 7, 20 °C)',
    url: 'https://www.epa.gov/sites/default/files/2015-08/documents/aquatic-life-ambient-water-quality-criteria-for-ammonia-freshwater-2013.pdf',
  },
  aquatic_small_alonsoNitrite2006: {
    title:
      'Alonso & Camargo 2006, Toxicity of nitrite to three species of freshwater invertebrates, Environ. Toxicol. 21:90 (96-h LC50 amphipods 2.09–2.59, planarian 60.0 mg NO2-N/L)',
    url: 'https://ebuah.uah.es/dspace/handle/10017/60820',
  },
  aquatic_small_hyalellaHypoxia: {
    title:
      'Hypoxia tolerance of Hyalella azteca and Chironomus tentans, Environ. Toxicol. Chem. 2004 (juvenile H. azteca 10-d NOEC 2.9 mg O2/L)',
    url: 'https://doi.org/10.1897/03-230',
  },
  aquatic_small_tubifexUwsp: {
    title:
      'UW–Stevens Point, Tubifex tubifex account: thrives at 10–60% O2 saturation, survives 48 d anoxia',
    url: 'https://winvertebrates.uwsp.edu/templar_361_2012.html',
  },
  aquatic_small_girardiaStress: {
    title:
      'Girardia tigrina under stressors, Biol. Open 2018: first deaths at 27 °C, 13% at 30 °C in heating ramp; tolerates pH 4–10',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6031348',
  },
  aquatic_small_girardiaNacl: {
    title:
      'Lethal and sublethal effects of NaCl on Chironomus xanthus and Girardia tigrina (48-h LC50 7.77 g NaCl/L)',
    url: 'https://agris.fao.org/search/en/records/65de426e7c7033e84bea5497',
  },
  aquatic_small_hydraNacl: {
    title:
      'Comparación ecotoxicológica al cloruro de sodio en Hydra vulgaris e Hydra viridissima (H. vulgaris 96-h LC50 ≈ 1.0 g NaCl/L)',
    url: 'https://revistas.unal.edu.co/index.php/biotecnologia/article/view/96258',
  },
  aquatic_small_marlinCapitella: {
    title:
      'MarLIN, Capitella capitata in organically enriched mud: adult upper lethal temperature 31.5 °C',
    url: 'https://www.marlin.ac.uk/habitats/detail/1114',
  },
  aquatic_small_lhRotifer: {
    title: 'docs/09 §4 rotifer row, field and culture densities (PMC12292424; PAN; Redalyc)',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12292424/',
  },
  aquatic_small_lhCopepod: {
    title: 'docs/09 §4 copepod row (UTAS copepod culture thesis; ZSI; Springer; MEPS 118:121)',
    url: 'https://figshare.utas.edu.au/articles/thesis/The_culture_of_copepods_as_live_food_for_marine_fish_larvae/23247782',
  },
  aquatic_small_lhOstracod: {
    title:
      'docs/09 §4 ostracod row (Wojtasik 2008 Polish Polar Res. 29; Springer; GBA ostracod assemblages)',
    url: 'https://www.czasopisma.pan.pl//Content/110563/PDF/PPR29-033.pdf',
  },
  aquatic_small_lhCladoceran: {
    title: 'docs/09 §4 cladoceran row (ADW; ANGFA Daphnia; BUU Moina; FAO)',
    url: 'https://rainbowfish.angfa.org.au/foods_and_feeding/daphnia.html',
  },
  aquatic_small_lhAmphipod: {
    title:
      'docs/09 §4 amphipod row (USGS Hyalella azteca growth; Oceanol. Hydrobiol. Stud. 2022; Browne 2005 Parhyale)',
    url: 'https://www.usgs.gov/publications/postembryonic-growth-and-development-hyalella-azteca-laboratory-cultures-and',
  },
  aquatic_small_lhIsopod: {
    title:
      'docs/09 §4 isopod row (Vitagliano et al. 1991; Asellus bioenergetics, Rutland Water; NHM isopods)',
    url: 'https://figshare.com/articles/Ecology_and_bioenergetics_of_two_species_of_Asellus_in_Rutland_Water_/10191515',
  },
  aquatic_small_lhDetritusWorm: {
    title:
      'docs/09 §4 detritus_worm row (Naturalis freshwater Oligochaeta; SeaLifeBase Tubifex tubifex)',
    url: 'https://sealifebase.se/summary/Tubifex-tubifex',
  },
  aquatic_small_lhNematode: {
    title: 'docs/09 §4 nematode row (WPI; Biodiversitas; MDPI Water 16:1959; ScienceAsia 23:347)',
    url: 'https://www.mdpi.com/2073-4441/16/14/1959',
  },
  aquatic_small_lhBristleWorm: {
    title:
      'docs/09 §4 bristle_worm row (IJM Platynereis culture; Annelida.net Capitella capitata; SeaLifeBase)',
    url: 'https://www.ijm.fr/balavoine-lab-fast-cycling-culture-of-the-annelid-model-platynereis-dumerilii/',
  },
  aquatic_small_lhPlanarian: {
    title:
      'docs/09 §4 planarian row (PMC3306686; Nottingham; Population growth in Dugesia tigrina, J. Gen. Physiol. 61:767)',
    url: 'https://rupress.org/jgp/article/61/6/767/12791/Population-Growth-in-Planaria-Dugesia-tigrina',
  },
  aquatic_small_lhHydra: {
    title:
      'docs/09 §4 hydra row (HAGR; Martínez 1998 mortality ≈ 0.6%/yr; IJDB; PLOS One population doubling 3.5–14.8 d)',
    url: 'https://hagr.ageing-map.org/species/biblio.php?id=0653',
  },
} as const satisfies Record<string, Source>;
