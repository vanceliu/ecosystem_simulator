import { MICROBES_AQUATIC_SOURCES } from './archetypes/sources/microbes_aquatic';
import { LAND_SOIL_SOURCES } from './archetypes/sources/land_soil';
import { LAND_ARTHROPODS_SOURCES } from './archetypes/sources/land_arthropods';
import { AQUATIC_SMALL_SOURCES } from './archetypes/sources/aquatic_small';
import { AQUATIC_BENTHIC_SOURCES } from './archetypes/sources/aquatic_benthic';
import { AMPHIBIANS_SEMI_SOURCES } from './archetypes/sources/amphibians_semi';
import { REPTILES_SMALL_FISH_SOURCES } from './archetypes/sources/reptiles_small_fish';
import { LARGE_FRESHWATER_SOURCES } from './archetypes/sources/large_freshwater';
import { LARGE_MARINE_SOURCES } from './archetypes/sources/large_marine';

export interface Source {
  readonly title: string;
  readonly url?: string;
}

const CORE_SOURCES = {
  asm1: {
    title:
      'Henze et al. 1987, Activated Sludge Model No. 1, default parameters at 20 °C (WaterTAP)',
    url: 'https://watertap.readthedocs.io/en/stable/technical_reference/property_models/ASM1.html',
  },
  nitrospiraKinetics: {
    title: 'Nowka et al. 2015, Comparison of oxidation kinetics of nitrite-oxidizing bacteria',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4277589',
  },
  nitrifierPh: {
    title:
      'Tarre & Green 2004, High-rate nitrification at low pH, Appl. Environ. Microbiol. 70:6481',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC525248',
  },
  perliteBiofilter: {
    title:
      'Proc. Florida State Hort. Soc. 117 (2004): perlite biofilter nitrification fastest at pH 8.5',
    url: 'https://journals.flvc.org/fshs/article/view/85855',
  },
  hovanecPatent: {
    title:
      'US Patent 6,207,440 (Hovanec): new freshwater aquarium ammonia peak ≈ day 12, cycled ≈ day 26',
    url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6207440',
  },
  nitrificationStoichiometry: {
    title: 'SNU OCW, Biological wastewater treatment: nitrification stoichiometry',
    url: 'https://ocw.snu.ac.kr/sites/default/files/NOTE/L15_Biological%20wastewater%20treatment%20I.pdf',
  },
  cellFormula: {
    title: 'Metcalf & Eddy, Wastewater Engineering: cell formulas C5H7O2N and C60H87O23N12P',
  },
  bionumbers: {
    title:
      'BioNumbers (OpenWetware mirror): E. coli cell dry weight 0.3 pg; protein ≈ 55% of dry mass',
    url: 'https://openwetware.org/wiki/BioNumbers_data_base',
  },
  epaHpc: {
    title: 'US EPA Distribution System Toolbox: Heterotrophic Plate Count fact sheet',
    url: 'https://www.epa.gov/system/files/documents/2023-08/DS%20Toolbox%20Fact%20Sheets_HPC_508ed.pdf',
  },
  lakeBacteria: {
    title: 'Lake bacterioplankton abundance 0.6–2 × 10⁶ cells/mL (Michigan Tech)',
    url: 'https://digitalcommons.mtu.edu/michigantech-p/7549',
  },
  rasBacteria: {
    title:
      'Bacterial abundance in recirculating aquaculture systems 3.6 × 10⁶–1.7 × 10⁷ cells/mL (Ifremer)',
    url: 'https://archimer.ifremer.fr/doc/00000/1553/1186.pdf',
  },
  biofilmDensity: {
    title: 'Biofilm cell density 10⁶–10⁸ cells/cm² (DTU drinking-water biofilm study)',
    url: 'https://orbit.dtu.dk/en/publications/dynamics-of-biofilm-formation-in-a-model-drinking-water-distribut/',
  },
  litterDecay: {
    title:
      'Soil moisture effects on leaf litter decomposition in wetland and upland forests (k 0.53–1.18 yr⁻¹)',
    url: 'https://scholar.korea.ac.kr/handle/2021.sw.korea/97592',
  },
  emerson1975: {
    title:
      'Emerson et al. 1975, Aqueous ammonia equilibrium calculations, J. Fish. Res. Board Can. 32:2379',
  },
  carbonateEquilibrium: {
    title: 'Carbonic acid first dissociation constant pK1 = 6.35 at 25 °C',
    url: 'https://en.wikipedia.org/wiki/Carbonic_acid',
  },
  rainNitrogenThailand: {
    title: 'Rainwater nitrate and ammonium at rural Thai sites (Environ. Monit. Assess.)',
    url: 'https://link.springer.com/doi/10.1007/s10661-005-1593-9',
  },
  riverDoc: {
    title: 'Riverine DOC in Eastern China main rivers 4.98 ± 2.45 mg/L (AGRIS)',
    url: 'https://agris.fao.org/search/en/records/65df04ad4c5aef494fdf0554',
  },
  seawaterDoc: {
    title: 'Coastal seawater DOC 40–165 µM (BCO-DMO dataset description)',
    url: 'https://bco-dmo.org/dataset/878750/Dataset_description.pdf',
  },
  periphytonAfdm: {
    title: 'Periphyton AFDM 0.2–1.04 mg/cm² in artificial streams (Iran. J. Sci. Technol.)',
    url: 'https://ijsts.shirazu.ac.ir/article_2781.html',
  },
  litterStockTemperate: {
    title:
      'Forest-floor litter stocks 500–800 g/m² deciduous to 1000–5000 g/m² coniferous (Moscow)',
    url: 'https://link.springer.com/10.3103/S0147687419020017',
  },
  litterStockSubtropical: {
    title: 'Subtropical forest litter stock 367.5 g/m² (J. Plant Ecol.)',
    url: 'https://academic.oup.com/jpe/article/12/4/769/5419807',
  },
  litterStockTropical: {
    title: 'Dry tropical forest floor standing crop (Ochrana Ma.)',
    url: 'https://om.vuvb.uniza.sk/index.php/OM/article/view/48',
  },
  soilBacteria: {
    title: 'CU Boulder record of soil microbial growth-rate study (generation times)',
    url: 'https://vivo.colorado.edu/display/pubid_327935',
  },
  feedLeaching: {
    title: 'Global Seafood Alliance: pellet dry-matter loss 2.6–10.4% after 60 min in water',
    url: 'https://www.globalseafood.org/advocate/pellet-stability-hardness-influence-feed-consumption-of-pacific-white-shrimp/',
  },
  jonesFactor: {
    title: 'FAO Food and Nutrition Paper 77, ch. 2: nitrogen-to-protein factor 6.25',
    url: 'https://www.fao.org/4/y5022e/y5022e03.htm',
  },
  isa: {
    title: 'International Standard Atmosphere',
    url: 'https://en.wikipedia.org/wiki/International_Standard_Atmosphere',
  },
  usgsDo: {
    title: 'USGS Office of Water Quality memo 2011.03: Benson & Krause dissolved-oxygen solubility',
    url: 'https://water.usgs.gov/admin/memo/QW/qw11.03.pdf',
  },
  forsythe1995: {
    title: 'Forsythe et al. 1995, CBM day-length model (geosphere::daylength)',
    url: 'https://r-packages.io/packages/geosphere/daylength',
  },
  fao56: {
    title: 'FAO Irrigation and Drainage Paper 56, ch. 3: solar declination',
    url: 'http://www.fao.org/4/x0490e/x0490e07.htm',
  },
  pveducationAirMass: {
    title: 'PVEducation: air mass and direct irradiance (Laue 1970)',
    url: 'https://www.pveducation.org/pvcdrom/properties-of-sunlight/air-mass',
  },
  parConversion: {
    title: 'bigleaf::Rg.to.PPFD and PAR fraction of global radiation',
    url: 'https://search.r-project.org/CRAN/refmans/bigleaf/html/Rg.to.PPFD.html',
  },
  iceGasExchange: {
    title: 'Biogeosciences 2019: gas transfer under ice ≈ 6% of open water',
    url: 'https://bg.copernicus.org/articles/16/3351/2019/',
  },
  koppenBeck2018: {
    title: 'Beck et al. 2018, Present and future Köppen–Geiger climate classification maps',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6207062',
  },
  stationNormals: {
    title: 'WMO 1991–2020 station climate normals as listed on Wikipedia climate tables (11 §8)',
    url: 'https://en.wikipedia.org/wiki/Climate_of_Singapore',
  },
  evaporationArid: {
    title: 'Open-water evaporation, East Juyan Lake (MDPI Water 2020)',
    url: 'https://www.mdpi.com/2073-4441/12/5/1508',
  },
  evaporationSemiArid: {
    title: 'Open-water evaporation, Tunisia (IRD)',
    url: 'https://www.documentation.ird.fr/hor/fdi:010067264',
  },
  evaporationHumidTropics: {
    title: 'Pan evaporation in India, MAUSAM (humid tropics 4–10 mm/day)',
    url: 'https://mausamjournal.imd.gov.in/index.php/MAUSAM/article/view/2378',
  },
  biotopeAquarium: {
    title: 'Biotope Aquarium Design Contest and habitat references (11 §8)',
    url: 'https://biotope-aquarium.info/?p=11458',
  },
  finlay2002: {
    title:
      'Finlay 2002, Global dispersal of free-living microbial eukaryote species, Science 296:1061',
    url: 'https://web.nies.go.jp/chiiki1/protoz/refere/id6999/6798.htm',
  },
  aadInvertebrates: {
    title: 'Australian Antarctic Division: Antarctic terrestrial invertebrates',
    url: 'https://www.antarctica.gov.au/about-antarctica/animals/invertebrates/',
  },
  hawaiiAnts: {
    title: 'University of Hawaiʻi: no native ants in Hawaiʻi',
    url: 'https://hawaii.edu/ant/home/home.html',
  },
  taxonDistribution: {
    title:
      'Taxon distribution pages (Wikipedia, AmphibiaWeb, FishBase, ADW, AFD) listed in docs/11 §8',
    url: 'https://amphibiaweb.org/lists/Salamandridae.shtml',
  },
  olson2001: {
    title: 'Olson et al. 2001, Terrestrial ecoregions of the world (8 realms)',
    url: 'https://en.wikipedia.org/wiki/Biogeographic_realm',
  },
} as const satisfies Record<string, Source>;

/** Archetype group source keys never collide with core keys (tests/content/archetypes.test.ts). */
export const SOURCES = {
  ...CORE_SOURCES,
  ...MICROBES_AQUATIC_SOURCES,
  ...LAND_SOIL_SOURCES,
  ...LAND_ARTHROPODS_SOURCES,
  ...AQUATIC_SMALL_SOURCES,
  ...AQUATIC_BENTHIC_SOURCES,
  ...AMPHIBIANS_SEMI_SOURCES,
  ...REPTILES_SMALL_FISH_SOURCES,
  ...LARGE_FRESHWATER_SOURCES,
  ...LARGE_MARINE_SOURCES,
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;

export const SOURCE_GROUPS: readonly Readonly<Record<string, Source>>[] = [
  CORE_SOURCES,
  MICROBES_AQUATIC_SOURCES,
  LAND_SOIL_SOURCES,
  LAND_ARTHROPODS_SOURCES,
  AQUATIC_SMALL_SOURCES,
  AQUATIC_BENTHIC_SOURCES,
  AMPHIBIANS_SEMI_SOURCES,
  REPTILES_SMALL_FISH_SOURCES,
  LARGE_FRESHWATER_SOURCES,
  LARGE_MARINE_SOURCES,
];
