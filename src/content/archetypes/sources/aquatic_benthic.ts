import type { Source } from '../../sources';

/** Sources for the aquatic_benthic archetype group; keys are prefixed 'aquatic_benthic_'. */
export const AQUATIC_BENTHIC_SOURCES = {
  aquatic_benthic_snailEkologia: {
    title: 'Ekológia 2017 (docs/09 §12 snail): freshwater pulmonate snail life history and density',
    url: 'https://reference-global.com/article/10.1515/eko-2017-0006',
  },
  aquatic_benthic_snailSedici: {
    title: 'SEDICI, Univ. Nac. de La Plata (docs/09 §12 snail): snail life history',
    url: 'https://sedici.unlp.edu.ar/handle/10915/176866',
  },
  aquatic_benthic_snailActaSci: {
    title: 'Acta Scientiarum Biol. Sci. (docs/09 §12 snail): snail longevity and reproduction',
    url: 'https://periodicos.uem.br/ojs/index.php/ActaSciBiolSci/article/view/45720',
  },
  aquatic_benthic_snailPlanorbella: {
    title: 'Wikipedia: Planorbella (ramshorn snail lifespan ≈ 2 yr, maturity ≈ 15 weeks)',
    url: 'https://en.wikipedia.org/wiki/Planorbella',
  },
  aquatic_benthic_snailNassarius: {
    title: 'Top Shelf Aquatics: Nassarius snails (aquarium lifespan up to ≈ 6 yr)',
    url: 'https://topshelfaquatics.com/products/nassarius-snails',
  },
  aquatic_benthic_snailAmmonia: {
    title:
      'Alonso & Camargo 2009, Long-term effects of ammonia on the snail Potamopyrgus antipodarum, Arch. Environ. Contam. Toxicol. 56:796 (no mortality ≤ 0.13 mg NH3-N/L)',
    url: 'https://doi.org/10.1007/s00244-008-9266-7',
  },
  aquatic_benthic_shrimpNeocaridina: {
    title: 'Wikipedia: Neocaridina davidi (3–4 cm, lifespan 1–2 yr, 20–30 eggs per clutch)',
    url: 'https://en.wikipedia.org/wiki/Neocaridina_davidi',
  },
  aquatic_benthic_shrimpBiodiversitas: {
    title: 'Biodiversitas (docs/09 §12 shrimp): freshwater shrimp reproduction and density',
    url: 'https://mail.smujo.id/biodiv/article/view/4975',
  },
  aquatic_benthic_shrimpPalaemonetes: {
    title: 'SeaLifeBase: Palaemonetes pugio (daggerblade grass shrimp)',
    url: 'https://sealifebase.org/summary/Palaemonetes-pugio',
  },
  aquatic_benthic_shrimpBreeders: {
    title: 'Breeders Registry: marine cleaner shrimp husbandry, lifespan and fecundity',
    url: 'https://breedersregistry.org/?p=596',
  },
  aquatic_benthic_shrimpAmmonia: {
    title:
      'Lin & Chen 2001, Acute toxicity of ammonia on Litopenaeus vannamei juveniles at different salinities, J. Exp. Mar. Biol. Ecol. 259:109 (safe 0.12–0.16 mg NH3-N/L)',
    url: 'https://scholars.ntou.edu.tw/handle/123456789/23275',
  },
  aquatic_benthic_shrimpNitrite: {
    title:
      'Lin & Chen 2003, Acute toxicity of nitrite on Litopenaeus vannamei juveniles at different salinities, Aquaculture 224:193 (safe 6.1/15.2/25.7 mg NO2-N/L at 15/25/35 ppt)',
    url: 'https://scholars.ntou.edu.tw/handle/123456789/23293',
  },
  aquatic_benthic_bivalveMdc: {
    title: 'Missouri Dept. of Conservation: fingernail clams (Sphaeriidae)',
    url: 'https://mdc.mo.gov/discover-nature/field-guide/fingernail-clams',
  },
  aquatic_benthic_bivalveDayton: {
    title: 'Univ. of Dayton eCommons (docs/09 §12 bivalve): Corbicula life history',
    url: 'https://ecommons.udayton.edu/bio_fac_pub/307',
  },
  aquatic_benthic_bivalveJConch: {
    title: 'Journal of Conchology 40(5) 2011 (docs/09 §12 bivalve): Corbicula fluminea population',
    url: 'https://conchsoc.org/sites/default/files/jconch/40/5/2011-40505.pdf',
  },
  aquatic_benthic_bivalveKonstanz: {
    title: 'Univ. Konstanz (docs/09 §12 bivalve): Corbicula fluminea density in Lake Constance',
    url: 'https://kops.uni-konstanz.de/entities/publication/15c8ceb4-f3b1-4710-865b-f6de0c3f81ef',
  },
  aquatic_benthic_bivalveAmmonia: {
    title:
      'Cherry et al. 2005, Potential effects of Asian clam die-offs on native freshwater mussels, J. N. Am. Benthol. Soc. 24:369 (adult Corbicula 96-h LC50 0.80 mg NH3-N/L)',
    url: 'https://bioone.org/journals/Freshwater-Science/volume-24/issue-2/04-073.1/Potential-effects-of-Asian-clam-Corbicula-fluminea-die-offs-on/10.1899/04-073.1.full',
  },
  aquatic_benthic_urchinJstage: {
    title: 'Plankton Benthos Res. 18(4) (J-STAGE): sea urchin growth and longevity',
    url: 'https://www.jstage.jst.go.jp/article/pbr/18/4/18_B180401/_article',
  },
  aquatic_benthic_urchinReeflex: {
    title: 'Reeflex: Mespilia globulus husbandry',
    url: 'https://en.reeflex.net/tiere/726_Mespilia_globulus.htm',
  },
  aquatic_benthic_urchinLiveAquaria: {
    title: 'LiveAquaria: tuxedo urchin (minimum tank size 75 L class)',
    url: 'https://www.liveaquaria.com/products/tuxedo-urchin',
  },
  aquatic_benthic_urchinThermal: {
    title:
      'Lytechinus variegatus lives close to the upper thermal limit for early development (adult LT50 34.8 °C), PMC4983579',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4983579/',
  },
  aquatic_benthic_brittleMarlin: {
    title: 'MarLIN: brittle star biology (lifespan, maturity)',
    url: 'https://marlin.ac.uk/biotic/browse.php?sp=6029',
  },
  aquatic_benthic_brittleUwFhl: {
    title: 'UW Friday Harbor Labs: ophiuroid reproduction and brooding',
    url: 'https://depts.washington.edu/fhl/zoo432/argyle/Reproduction.htm',
  },
  aquatic_benthic_brittleOphiactis: {
    title: 'Wikipedia: Ophiactis savignyi (fissiparous brittle star, disc 3–5.5 mm)',
    url: 'https://en.wikipedia.org/wiki/Ophiactis_savignyi',
  },
  aquatic_benthic_spongeMarlin: {
    title: 'MarLIN: sponge-dominated habitat biology (colony longevity, reproduction)',
    url: 'https://marlin.ac.uk/habitats/detail/1203',
  },
  aquatic_benthic_spongeOldest: {
    title: 'Mental Floss: enormous sea sponge may be the oldest animal on Earth',
    url: 'https://mentalfloss.com/article/80671/enormous-sea-sponge-may-be-oldest-animal-earth',
  },
  aquatic_benthic_tunicateMarlin: {
    title: 'MarLIN: solitary ascidian biology (lifespan, maturity, fecundity)',
    url: 'https://marlin.ac.uk/species/detail/1369',
  },
  aquatic_benthic_tunicateSciRep: {
    title: 'Sci. Rep. 2023 (docs/09 §12 tunicate): colonial ascidian life cycle',
    url: 'https://link.springer.com/article/10.1038/s41598-023-36923-6',
  },
  aquatic_benthic_tunicatePnas: {
    title: 'PNAS (PMC48905): Botryllus colony zooid turnover and post-reproductive senescence',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC48905',
  },
  aquatic_benthic_coralHal: {
    title: 'HAL Sorbonne (docs/09 §12 coral): coral polyp lifespan (median ≈ 4 yr, max 12 yr)',
    url: 'https://hal.sorbonne-universite.fr/hal-02927645',
  },
  aquatic_benthic_coralGuinness: {
    title: 'Guinness World Records: oldest colonial organism',
    url: 'https://www.guinnessworldrecords.com/world-records/635833-oldest-colonial-organism',
  },
  aquatic_benthic_coralLaRochelle: {
    title: 'Aquarium La Rochelle: elkhorn coral (budding, fragmentation, maturity)',
    url: 'https://www.aquarium-larochelle.com/en/species-encyclopedia/elkhorn-coral/',
  },
  aquatic_benthic_coralLimits: {
    title:
      'Guan et al. 2015, Suitable environmental ranges for potential coral reef habitats, PLoS ONE (weekly SST 15.7–35.5 °C, monthly SSS 25.4–41.1 psu)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4452591/',
  },
  aquatic_benthic_reefAmmonia: {
    title:
      'NOAA NCCOS program review: ammonia toxicity to corals and sea urchins (A. formosa EC50 0.095 mg/L UAN; L. variegatus LOEC 0.149 mg/L UAN; chronic 0.035 mg/L UAN)',
    url: 'https://cdn.coastalscience.noaa.gov/sdi-f-and-ecp-program-review/19_KSB_5_Ammonia_Corals_Urchins_Woodley.pdf',
  },
  aquatic_benthic_odonateBds: {
    title: 'British Dragonfly Society: Odonata life cycle and biology',
    url: 'https://british-dragonflies.org.uk/odonata/life-cycle-and-biology/',
  },
  aquatic_benthic_odonateSciRep: {
    title: 'Sci. Rep. 2021 (docs/09 §12 odonate_nymph): larval development and molts',
    url: 'https://link.springer.com/10.1038/s41598-021-84639-2',
  },
  aquatic_benthic_odonateAmmonia: {
    title:
      'Odonatologica 2002: ammonia toxicity to larvae of Erythromma najas, Lestes sponsa and Sympetrum flaveolum (high tolerance)',
    url: 'https://natuurtijdschriften.nl/pub/592405',
  },
  aquatic_benthic_predInsectDytiscus: {
    title: 'New Forest National Park Authority: great diving beetle',
    url: 'https://www.newforestnpa.gov.uk/discover/wildlife/beetles/great-diving-beetle',
  },
  aquatic_benthic_predInsectNepa: {
    title: 'Aquatic Bugs: Nepa cinerea (water scorpion) life history',
    url: 'https://aquaticbugs.com/nepa-cinerea/',
  },
  aquatic_benthic_predInsectBelostoma: {
    title: 'Eastern Illinois Univ. thesis 2788: Belostoma life history and paternal egg brooding',
    url: 'https://thekeep.eiu.edu/theses/2788',
  },
  aquatic_benthic_insectToxicity: {
    title:
      'Willingham et al., Toxicity of ammonia and nitrite to aquatic macroinvertebrates, Intermountain J. Sci. 22(4) (96-h LC50 1.8–5.0 mg NH3/L; 0.25–2.4 mg NO2-N/L)',
    url: 'https://arc.lib.montana.edu/ojs/index.php/IJS/article/view/786',
  },
  aquatic_benthic_crayfishRedSwamp: {
    title: 'Northeast Invasives: red swamp crayfish (Procambarus clarkii)',
    url: 'https://neinvasives.com/aquatic-invasive-animals/red-swamp-crayfish/',
  },
  aquatic_benthic_crayfishRedclaw: {
    title: 'arXiv 1210.3970: Cherax quadricarinatus (redclaw) life history',
    url: 'https://arxiv.org/pdf/1210.3970',
  },
  aquatic_benthic_crayfishDwarfAmazonas: {
    title:
      'Amazonas Magazine 2013: a Mexican crayfish for nano aquariums (Cambarellus patzcuarensis)',
    url: 'https://www.amazonasmagazine.com/2013/03/15/a-mexican-crayfish-for-nano-aquariums/',
  },
  aquatic_benthic_crayfishDwarfGarnelio: {
    title: 'Garnelio: Cambarellus patzcuarensis "Orange" husbandry (one pair per 30 L)',
    url: 'https://www.garnelio.de/en/oranger-zwergkrebs-oranger-zwergflusskrebs-cpo',
  },
  aquatic_benthic_crayfishThermal: {
    title:
      'Buckle Ramírez et al. 1996, Thermoregulatory behavior applied to the culture of Procambarus clarkii, Rev. Biol. Trop. 44(1) (culture range 16.9–28.5 °C)',
    url: 'https://tropicalstudies.org/rbt/attachments/volumes/vol44-1/12_Buckle_Procambarus_clarkii.pdf',
  },
  aquatic_benthic_mantisSeaLifeBase: {
    title: 'SeaLifeBase 91825: stomatopod life history',
    url: 'https://sealifebase.org/summary/91825',
  },
  aquatic_benthic_mantisAdw: {
    title: 'Animal Diversity Web: Gonodactylus smithii',
    url: 'https://animaldiversity.org/accounts/Gonodactylus_smithii',
  },
  aquatic_benthic_hypoxiaThresholds: {
    title:
      'Vaquer-Sunyer & Duarte 2008, Thresholds of hypoxia for marine biodiversity, PNAS 105:15452 (mean LC50 mg O2/L: crustaceans 2.45, bivalves 1.42, gastropods 0.89, echinoderms 1.22, cnidarians 0.69)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2556360',
  },
  aquatic_benthic_weightConversion: {
    title:
      'Ricciardi & Bourget 1998, Weight-to-weight conversion factors for marine benthic macroinvertebrates, MEPS 163:245 (mean %: Decapoda DW/WW 26.2; Prosobranchia SFDW/WW 10.6; Bivalvia SFDW/WW 8.7; Ophiuroidea AFDW/WW 7.4; Echinoidea AFDW/WW 3.5; Demospongiae DW/WW 16.8; Ascidiacea DW/WW 6.3; Actiniaria AFDW/WW 14.3)',
    url: 'https://www.vliz.be/imisdocs/publications/ocrd/55005.pdf',
  },
} as const satisfies Record<string, Source>;
