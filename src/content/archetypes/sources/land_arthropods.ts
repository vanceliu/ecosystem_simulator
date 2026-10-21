import type { Source } from '../../sources';

/** Sources for the land_arthropods archetype group; keys are prefixed 'land_arthropods_'. */
export const LAND_ARTHROPODS_SOURCES = {
  land_arthropods_oribatidDensity: {
    title:
      'Regional factors rather than forest type drive oribatid mite community structure: 32,985–117,352 ind./m²',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3349857/',
  },
  land_arthropods_oribatidaWiki: {
    title:
      'Oribatida (Wikipedia): body length 0.2–1.4 mm; egg to adult several months to two years',
    url: 'https://en.wikipedia.org/wiki/Oribatida',
  },
  land_arthropods_tyrophagusTemperature: {
    title:
      'Temperature-dependent development and reproductive traits of Tyrophagus putrescentiae, Environ. Entomol. 44(2), 16–34 °C, 80% RH',
    url: 'https://bioone.org/journals/Environmental-Entomology/volume-44/issue-2/nvu064/Temperature-Dependent-Development-and-Reproductive-Traits-of-Tyrophagus-putrescentiae-Sarcoptiformes/10.1093/ee/nvu064.full',
  },
  land_arthropods_tyrophagusDiet: {
    title:
      'Tyrophagus putrescentiae life table on stored foods at 30 °C, 45% RH: female longevity 21.3–29.5 d (EKB journal)',
    url: 'https://jsasj.journals.ekb.eg/article_392371.html',
  },
  land_arthropods_tyrophagusBran: {
    title:
      'Bran moisture content and Tyrophagus putrescentiae population growth (28 °C, 80% RH), Syst. Appl. Acarol. 20:497',
    url: 'https://bioone.org/journals/Systematic-and-Applied-Acarology/volume-20/issue-5/saa.20.5.6/Effect-of-bran-moisture-content-and-initial-population-density-on/10.11158/saa.20.5.6.full',
  },
  land_arthropods_stratiolaelapsWiki: {
    title:
      'Stratiolaelaps scimitus (Wikipedia): ≈ 0.5 mm, egg to adult 10–34 d, up to 3 eggs/day, prey fungus gnat larvae and springtails',
    url: 'https://en.wikipedia.org/wiki/Stratiolaelaps_scimitus',
  },
  land_arthropods_stratiolaelapsDiet: {
    title:
      'Xie, Yan & Zhang 2018, Development, survival and reproduction of Stratiolaelaps scimitus on different diets (25 °C, 80% RH), Syst. Appl. Acarol. 23:4',
    url: 'https://bioone.org/journals/systematic-and-applied-acarology/volume-23/issue-4/saa.23.4.16/Development-survival-and-reproduction-of-Stratiolaelaps-scimitus-Acari--Laelapidae/10.11158/saa.23.4.16.full',
  },
  land_arthropods_stratiolaelapsCabrera: {
    title:
      'Cabrera, Cloyd & Zaborski 2005, Stratiolaelaps scimitus on fungus gnat larvae and potworms: adult longevity 27.3 d, 26.5 eggs over 18.6 d, Exp. Appl. Acarol. 36:71',
    url: 'https://doi.org/10.1007/s10493-005-0242-x',
  },
  land_arthropods_bradysiaKorea: {
    title:
      'Bradysia sp. (Sciaridae) development, longevity and fecundity at 10–28 °C on oyster mushroom (KoreaScience)',
    url: 'https://koreascience.kr/article/JAKO199811920246943.pub',
  },
  land_arthropods_bradysiaDifformis: {
    title:
      'Bradysia difformis adult longevity and fecundity at 10–30 °C, adults at 80% RH (PMC6550394)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6550394/',
  },
  land_arthropods_drosophilaWiki: {
    title:
      'Drosophila melanogaster (Wikipedia): female 2.5 mm; egg to adult 7 d at 28 °C, 19 d at 18 °C, > 50 d at 12 °C; ≈ 50 d egg to death at 25 °C; up to 100 eggs/day',
    url: 'https://en.wikipedia.org/wiki/Drosophila_melanogaster',
  },
  land_arthropods_drosophilaDryMass: {
    title:
      'BioNumbers 102570: Drosophila melanogaster adult dry mass 0.219–0.304 mg (Worthen 1996)',
    url: 'https://bionumbers.hms.harvard.edu/bionumber.aspx?id=102570',
  },
  land_arthropods_cricketTemperature: {
    title:
      'Acheta domesticus and Gryllus bimaculatus life history at 18–38 °C: egg to adult 66–200 d, up to 1,360 eggs/female (EANSO)',
    url: 'https://journals.eanso.org/index.php/eajab/article/view/834',
  },
  land_arthropods_cricketWiki: {
    title:
      'House cricket (Wikipedia): adult 16–21 mm, development at 26–32 °C, omnivorous, cannibalistic',
    url: 'https://en.wikipedia.org/wiki/House_cricket',
  },
  land_arthropods_cricketDryMatter: {
    title: 'Feedipedia (FAO): house cricket fresh, dry matter 28.4% (22.9–33.2%) as fed',
    url: 'https://feedipedia.review.fao.org/node/12267',
  },
  land_arthropods_dalotiaKsu: {
    title:
      'Cloyd 2022, Rove beetle Dalotia coriaria: biological control agent of fungus gnats and thrips (K-State MF3614)',
    url: 'https://bookstore.ksre.ksu.edu/pubs/MF3614.pdf',
  },
  land_arthropods_mealwormWiki: {
    title:
      'Mealworm (Wikipedia): Tenebrio molitor adult 12.5–18 mm, lives 6–12 months, ≈ 500 eggs/female',
    url: 'https://en.wikipedia.org/wiki/Mealworm',
  },
  land_arthropods_tenebrioReview: {
    title:
      'Ribeiro et al. 2018, Tenebrio molitor review: no oviposition < 14 °C, optimum 25–28 °C, 60–75% RH (J. Entomol. Sci. 53:434)',
    url: 'https://jes.kglmeridian.com/view/journals/ents/53/4/article-p434.xml',
  },
  land_arthropods_tenebrioWeight: {
    title:
      'Effect of adult weight and density on fecundity of Tenebrio molitor: adult weight classes 70–110 mg (ESA 2010)',
    url: 'https://esa.confex.com/esa/2010/webprogram/Paper51782.html',
  },
  land_arthropods_mealwormDryMatter: {
    title: 'Feedipedia (FAO): mealworm (Tenebrio molitor) fresh, dry matter 42.2% as fed',
    url: 'https://feedipedia.review.fao.org/node/17070',
  },
  land_arthropods_pholcusWiki: {
    title:
      'Pholcus phalangioides (Wikipedia): female ≈ 8 mm; matures ≈ 1 year; lives up to 2 years after maturity; cannibalistic',
    url: 'https://en.wikipedia.org/wiki/Pholcus_phalangioides',
  },
  land_arthropods_pholcusSunshineCoast: {
    title:
      'Sunshine Coast Council: daddy-long-legs spider, adult lifespan 223–774 d, 2–8 egg sacs of up to 50 eggs',
    url: 'https://www.sunshinecoast.qld.gov.au/environment/education-resources-and-events/environment-resources-and-publications/invertebrates/daddy-long-legs-spider',
  },
  land_arthropods_lithobiusWiki: {
    title:
      'Lithobius forficatus (Wikipedia): 18–30 mm; lives up to 5–6 years; preys on insects, spiders, slugs, worms',
    url: 'https://en.wikipedia.org/wiki/Lithobius_forficatus',
  },
  land_arthropods_lithobiusDensity: {
    title:
      'Wignarajah & Phillipson 1977, Numbers and biomass of centipedes in a Betula–Alnus woodland, Oecologia: L. forficatus 7.58–24.07 /m²',
    url: 'https://doi.org/10.1007/BF00348708',
  },
  land_arthropods_cheliferWiki: {
    title:
      'Chelifer cancroides (Wikipedia): body 2.5–4.5 mm; egg to adult 10–24 months; 20–40 eggs; adults live 3–4 years',
    url: 'https://en.wikipedia.org/wiki/Chelifer_cancroides',
  },
  land_arthropods_antWiki: {
    title:
      'Ant (Wikipedia): workers live 1–3 years, queens up to 30 years; most species omnivorous',
    url: 'https://en.wikipedia.org/wiki/Ant',
  },
  land_arthropods_bioDudeAnts: {
    title: 'The Bio Dude: ants in bioactive enclosures (species, nesting under substrate)',
    url: 'https://www.thebiodude.com/blogs/how-to-deal-with-vivarium-pests/help-there-are-ants-in-my-bioactive-enclosure',
  },
} as const satisfies Record<string, Source>;
