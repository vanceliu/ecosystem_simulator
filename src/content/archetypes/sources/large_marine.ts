import type { Source } from '../../sources';

/** Sources for the large_marine archetype group; keys are prefixed 'large_marine_'. */
export const LARGE_MARINE_SOURCES = {
  large_marine_pantherGrouper: {
    title: 'Animal-World: Panther grouper (Cromileptes altivelis) care, size and lifespan',
    url: 'https://Animal-World.com/panther-grouper',
  },
  large_marine_liveaquariaPantherGrouper: {
    title: 'LiveAquaria: Panther grouper, 72–78 °F, pH 8.1–8.4, sg 1.021–1.023, 300 gal minimum',
    url: 'https://www.liveaquaria.com/products/panther-grouper',
  },
  large_marine_caberoy2000: {
    title:
      'Caberoy & Quinitio 2000, Na⁺/K⁺-ATPase and gill chloride cells of Epinephelus coioides larvae and juveniles vs salinity (8–40 ppt) and temperature, Fish Physiol. Biochem. 23:83',
    url: 'https://repository.seafdec.org.ph/handle/10862/1862',
  },
  large_marine_zheng2012: {
    title:
      'Zheng 2012, Acute toxicity of ammonia and nitrite to Epinephelus coioides fry (25 °C, 30–31 ppt, pH 8), Marine Sciences 36(5):81',
    url: 'https://opaj.napstic.cn/periodicalArticle/0120121000798519',
  },
  large_marine_gardner2015: {
    title:
      'Gardner et al. 2015, Reproductive biology of invasive lionfish (Pterois spp.), Front. Mar. Sci. 2:7',
    url: 'https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2015.00007/pdf',
  },
  large_marine_kimball2004: {
    title:
      'Kimball et al. 2004, Thermal tolerance of lionfish: chronic lethal minimum 10 °C, feeding stops 16 °C, MEPS 283:269',
    url: 'https://int-res.com/abstracts/meps/v283/p269-278',
  },
  large_marine_jud2015: {
    title:
      'Jud et al. 2015, Broad salinity tolerance in invasive lionfish: 28 days at 7 ppt without effect, Environ. Biol. Fish. 98:135',
    url: 'https://hero.epa.gov/hero/index.cfm/reference/details/reference_id/7874983',
  },
  large_marine_biotaTang: {
    title: 'Reefs.com: Biota captive-bred yellow tang (Zebrasoma flavescens)',
    url: 'https://reefs.com/fish/biota-captive-bred-yellow-tang/',
  },
  large_marine_fishbaseClownTrigger: {
    title:
      'FishBase: Balistoides conspicillum, max 50 cm TL, feeds on urchins, crabs, molluscs, tunicates',
    url: 'https://fishbase.se/summary/2300',
  },
  large_marine_liveaquariaClownTrigger: {
    title: 'LiveAquaria: Clown triggerfish, 72–78 °F, pH 8.1–8.4, sg 1.020–1.025, 300 gal minimum',
    url: 'https://www.liveaquaria.com/products/clown-triggerfish',
  },
  large_marine_liveaquariaSnowflakeEel: {
    title: 'LiveAquaria: Snowflake eel, 72–78 °F, pH 8.1–8.4, sg 1.020–1.025, 50 gal minimum',
    url: 'https://www.liveaquaria.com/products/snowflake-eel',
  },
  large_marine_frdcBambooShark: {
    title:
      'FRDC 2023 shark report card: Chiloscyllium punctatum, max 132 cm TL, maturity 82–87 cm, longevity ≥ 16 years',
    url: 'https://fish.gov.au/docs/SharkReport/2023_FRDC_Chiloscyllium_punctatum_final.pdf',
  },
  large_marine_harahush2007: {
    title:
      'Harahush et al. 2007, Captive breeding and embryonic development of Chiloscyllium punctatum, J. Fish Biol. 71:1007',
    url: 'https://doi.org/10.1111/j.1095-8649.2007.01573.x',
  },
  large_marine_chapman2011: {
    title:
      'Chapman & Renshaw, Hematological responses of Chiloscyllium punctatum and Hemiscyllium ocellatum to anoxia and re-oxygenation, J. Exp. Zool. A 311A:422',
  },
  large_marine_ribbontailRay: {
    title: 'Microcosm Aquarium Explorer: Bluespotted ribbontail ray (Taeniura lymma)',
    url: 'https://en.microcosmaquariumexplorer.com/wiki/Bluespotted_Ribbontail_Ray',
  },
  large_marine_dohenySpinyLobster: {
    title:
      'Doheny State Beach: The Great Spiny One (Panulirus interruptus), ≤ 75 years, maturity 5–7 years, ≤ 1 million eggs, larvae ≈ 6 months',
    url: 'https://www.dohenystatebeach.org/wp-content/uploads/2013/05/The-Great-Spiny-One.pdf',
  },
  large_marine_tonmoOctopus: {
    title: 'TONMO: octopus husbandry and life cycle (lifespan, eggs, brooding)',
    url: 'https://tonmo.com/articles/comments/28/',
  },
  large_marine_domingues2010: {
    title:
      'Domingues et al. 2010, Culture densities of Octopus vulgaris: 20 ± 2 °C, 36 ± 1 ppt, O₂ > 75%, pH 7.9–8.1, Aquacult. Int. 18:165',
    url: 'https://doi.org/10.1007/s10499-008-9233-3',
  },
  large_marine_laptikhovsky2003: {
    title:
      'Laptikhovsky et al. 2003, Fecundity of the common cuttlefish Sepia officinalis, Sci. Mar. 67:279',
    url: 'https://scimar.icm.csic.es/index.php/secId/6/IdArt/3089/',
  },
  large_marine_domingues2001: {
    title:
      'Domingues et al. 2001, Growth of young Sepia officinalis at the upper end of the temperature range (25–30 °C, 37 ± 3 ppt), Aquac. Res. 32:923',
    url: 'https://sapientia.ualg.pt/entities/publication/0b5e79b0-7d56-4239-8092-87159d518d8a/full',
  },
  large_marine_liveaquariaChocolateChipStar: {
    title:
      'LiveAquaria: Chocolate chip sea star, ≤ 38 cm, 72–78 °F, pH 8.1–8.4, sg 1.023–1.025, eats sessile invertebrates',
    url: 'https://www.liveaquaria.com/products/chocolate-chip-sea-star',
  },
} as const satisfies Record<string, Source>;
