import type { Source } from '../../sources';

/** Sources for the land_soil archetype group; keys are prefixed 'land_soil_'. */
export const LAND_SOIL_SOURCES = {
  land_soil_marschallProctor2004: {
    title:
      'Marschall & Proctor 2004, Are bryophytes shade plants? (Ann. Bot. 94:593): PPFD at 95% saturation, mosses median 583, liverworts median 214 µmol·m⁻²·s⁻¹',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4242232',
  },
  land_soil_ufPothos: {
    title:
      'UF/IFAS EP151, Cultural guidelines for interiorscape Epipremnum: 2,500–3,250 ft-c, damage at 33–40 °F, decline above 95 °F, RH 60–100%, medium pH 6.5–7.0',
    url: 'https://edis.ifas.ufl.edu/publication/EP151',
  },
  land_soil_neoregelia: {
    title: 'Neoregelia (Wikipedia): monocarpic rosettes produce several pups; protect below 10 °C',
    url: 'https://en.wikipedia.org/wiki/Neoregelia',
  },
  land_soil_chen2016Neoregelia: {
    title:
      'Chen 2016, NTU thesis: Neoregelia seedlings best at 25/20–30/25 °C, chilling injury at 15/13 °C, all died at 35/30 °C',
    url: 'https://tdr.lib.ntu.edu.tw/handle/123456789/3711',
  },
  land_soil_hughes2003: {
    title:
      'Hughes et al. 2003, Appl. Environ. Microbiol. 69:1488: soil fungal hyphal extension −2 to 25 °C, none at 37 °C',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC150076/',
  },
  land_soil_rousk2010: {
    title:
      'Rousk et al. 2010, Soil bacterial and fungal communities across a pH gradient (pH 4.0–8.3) in an arable soil, ISME J. 4:1340',
    url: 'https://doi.org/10.1038/ismej.2010.58',
  },
  land_soil_caro2022: {
    title:
      'Caro et al. 2022, Hydrogen stable isotope probing of lipids: apparent soil microbial generation times 20–64 d (6–1,137 d)',
    url: 'https://doi.org/10.1101/2022.07.11.499392',
  },
  land_soil_bionumbersSoil: {
    title:
      'BioNumbers 107505 and related entries: soil bacteria 10⁸–10⁹ cfu/g; prokaryotes ≈ 2 × 10⁹ cells/g top metre, ≤ 10¹⁰ cells/g',
    url: 'https://bionumbers.hms.harvard.edu/bionumber.aspx?id=107505',
  },
  land_soil_woodCelegans: {
    title:
      'Wood 1988, Introduction to C. elegans biology (CSH Monograph 17): life cycle ≈ 3 d, ≈ 300 self-progeny over ≈ 4 fertile days, lifespan 2–3 weeks',
    url: 'https://cshmonographs.org/index.php/monographs/article/view/5016',
  },
  land_soil_byerly1976: {
    title: 'Byerly et al. 1976, The life cycle of C. elegans: 16–25 °C acceptable culture limits',
    url: 'https://ftp.wormatlas.org/papers/Byerly%20et%20al%201976.pdf',
  },
  land_soil_panagrellus: {
    title:
      'Panagrellus redivivus (Wikipedia): females mature in ≈ 3 d; life cycle completed up to 31.5 °C, survives 37 °C',
    url: 'https://en.wikipedia.org/wiki/Panagrellus_redivivus',
  },
  land_soil_tully2008: {
    title:
      'Tully & Ferrière 2008, Reproductive flexibility in Folsomia candida (PLoS One): maturity within 2 weeks, inter-clutch interval 6.7 d, 21 °C, ≈ 100% RH',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2527682/',
  },
  land_soil_tully2023: {
    title:
      'Tully 2023, Actuarial and reproductive senescence in Folsomia candida (Front. Ecol. Evol. 11:1112045): lifespan 17–571 d, medians 42–115 d; clutch 1–178, median 26; ≈ 2 mm',
    url: 'https://doi.org/10.3389/fevo.2023.1112045',
  },
  land_soil_collembolaEggs: {
    title:
      'Checklist of the Collembola, egg formation: Sinella curviseta clutch mean 59 eggs about every 8 d',
    url: 'https://collembola.org/publicat/egg.htm',
  },
  land_soil_collembolaDensity: {
    title:
      'Eurasian J. For. Res. 13(2), Hokkaido (citing Kaneko 2007): forest-soil Collembola ≈ 10⁴ /m², occasionally 10⁵ /m²',
    url: 'https://eprints.lib.hokudai.ac.jp/repo/huscap/all/44671/EJFR13-2_003.pdf',
  },
  land_soil_scaberLifeCycle: {
    title:
      'scaber.org, Life cycle of woodlice: Porcellio scaber max ≈ 30 months, mature ≈ 15 months; Armadillidium vulgare max 41 months',
    url: 'https://scaber.org/porcellio-sub/woodlice/lcycle/',
  },
  land_soil_ufPillbug: {
    title:
      'UF/IFAS EENY, Pillbug Armadillidium vulgare: adults 8.5–18 mm, live 2–5 yr, 100–200 eggs per brood, 1–3 broods per year',
    url: 'https://edis.ifas.ufl.edu/pdf/IN/IN109900.pdf',
  },
  land_soil_trichorhina: {
    title: 'Trichorhina tomentosa (Wikipedia): 2–3 mm, parthenogenetic',
    url: 'https://en.wikipedia.org/wiki/Trichorhina_tomentosa',
  },
  land_soil_paolettiHassall1999: {
    title:
      'Paoletti & Hassall 1999, Woodlice as bioindicators (Agric. Ecosyst. Environ. 74:157): woodlice up to 3,000 /m² in calcareous grassland',
  },
  land_soil_iucnPorcellio: {
    title: 'IUCN GISD, Porcellio scaber: lower lethal temperature ≈ −4.6 °C',
    url: 'https://www.iucngisd.org/gisd/species.php?sc=1460',
  },
  land_soil_porcellioHeat: {
    title:
      'Hypoxia lowers temperature preference and heat tolerance in Porcellio scaber (PLoS One 2019): heat tolerance 38.9 °C under hypoxia',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6675064/',
  },
  land_soil_bugguideOxidus: {
    title: 'BugGuide, Oxidus gracilis: mature at 5–6 months, clutches of 40–150 eggs',
    url: 'https://www.bugguide.net/node/view/26414',
  },
  land_soil_bmigOxidus: {
    title:
      'British Myriapod & Isopod Group, Oxidus gracilis: maturity in ≈ 5 months at 22 °C, eggs laid year-round',
    url: 'https://bmig.org.uk/species/oxidus-gracilis',
  },
  land_soil_niesEnchytraeus: {
    title:
      'NIES ref. 5901, Enchytraeus variatus at 18–22 °C: 5–20 ova per cocoon, generation 14–39 d, 23.7–25.8 cocoons per life, max lifespan 254 d',
    url: 'https://web.nies.go.jp/chiiki1/protoz/refere/id5999/5901.htm',
  },
  land_soil_schlaghamersky2013: {
    title:
      'Schlaghamerský 2013, Enchytraeids of a Nebraska sandhill prairie (Soil Organisms 85): 3,400 ± 800 /m²',
    url: 'https://soil-organisms.org/index.php/SO/article/view/375',
  },
  land_soil_holmstrup2023: {
    title:
      'Holmstrup et al. 2023, Thermal death time landscape of Enchytraeus albidus (Pedobiologia 97–98:150876): TDT50 257 min at 31 °C, 6 min at 35.5 °C',
    url: 'https://pure.au.dk/ws/files/335048566/1_s2.0_S003140562305014X_main.pdf',
  },
  land_soil_hundalZinia: {
    title:
      'Hundal & Zinia, Comparative biology of Eudrilus eugeniae and Eisenia fetida: E. fetida clitellate 44–52 d, 0.47 cocoons/worm/day, 1–5 hatchlings per cocoon, substrate moisture 80%',
    url: 'https://archive.org/download/biostor-192539/biostor-192539.pdf',
  },
  land_soil_cornellVermicompost: {
    title: 'Cornell eCommons FP 04-014 (Hou 2005), vermicomposting: E. fetida substrate pH 6.0–8.0',
    url: 'https://ecommons.cornell.edu/bitstream/handle/1813/10443/FP%2004%20014%20Hou%20final%202Dec2005.pdf',
  },
  land_soil_osuSlug: {
    title:
      'Oregon State Slug Portal, gray field slug Deroceras reticulatum: lives 6–12 (18) months, matures 5–6 months, 200–500 mg, ≈ 40 eggs per cluster',
    url: 'https://agsci.oregonstate.edu/slug-portal/life-slug/biology-and-life-cycle-gray-field-slug',
  },
  land_soil_bessa1990: {
    title:
      'Bessa 1990, Subulina octona in the laboratory: self-fertilization, first eggs at 38–50 d, 2–8 eggs per cluster, oviposition every 7–31 d',
    url: 'https://tede.ufrrj.br/jspui/bitstream/jspui/3906/2/1990-%20Elisabeth%20Cristina%20de%20Almeida%20Bessa.pdf',
  },
  land_soil_subulinaHeat: {
    title:
      'Braz. Arch. Biol. Technol.: Subulina octona survives 48 h at 35 °C on humid substrate, dies on dry substrate',
    url: 'https://www.scielo.br/j/babt/a/5djvQRmxDNKP8MjmhWpqW5m/abstract/?lang=en',
  },
  land_soil_reischke2014: {
    title:
      'Reischke, Rousk & Bååth 2014, Effects of glucose loading rates on bacterial and fungal growth in soil (SBB 70:88): exponential community growth ≈ 0.25 h⁻¹',
    url: 'https://www.lunduniversity.lu.se/lup/publication/cf9221e5-3ee2-4d17-9502-81889d0c9b10',
  },
  land_soil_rousk2007: {
    title:
      'Rousk & Bååth 2007, Fungal biomass production and turnover in soil (SBB 39:2173): turnover time 130–150 d',
    url: 'https://lup.lub.lu.se/record/707510',
  },
  land_soil_xu2013: {
    title:
      'Xu, Thornton & Post 2013, A global analysis of soil microbial biomass C, N and P (GEB 22:737): surface Cmic 56.7 mmol C/kg',
    url: 'https://data.ornldaac.earthdata.nasa.gov/public/global_soil/Global_Microbial_Biomass_C_N_P/comp/XuXF2013_GEB.pdf',
  },
} as const satisfies Record<string, Source>;
