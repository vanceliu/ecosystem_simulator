import type { Source } from '../../sources';

/** Sources for the amphibians_semi archetype group; keys are prefixed 'amphibians_semi_'. */
export const AMPHIBIANS_SEMI_SOURCES = {
  amphibians_semi_dendrobatesWiki: {
    title:
      'Wikipedia, Blue poison dart frog: SVL 3.0–4.5 cm, ≈ 8 g, 4–6 yr wild / ≈ 10 yr captive, 5–10 eggs, maturity 2 yr',
    url: 'https://en.wikipedia.org/wiki/Blue_poison_dart_frog',
  },
  amphibians_semi_joshsAzureus: {
    title:
      "Josh's Frogs care sheet, Dendrobates tinctorius 'Azureus': 60–80 °F, 10–20+ yr, maturity 10–12 months, 10 gal per adult",
    url: 'https://joshsfrogs.com/care-sheet/dendrobates-tinctorius-azureus',
  },
  amphibians_semi_joshsAuratus: {
    title:
      "Josh's Frogs, Dendrobates auratus: humidity 70–100 %, tolerable 65–85 °F, > 85 °F dangerous",
    url: 'https://www.joshsfrogs.com/dendrobates-auratus-turquoise-and-bronze.html',
  },
  amphibians_semi_agalychnisWiki: {
    title:
      'Wikipedia, Agalychnis callidryas: males 51 mm, females 76 mm, ≈ 5 yr wild, ≈ 40 eggs per clutch on leaves over water, humidity ≥ 80 %',
    url: 'https://en.wikipedia.org/wiki/Agalychnis_callidryas',
  },
  amphibians_semi_joshsRedEye: {
    title:
      "Josh's Frogs care sheet, red-eyed tree frog: 18 × 18 × 24 in terrarium for 2–4 frogs, lifespan 5+ yr",
    url: 'https://joshsfrogs.com/care-sheet/red-eye-tree-frog-captive-bred-agalychnis-callidryas',
  },
  amphibians_semi_petmdRedEye: {
    title:
      'PetMD, red-eyed tree frog care sheet: 68–80 °F, never above 80 °F, humidity 70–80 %, up to 8–12 yr',
    url: 'https://www.petmd.com/reptile/red-eyed-tree-frog-care-sheet',
  },
  amphibians_semi_bombinaWiki: {
    title:
      'Wikipedia, Oriental fire-bellied toad: 3.8–5.1 cm, ≈ 12 yr captive (to 30), 40–110 eggs, legs at 6–8 weeks, mild skin toxin',
    url: 'https://en.wikipedia.org/wiki/Oriental_fire-bellied_toad',
  },
  amphibians_semi_joshsBombina: {
    title:
      "Josh's Frogs care sheet, fire-bellied toad: 70–75 °F day, ≥ 60 °F night, humidity 50–80 %, 10–15 gal for 2–3, 50/50 land/water, 7–15 yr",
    url: 'https://joshsfrogs.com/cms/fire-bellied-toad-care-sheet',
  },
  amphibians_semi_hymenochirusWiki: {
    title:
      'Wikipedia, Hymenochirus: 2.5–3.8 cm, a few grams, ≈ 5 yr average (some > 20), lungs only, eggs laid at the surface',
    url: 'https://en.wikipedia.org/wiki/Hymenochirus',
  },
  amphibians_semi_fishkeeperAdf: {
    title:
      'Fishkeeper (UK), African dwarf frog: 22–25 °C, pH 7.0–7.8, ≤ 5 cm, hatching 2–5 days, metamorphosis 6–8 weeks, adults eat eggs',
    url: 'https://www.fishkeeper.co.uk/fish/freshwater/miscellaneous/african-dwarf-frog',
  },
  amphibians_semi_rutgersXenopus: {
    title:
      'Rutgers RUAC SOP 5.08, Xenopus husbandry: X. laevis 17–24 °C, pH 6.5–8.5, NH3 < 0.02 mg/L, NO2 < 0.5 mg/L, ≥ 2 L per adult',
    url: 'https://research.rutgers.edu/system/files/2025-09/aquatics-sop-5-08-zenopus-husbandry.pdf',
  },
  amphibians_semi_ceratophrysWiki: {
    title:
      'Wikipedia, Argentine horned frog: females 16.5 cm SVL, 6–7 yr wild / > 10 yr captive, ≈ 2,000 eggs, eats prey ≥ own size',
    url: 'https://en.wikipedia.org/wiki/Argentine_horned_frog',
  },
  amphibians_semi_dubiaPacman: {
    title:
      'Dubia Roaches, Pacman frog care sheet: 75–80 °F day, ≥ 65 °F night, > 85 °F lethal, humidity 60–80 %, cannibalistic',
    url: 'https://dubiaroaches.com/blogs/amphibian-care/pacman-frog-care-sheet',
  },
  amphibians_semi_ncBullfrog: {
    title:
      'NC Wildlife Resources Commission, American bullfrog profile: ≤ 12,000 eggs, ≤ 3 clutches per season, tadpoles 1–3 yr, adult size in 2–3 yr, 7–10 yr',
    url: 'https://ncwildlife.gov/education/american-bullfrog-species-profile/open',
  },
  amphibians_semi_caudataCynops: {
    title:
      'Caudata Culture, Cynops orientalis: 6–10.3 cm, keep 14–20 °C, avoid > 23 °C, maturity 1–3 yr, 10–236 eggs per female per season',
    url: 'https://www.caudata.org/cc/species/Cynops/C_orientalis.shtml',
  },
  amphibians_semi_caudataAxolotl: {
    title:
      'Caudata Culture, Ambystoma mexicanum: adults 14–22 °C, > 25 °C unsuitable, wild winter 6–7 °C, 20–28 cm, maturity 6–12+ months, 100–1,000+ eggs, cannibalistic',
    url: 'https://caudata.org/cc/species/Ambystoma/A_mexicanum.shtml',
  },
  amphibians_semi_vinAxolotl: {
    title: 'VIN, Water quality explained for axolotls: pH ≈ 6.5–8',
    url: 'https://www.vin.com/doc/?id=7259211',
  },
  amphibians_semi_geosesarmaWiki: {
    title:
      'Wikipedia, Geosesarma dennerle: terrestrial, 20–80 eggs carried ≈ 1 month, direct development, maturity ≈ 6 months',
    url: 'https://en.wikipedia.org/wiki/Geosesarma_dennerle',
  },
  amphibians_semi_aquariumBreederVampire: {
    title:
      'Aquarium Breeder, vampire crab guide: 24–28 °C, humidity ≥ 75 %, pH 7.0–8.5 tolerable, carapace 1.5–2.5 cm, 20–80 eggs, 1 male + 2 females per 20 L',
    url: 'https://aquariumbreeder.com/vampire-crab-detailed-guide-care-diet-and-breeding/',
  },
  amphibians_semi_perisesarmaWiki: {
    title: 'Wikipedia, Perisesarma bidens: carapace length ≤ 51 mm',
    url: 'https://en.wikipedia.org/wiki/Perisesarma_bidens',
  },
  amphibians_semi_ftaRedClaw: {
    title:
      'Fish Tank Advisor, red claw crab: 21–31 °C, pH 7.5–8.5, SG ≈ 1.005, 2–2.5 yr, 1 male + 2–3 females per 38 L, territorial',
    url: 'https://fishtankadvisor.com/red-claw-crab/',
  },
  amphibians_semi_pfkFiddler: {
    title:
      'Practical Fishkeeping, fiddler crabs: 60 × 30 × 30 cm for 3–4 pairs, land:water 2:1, water ≤ 5 cm, carapace 3–4 cm, marine zoea',
    url: 'https://www.practicalfishkeeping.co.uk/features/fiddler-crabs/',
  },
  amphibians_semi_fariaUca2017: {
    title:
      'Faria et al. 2017, Phylogenetic patterns and the adaptive evolution of osmoregulation in fiddler crabs, PLoS ONE 12:e0171870',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5300755/',
  },
  amphibians_semi_seriouslyFishMudskipper: {
    title:
      'Seriously Fish, Periophthalmus barbarus: 25–30 °C, pH 7.0–8.5, SG ≈ 1.005, 150 mm SL, 120 × 30 cm minimum, 60 × 30 cm territory per fish',
    url: 'https://www.seriouslyfish.com/species/periophthalmus-barbarus/',
  },
  amphibians_semi_tropicalTankMudskipper: {
    title: 'The Tropical Tank, African mudskipper profile (lifespan, size, enclosure)',
    url: 'https://thetropicaltank.co.uk/Fishindx/african-mudskipper.htm',
  },
  amphibians_semi_mudskipperAmmonia: {
    title:
      'Mudskipper ammonia tolerance: 96-h NH3 LC50 536 µM (Periophthalmodon schlosseri), 60.2 µM (Boleophthalmus boddaerti)',
    url: 'https://www.doi.org/10.1023/A:1007745003948',
  },
  amphibians_semi_adwTinctorius: {
    title: 'Animal Diversity Web, Dendrobates tinctorius: tadpoles metamorphose after 10–12 weeks',
    url: 'https://animaldiversity.org/accounts/Dendrobates_tinctorius/',
  },
  amphibians_semi_adwAuratus: {
    title:
      'Animal Diversity Web, Dendrobates auratus: tadpoles develop for an additional six weeks',
    url: 'https://animaldiversity.org/accounts/Dendrobates_auratus/',
  },
  amphibians_semi_wcsFrogBlog: {
    title:
      'WCS Frog Blog, Becoming a frog: red-eyed tree frog tadpoles take three weeks to a few months',
    url: 'https://blog.wcs.org/photo/?p=1506',
  },
  amphibians_semi_adwBombina: {
    title: 'Animal Diversity Web, Bombina orientalis: metamorphosis begins after 10–14 weeks',
    url: 'https://animaldiversity.org/accounts/Bombina_orientalis/',
  },
  amphibians_semi_pipidaeHymenochirus: {
    title: 'pipidae.org, African dwarf clawed frogs: metamorphosis in 26–36 days',
    url: 'https://www.pipidae.org/?p=1283',
  },
  amphibians_semi_kossXenopus: {
    title:
      'Koss & Wakeford, Rearing Xenopus laevis life history stages (ABLE vol. 22): metamorphic competence ≈ 4 weeks at 20 °C; 2–3 months in the literature',
    url: 'https://www.ableweb.org/biologylabs/wp-content/uploads/volumes/vol-22/mini.4.koss.pdf',
  },
  amphibians_semi_fabrezi2020: {
    title:
      'Fabrezi & Cruz 2020, Diet and gut morphology in ceratophryid tadpoles (BMC Dev. Biol.): Ceratophrys cranwelli larval development takes 3 weeks',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7388516',
  },
  amphibians_semi_gisdBullfrog: {
    title:
      'IUCN GISD, Lithobates catesbeianus: larval period from a few months (south) to three years (north)',
    url: 'https://www.iucngisd.org/gisd/pdf.php?sc=80',
  },
  amphibians_semi_caudataCynopsLarva: {
    title:
      'Caudata.org, C. cyanurus / C. orientalis differences (quoting Yang & Shen 1993, Zool. Res. 14:215): larvae metamorphose 50–80 d after hatching',
    url: 'https://www.caudata.org/threads/c-cyanurus-c-orientalis-differences.7652/post-56007',
  },
  amphibians_semi_adwNotophthalmus: {
    title: 'Animal Diversity Web, Notophthalmus viridescens: larval stage lasts 2–5 months',
    url: 'https://animaldiversity.org/accounts/Notophthalmus_viridescens',
  },
} as const satisfies Record<string, Source>;
