import type { Source } from '../../sources';

/** Sources for the large_freshwater archetype group; keys are prefixed 'large_freshwater_'. */
export const LARGE_FRESHWATER_SOURCES = {
  large_freshwater_wikiSilverArowana: {
    title: 'Wikipedia: Silver arowana (Osteoglossum bicirrhosum)',
    url: 'https://en.wikipedia.org/wiki/Silver_arowana',
  },
  large_freshwater_fishbaseOsteoglossum: {
    title: 'FishBase: Osteoglossum bicirrhosum summary (24–30 °C, 90 cm TL, 6.0 kg)',
    url: 'https://www.fishbase.se/summary/Osteoglossum-bicirrhosum.html',
  },
  large_freshwater_wikiLepisosteus: {
    title: 'Wikipedia: Lepisosteus (gars)',
    url: 'https://en.wikipedia.org/wiki/Lepisosteus',
  },
  large_freshwater_fishbaseLepisosteus: {
    title:
      'FishBase: Lepisosteus oculatus summary (fresh/brackish, 12–20 °C, 4.4 kg, 18 yr, air-breathing)',
    url: 'https://www.fishbase.se/summary/Lepisosteus-oculatus.html',
  },
  large_freshwater_seriouslyFishPolypterus: {
    title: 'Seriously Fish: Polypterus endlicheri (22–27 °C, pH 6.0–8.0, 210 × 120 cm, 2,268 L)',
    url: 'https://www.seriouslyfish.com/species/polypterus-endlicheri-endlicheri',
  },
  large_freshwater_fishbasePolypterus: {
    title: 'FishBase: Polypterus endlicheri summary (65.5 cm SL, 3.4 kg, air-breathing)',
    url: 'https://www.fishbase.se/summary/Polypterus-endlicheri.html',
  },
  large_freshwater_seriouslyFishChanna: {
    title: 'Seriously Fish: Channa micropeltes (20–30 °C, pH 6.0–8.0, matures ≈ 2 yr)',
    url: 'https://seriouslyfish.com/species/channa-micropeltes',
  },
  large_freshwater_fishbaseChanna: {
    title: 'FishBase: Channa micropeltes summary (130 cm SL, 20 kg, obligate air-breathing)',
    url: 'https://www.fishbase.se/summary/Channa-micropeltes.html',
  },
  large_freshwater_seriouslyFishCichla: {
    title: 'Seriously Fish: Cichla ocellaris (24–27 °C, pH 6.5–7.0, tank 10 × 3 × 4 ft)',
    url: 'https://seriouslyfish.com/species/cichla-ocellaris',
  },
  large_freshwater_fishbaseCichla: {
    title:
      'FishBase: Cichla ocellaris summary (74 cm TL, 6.8 kg, 9,000–15,000 eggs/kg every two months)',
    url: 'https://www.fishbase.se/summary/Cichla-ocellaris.html',
  },
  large_freshwater_fishbaseAstronotus: {
    title: 'FishBase: Astronotus ocellatus summary (pH 6.0–8.0, 22–25 °C, 45.7 cm TL, 1.6 kg)',
    url: 'https://www.fishbase.se/summary/SpeciesSummary.php?id=3612',
  },
  large_freshwater_wikiTambaqui: {
    title: 'Wikipedia: Tambaqui (Colossoma macropomum)',
    url: 'https://en.wikipedia.org/wiki/Tambaqui',
  },
  large_freshwater_fishbaseColossoma: {
    title: 'FishBase: Colossoma macropomum summary (pH 5.0–7.8, 22–28 °C, 108 cm TL, 40 kg)',
    url: 'https://www.fishbase.se/summary/Colossoma-macropomum.html',
  },
  large_freshwater_wikiSilverDollar: {
    title: 'Wikipedia: Silver dollar (fish)',
    url: 'https://en.wikipedia.org/wiki/Silver_dollar_(fish)',
  },
  large_freshwater_fishbaseMetynnis: {
    title: 'FishBase: Metynnis argenteus summary (pH 5.0–7.0, 24–28 °C, 14 cm SL, 153 g)',
    url: 'https://www.fishbase.se/summary/Metynnis-argenteus.html',
  },
  large_freshwater_pondTradeKoi: {
    title: 'Pond Trade Magazine: Ponds by the numbers (koi stocking, longevity, fecundity)',
    url: 'https://www.pondtrademag.com/ponds-by-the-numbers-rules-for-a-lawless-industry/',
  },
  large_freshwater_fishbaseCyprinus: {
    title: 'FishBase: Cyprinus carpio summary (pH 6.5–9.0, 3–35 °C, 40.1 kg, 38 yr)',
    url: 'https://www.fishbase.se/summary/Cyprinus-carpio.html',
  },
  large_freshwater_guinnessGoldfish: {
    title: 'Guinness World Records: Oldest goldfish ever (43 years)',
    url: 'https://www.guinnessworldrecords.com/world-records/70745-oldest-goldfish-ever',
  },
  large_freshwater_fishbaseCarassius: {
    title:
      'FishBase: Carassius auratus summary (pH 6.0–8.0, 0–41 °C, ≤ 15 ppt prolonged, 1.6 kg, spawns every 8–10 days)',
    url: 'https://www.fishbase.se/summary/Carassius-auratus.html',
  },
  large_freshwater_fishbasePterygoplichthys: {
    title:
      'FishBase: Pterygoplichthys pardalis summary (pH 7.0–7.5, 23–28 °C, 655 g, air-breathing)',
    url: 'https://www.fishbase.se/summary/Pterygoplichthys-pardalis.html',
  },
  large_freshwater_seriouslyFishPhractocephalus: {
    title: 'Seriously Fish: Phractocephalus hemioliopterus (21–26 °C, pH 6.0–7.5)',
    url: 'https://seriouslyfish.com/species/phractocephalus-hemioliopterus',
  },
  large_freshwater_fishbasePhractocephalus: {
    title: 'FishBase: Phractocephalus hemioliopterus summary (pH 5.5–6.8, 20–26 °C, 44.2 kg)',
    url: 'https://www.fishbase.se/summary/Phractocephalus-hemioliopterus.html',
  },
  large_freshwater_pfkStingrays: {
    title: 'Practical Fishkeeping: Definitive guide to South American freshwater rays',
    url: 'https://www.practicalfishkeeping.co.uk/features/definitive-guide-to-south-american-freshwater-rays/',
  },
  large_freshwater_fishbasePotamotrygon: {
    title: 'FishBase: Potamotrygon motoro summary (pH 5.0–6.0, 24–26 °C, 3–21 embryos)',
    url: 'https://www.fishbase.se/summary/Potamotrygon-motoro.html',
  },
  large_freshwater_seriouslyFishMastacembelus: {
    title: 'Seriously Fish: Mastacembelus erythrotaenia (24–28 °C, pH 6.0–7.0, 120 cm tank)',
    url: 'https://seriouslyfish.com/species/mastacembelus-erythrotaenia',
  },
  large_freshwater_fishbaseMastacembelus: {
    title: 'FishBase: Mastacembelus erythrotaenia summary (pH 6.0–8.0, 24–28 °C, 100 cm TL)',
    url: 'https://www.fishbase.se/summary/Mastacembelus-erythrotaenia.html',
  },
  large_freshwater_fishbaseScatophagus: {
    title: 'FishBase: Scatophagus argus summary (20–28 °C, 45 cm TL, multiple spawner)',
    url: 'https://fishbase.se/summary/4698',
  },
  large_freshwater_tambacuAmmonia: {
    title:
      'Rev. Ciênc. Agron. 2020: acute toxicity of NH3 to tambacu (C. macropomum × P. mesopotamicus), 96-h LC50 1.63 mg NH3/L',
    url: 'https://new.scielo.br/j/rca/a/3nBjT35fxRY4dvVc9VX7f3Q/?lang=en',
  },
  large_freshwater_carpAmmonia: {
    title:
      'J. Aquac. Prod. Util.: unionized ammonia in common carp fingerlings, 96-h LC50 1.17 mg/L, max sublethal 0.12 mg/L',
    url: 'https://japu.gau.ac.ir/article_4030.html?lang=en',
  },
  large_freshwater_goldfishAmmonia: {
    title:
      'Wilkie et al. 2011, J. Exp. Biol. 214:4107: goldfish 96-h LC50 NH3 199 µmol/L, total ammonia 4,132 µmol/L',
    url: 'https://heronext.epa.gov/reference/2009680',
  },
  large_freshwater_snakeheadAmmonia: {
    title:
      'Qin et al. 1997, J. World Aquac. Soc.: tolerance of snakehead Channa striatus to ammonia at different pH (ceiling 0.54 mg NH3-N/L at pH 8)',
  },
  large_freshwater_snakeheadNitrite: {
    title: 'Can Tho Univ. J. Sci.: nitrite 96-h LC50 238.8 mg N-NO2/L in juvenile Channa striata',
    url: 'https://ctujsvn.ctu.edu.vn/index.php/ctujsvn/article/view/1603',
  },
  large_freshwater_nitriteReview: {
    title:
      'Kroupova et al. 2005, Nitrite influence on fish: a review, Vet. Med. Czech 50:461 (10% of 96-h LC50 not detrimental; tilapia 96-h LC50 8 mg N/L)',
    url: 'https://doi.org/10.17221/5650-VETMED',
  },
  large_freshwater_matrinxaNitrite: {
    title:
      'Avilez et al. 2004, Ciência Rural 34:1753: nitrite 96-h LC50 0.86 mg NO2-N/L in matrinxã Brycon cephalus',
    url: 'https://www.redalyc.org/pdf/331/33134613.pdf',
  },
  large_freshwater_oscarHypoxia: {
    title:
      'Scott et al. 2008, Respiratory responses to progressive hypoxia in the Amazonian oscar (Pcrit 46 Torr)',
    url: 'https://research-portal.uws.ac.uk/en/publications/respiratory-responses-to-progressive-hypoxia-in-the-amazonian-osc/',
  },
  large_freshwater_tambaquiHypoxia: {
    title:
      'Fish Physiol. Biochem. 2020: tambaqui juveniles held 72 h at 0.92 mg O2/L without mortality',
    url: 'https://link.springer.com/doi/10.1007/s10695-020-00868-8',
  },
  large_freshwater_carpOxygen: {
    title: 'NJ Division of Fish & Wildlife: common carp fact sheet (gulps air below 0.5 mg/L DO)',
    url: 'https://www.nj.gov/dep/fgw/pdf/fishfact/carp.pdf',
  },
} as const satisfies Record<string, Source>;
