import type { Source } from '../../sources';

/** Sources for the reptiles_small_fish archetype group; keys are prefixed 'reptiles_small_fish_'. */
export const REPTILES_SMALL_FISH_SOURCES = {
  reptiles_small_fish_reptifilesAnole: {
    title:
      'ReptiFiles, Green anole care sheet: humidity 60–70%, basking 32 °C, night 18–24 °C, UVB required',
    url: 'https://reptifiles.com/green-anole-care-sheet',
  },
  reptiles_small_fish_lafeberWaterDragon: {
    title: 'Lafeber Vet, Basic information for Chinese or green water dragons',
    url: 'https://lafeber.com/vet/basic-information-for-chinese-or-green-water-dragons/',
  },
  reptiles_small_fish_reptifilesWaterDragon: {
    title:
      'ReptiFiles, Chinese water dragon care sheet: humidity 60–80%, basking 32–35 °C, cool side 24–27 °C',
    url: 'https://reptifiles.com/chinese-water-dragon-care-sheet/',
  },
  reptiles_small_fish_herpJWaterMonitor: {
    title:
      'Herpetological Journal 5(1) 1995: Sexual maturation in Varanus salvator, with notes on growth and reproductive effort',
    url: 'https://www.thebhs.org/publications/the-herpetological-journal/volume-5-number-1-january-1995/1388-03-sexual-maturation-in-varanus-salvator-laurenti-1768-with-notes-on-growth-and-reproductive-effort',
  },
  reptiles_small_fish_reptilesMagWaterMonitor: {
    title:
      'Reptiles Magazine, Asian water monitor: ambient 28–32 °C, basking 35–36 °C, night 21–24 °C',
    url: 'https://reptilesmagazine.com/listings/lizard-galleries/asian-water-monitor/',
  },
  reptiles_small_fish_reptilesMagWaterMonitorCare: {
    title:
      "Reptiles Magazine, Asian water monitor breeding and care tips: adult enclosure 8' × 6' × 8'",
    url: 'https://reptilesmagazine.com/asian-water-monitor-breeding-and-care-tips/',
  },
  reptiles_small_fish_reptifilesGarter: {
    title:
      'ReptiFiles, Garter snake care sheet: 48" × 24" × 24" enclosure, basking 29–32 °C, cool 23–27 °C, humidity 35–60%',
    url: 'https://reptifiles.com/garter-snake-care-sheet',
  },
  reptiles_small_fish_adwNerodiaClarkii: {
    title: 'Animal Diversity Web, Nerodia clarkii: salt marsh snake of brackish estuaries',
    url: 'https://animaldiversity.org/accounts/Nerodia_clarkii/',
  },
  reptiles_small_fish_wikiChildrensPython: {
    title:
      "Wikipedia, Children's python (Antaresia childreni): 1–1.5 m, captive > 30 years, clutch up to 25",
    url: 'https://en.wikipedia.org/wiki/Children%27s_python',
  },
  reptiles_small_fish_vetAntaresia: {
    title: 'Unusual Pet Vets, Antaresia care sheet: basking 33–38 °C, cool end 16–20 °C',
    url: 'https://www.unusualpetvets.com.au/wp-content/uploads/2018/05/Antaresia-Stimsons-Childrens-Spotted-and-Pygmy-Python-Care-Sheet.pdf',
  },
  reptiles_small_fish_cosewicMusk: {
    title: 'COSEWIC assessment and status report: Stinkpot (Sternotherus odoratus), biology',
    url: 'https://www.canada.ca/en/environment-climate-change/services/species-risk-public-registry/cosewic-assessments-status-reports/stinkpot/chapter-6.html',
  },
  reptiles_small_fish_gensouMusk: {
    title: 'Gensou, Musk turtle care guide: carapace 8–13 cm, basking 30–32 °C, 90 L per adult',
    url: 'https://gensou.sg/musk-turtle-care-guide-aquarium/',
  },
  reptiles_small_fish_lafeberSlider: {
    title: 'Lafeber Vet, Basic information on the red-eared slider',
    url: 'https://lafeber.com/vet/basic-information-red-eared-slider/',
  },
  reptiles_small_fish_phoenixHerpSlider: {
    title:
      'Phoenix Herpetological Society, Red-eared slider care guide: adult water 23–24 °C, basking 29–35 °C',
    url: 'https://www.phoenixherp.com/assistance/reptile-care-guides/red-eared-slider-care-guide.html',
  },
  reptiles_small_fish_peerjSliderSalinity: {
    title:
      'Hong et al. 2019, PeerJ 7:e6538: red-eared slider liver transcriptome after 30 days at 0, 5 and 15 psu',
    url: 'https://peerj.com/articles/6538',
  },
  reptiles_small_fish_mdcSoftshell: {
    title: 'Missouri Department of Conservation, Northern spiny softshell field guide',
    url: 'https://mdc.mo.gov/discover-nature/field-guide/northern-spiny-softshell',
  },
  reptiles_small_fish_softshellThermal: {
    title:
      'Journal of Thermal Biology: juvenile Apalone spinifera select 34 °C in a 14–34 °C gradient (UNI ScholarWorks)',
    url: 'https://scholarworks.uni.edu/facpub/257',
  },
  reptiles_small_fish_aqsciAmmonia: {
    title: 'AquariumScience.org, Safe ammonia levels: free NH3 somewhat toxic above 0.05 mg/L',
    url: 'https://aquariumscience.org/index.php/5-2-safe-ammonia-levels',
  },
  reptiles_small_fish_aqsciNitrite: {
    title:
      'AquariumScience.org, Nitrite in depth: long-term limit for tropical fish 0.5–2 mg/L NO2 at pH 7',
    url: 'https://aquariumscience.org/index.php/5-3-2-nitrite-in-more-depth',
  },
  reptiles_small_fish_epaDo1986: {
    title:
      'US EPA 1986, Ambient water quality criteria for dissolved oxygen (freshwater): 1-day minimum 3 mg/L for non-early life stages',
    url: 'https://www.ezview.wa.gov/Portals/_1962/Documents/SSRSAG/EPA%201986%20Freshwater%20DO%20Recommendations.pdf',
  },
  reptiles_small_fish_froese2006: {
    title:
      'Froese 2006, Cube law, condition factor and weight–length relationships, J. Appl. Ichthyol. 22:241 (W = a·L³, a ≈ 0.01 g/cm³)',
    url: 'https://doi.org/10.1111/j.1439-0426.2006.00805.x',
  },
  reptiles_small_fish_fishbaseGuppy: {
    title:
      'FishBase, Poecilia reticulata: 18–28 °C, pH 7–8, brackish-tolerant, 20–40 young every ~4 weeks',
    url: 'https://fishbase.se/summary/3228',
  },
  reptiles_small_fish_elifeKillifish: {
    title:
      'Reichwald et al., eLife 2019;8:e41548: Nothobranchius furzeri matures in 2 weeks; GRZ strain dead by 10 weeks',
    url: 'https://elifesciences.org/articles/41548',
  },
  reptiles_small_fish_wikiHarlequinRasbora: {
    title:
      'Wikipedia, Harlequin rasbora: 4–4.5 cm SL, lifespan 5–8 years, pH 6.0–7.8, 80–100 eggs per spawning',
    url: 'https://en.wikipedia.org/wiki/Harlequin_rasbora',
  },
  reptiles_small_fish_otocinclusBrazJBiol: {
    title:
      'Braz. J. Biol.: Otocinclus vittatus reproduction, L50 18.7–20.1 mm SL, fecundity 16–202 oocytes',
    url: 'https://scielo.br/j/bjb/a/WDVzqdswS7gdNHBZ8HvjTrQ',
  },
  reptiles_small_fish_fishbaseSalarias: {
    title: 'FishBase, Salarias fasciatus: 14 cm TL, marine/brackish herbivorous algae scraper',
    url: 'https://www.fishbase.se/summary/6058',
  },
  reptiles_small_fish_fishbaseCorydoras: {
    title:
      'FishBase, Corydoras (Hoplisoma) paleatum: 6.6–7.1 cm SL, 18–23 °C, pH 6.0–8.0, ~100 eggs',
    url: 'https://www.fishbase.se/summary/10926',
  },
  reptiles_small_fish_wikiKuhliLoach: {
    title: 'Wikipedia, Kuhli loach: ~10 years typical, up to 14 years, 24–30 °C, pH 5.5–7.0',
    url: 'https://en.wikipedia.org/wiki/Kuhli_loach',
  },
  reptiles_small_fish_amazonasGoby: {
    title:
      "Amazonas Magazine, Zhou's vermilion goby (Rhinogobius zhoui): 46–62 eggs every ~4 weeks",
    url: 'https://amazonasmagazine.com/2012/12/13/zhous-vermilion-goby',
  },
  reptiles_small_fish_fishbaseRhinogobius: {
    title: 'FishBase, Rhinogobius giurinus: amphidromous freshwater–brackish–marine goby',
    url: 'https://www.fishbase.se/summary/15825',
  },
  reptiles_small_fish_fishbasePterois: {
    title: 'FishBase, Pterois volitans: 22–28 °C, maximum reported age 10 years',
    url: 'https://www.fishbase.se/summary/5195',
  },
  reptiles_small_fish_liveaquariaDwarfLionfish: {
    title:
      'LiveAquaria, Dwarf zebra lionfish: 7", 50 gal minimum, 22–26 °C, pH 8.1–8.4, sg 1.020–1.025',
    url: 'https://www.liveaquaria.com/products/dwarf-zebra-lionfish',
  },
  reptiles_small_fish_seriouslyFishCrenicichla: {
    title:
      'Seriously Fish, Crenicichla (Wallaciia) compressiceps: 76 mm SL, 24–27 °C, pH 5.0–6.8, 25–50 eggs, 90 cm / 154 L',
    url: 'https://seriouslyfish.com/species/crenicichla-compressiceps',
  },
} as const satisfies Record<string, Source>;
