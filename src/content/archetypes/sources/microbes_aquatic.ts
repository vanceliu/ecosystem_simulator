import type { Source } from '../../sources';

/** Sources for the microbes_aquatic archetype group; keys are prefixed 'microbes_aquatic_'. */
export const MICROBES_AQUATIC_SOURCES = {
  microbes_aquatic_nitrosomonasWiki: {
    title: 'Nitrosomonas (Wikipedia): growth 20–30 °C, pH 6.0–9.0, cells 0.7–1.5 × 1.0–2.3 µm',
    url: 'https://en.wikipedia.org/wiki/Nitrosomonas',
  },
  microbes_aquatic_satoNitrosomonas: {
    title:
      'Sato et al. 1985, Test medium for the growth of Nitrosomonas europaea, Appl. Environ. Microbiol. 49:1101 (generation time 5.5 h)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC238513',
  },
  microbes_aquatic_bagchiBiofilter: {
    title:
      'Bagchi et al. 2014, Ammonia-oxidizing archaea and bacteria in aquarium biofilters, PLoS One 9:e113515 (18.5–28.1 °C, pH 6.0–8.0)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4257543',
  },
  microbes_aquatic_anthonisen1976: {
    title:
      'Anthonisen et al. 1976, Inhibition of nitrification by ammonia and nitrous acid, J. Water Pollut. Control Fed. 48:835 (free NH3 inhibits NOB 0.1–1.0, AOB 10–150 mg/L)',
  },
  microbes_aquatic_hahnkeParacoccus: {
    title:
      'Hahnke et al. 2014, Improved medium for anaerobic growth of Paracoccus denitrificans, Front. Microbiol. 5:18 (4.4 h anoxic generation, growth 11–40 °C)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3907716',
  },
  microbes_aquatic_denitrifierSediment: {
    title: 'Denitrifying bacteria counts in sediment, ≈ 10⁴ cells/g wet weight (Springer)',
    url: 'https://link.springer.com/article/10.1007/BF02759473',
  },
  microbes_aquatic_saprolegniaWiki: {
    title: 'Saprolegnia (Wikipedia): growth 3–33 °C; freshwater and brackish water',
    url: 'https://en.wikipedia.org/wiki/Saprolegnia',
  },
  microbes_aquatic_thoenSaprolegnia: {
    title:
      'Thoen et al. 2016, Saprolegnia spore numbers in Norwegian salmon hatcheries, J. Fish Dis. 39:657 (inlet 50–3,200 /L, effluent > 5,000 /L)',
    url: 'https://agris.fao.org/search/en/records/65df91a00f3e94b9e5d9f115',
  },
  microbes_aquatic_saprolegniaLakes: {
    title:
      'Hydrobiologia: aquatic oomycete spores in lakes 6–73 /L; hyphal growth peak 48 h, sporulation ≤ 28 d',
    url: 'https://doi.org/10.1007/BF00031875',
  },
  microbes_aquatic_juhnaBiofilm: {
    title:
      'Juhna et al. 2007, Appl. Environ. Microbiol. 73:7456, drinking-water pipe biofilm coupons: total bacteria 1.6 × 10⁵–10⁸ cells/cm²',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2168204/table/t2',
  },
  microbes_aquatic_shenandoahMats: {
    title:
      'Chesapeake Community Modeling Program 2024 Session 20: Shenandoah River benthic cyanobacterial mats, chlorophyll a 43–1,422 mg/m²',
    url: 'https://ccmp2024.chesapeake.org/wp-content/uploads/2024/04/Session-20-Abstracts.pdf',
  },
  microbes_aquatic_cyanoGrowth: {
    title: 'Arch. Microbiol.: cyanobacterial doubling time 13 h minimum to 3.2 d',
    url: 'https://link.springer.com/article/10.1007/BF00408860',
  },
  microbes_aquatic_cyanoAme: {
    title: 'Aquat. Microb. Ecol. 32:175: benthic cyanobacterial chlorophyll a 25–350 mg/m²',
    url: 'https://int-res.com/abstracts/ame/v32/n2/p175-184',
  },
  microbes_aquatic_microcystisLight: {
    title:
      'Microb. Ecol. 71:802 (2016): Planktothrix agardhii and Microcystis aeruginosa grow at 10 µmol photons m⁻² s⁻¹; P. agardhii tolerates 500',
    url: 'https://pure.knaw.nl/portal/en/publications/assessment-of-the-effects-of-light-availability-on-growth-and-com/',
  },
  microbes_aquatic_thalassiosira: {
    title:
      'J. Plankton Res. 21:1101 (1999), Thalassiosira curviseriata: 1.93 div/d, Ik 32–36, maximum growth 70–80, inhibition 150 µmol m⁻² s⁻¹; 5–20 °C; 25–40 ppt',
    url: 'https://academic.oup.com/plankt/article-abstract/21/6/1101/1479176',
  },
  microbes_aquatic_diatomBiofilm: {
    title:
      'Philippine J. Sci.: periphytic diatoms in early marine biofilms, 6.5 × 10³–4.6 × 10⁵ cells/cm²',
    url: 'https://philjournalsci.dost.gov.ph/community-structure-of-periphytic-diatoms-in-early-stage-marine-biofilms-in-a-mariculture-impacted-area',
  },
  microbes_aquatic_diatomHydrobiologia: {
    title: 'Hydrobiologia: diatom division rates and long generation times (2.5–17 d)',
    url: 'https://link.springer.com/doi/10.1007/s10750-008-9513-y',
  },
  microbes_aquatic_cladophoraOntario: {
    title:
      'Great Lakes Center 2019, Lake Ontario Cladophora final report: chlorophyll a and dry biomass per m²',
    url: 'https://greatlakescenter.buffalostate.edu/sites/glc/files/documents/FinalReport-LakeOntarioCladophora2019.pdf',
  },
  microbes_aquatic_cladophoraLight: {
    title:
      'University of Cape Town: Cladophora glomerata light saturation 126–148 µmol photons m⁻² s⁻¹, maximum at 25 °C',
    url: 'https://open.uct.ac.za/bitstreams/b515dafc-2c06-41bd-81d0-1856509dc7e6/download',
  },
  microbes_aquatic_cladophoraTropical: {
    title:
      'Braz. J. Biol.: photoacclimation of tropical Cladophora glomerata to 65 and 300 µmol m⁻² s⁻¹ (higher Pmax and Ik in high light)',
    url: 'https://scielo.br/j/bjb/a/yxY85sCyCdN9cN8CZ57cdVJ/?lang=en',
  },
  microbes_aquatic_cladophoraTemperature: {
    title: 'Yahagi River study: Cladophora photosynthesis optimum ≈ 25 °C, high rates 10–30 °C',
    url: 'https://www.yahagigawa.jp/archives/004/201509/4eea3356f26041f3043de0018153dbd0.pdf',
  },
  microbes_aquatic_chlorellaGrowth: {
    title:
      'Rosenberg et al. 2014, PLoS One 9:e92460, Chlorella doubling times 9–72 h (heterotrophic/autotrophic)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3974682/table/pone-0092460-t001',
  },
  microbes_aquatic_chlorellaLight: {
    title:
      'ChemEngineering 10:80: light and temperature model for Chlorella vulgaris (optimum ≈ 150 µmol m⁻² s⁻¹, Topt 25 °C)',
    url: 'https://www.citedrive.com/en/discovery/modeling-of-light-intensity-and-temperature-effects-on-algae-growth-in-batch-and-continuous-bioreactors/',
  },
  microbes_aquatic_phytoplanktonBloom: {
    title: 'LSU Environmental Sciences: phytoplankton bloom densities 10⁵–10⁶ cells/mL',
    url: 'https://repository.lsu.edu/enviro_sciences_pubs/275',
  },
  microbes_aquatic_tavechioEgeria: {
    title:
      'Tavechio & Thomaz 2003, Effects of light on growth and photosynthesis of Egeria najas, Braz. Arch. Biol. Technol. (growth Km 18, compensation 6–22 µmol m⁻² s⁻¹, 25 °C)',
    url: 'https://scielo.br/j/babt/a/fm3qwf7LcxswVn44PrRcJ6p/?lang=en',
  },
  microbes_aquatic_carrilloEgeria: {
    title:
      'Carrillo et al. 2006, Biomass distribution, growth and decay of Egeria densa, Aquat. Bot. 85:7 (mean 522 g/m²)',
    url: 'https://researchers.westernsydney.edu.au/en/publications/biomass-distribution-growth-and-decay-of-egeria-densa-in-a-tropic/',
  },
  microbes_aquatic_nascimentoEgeria: {
    title:
      'Nascimento et al. 2008, Egeria densa biomass in Paulo Afonso reservoirs, Planta Daninha 26:3 (0.10–0.41 g dry per shoot per 15 d)',
    url: 'https://scielo.br/j/pd/a/yh6kHDxDcm6VkjJwY9hgfDP/abstract/?lang=en',
  },
  microbes_aquatic_tsutsuiChaetomorpha: {
    title:
      'Tsutsui et al. 2015, Int. Aquat. Res.: euryhaline Chaetomorpha in Thailand, field 3.4–90 ppt and 20.1–40.9 °C, ≈ 60 %/d growth at 20–30 ppt',
    url: 'https://link.springer.com/article/10.1007/s40071-014-0092-4',
  },
  microbes_aquatic_caulerpaSertularioides: {
    title:
      'Hidrobiológica: effect of salinity on Caulerpa sertularioides, RGR 4.82 %/d at 25 ppt, deterioration at 15 ppt',
    url: 'https://hidrobiologica.izt.uam.mx/index.php/revHidro/article/view/504',
  },
  microbes_aquatic_liaoCaulerpa: {
    title:
      'Liao & Cheng 1990, Salinity tolerance of Caulerpa lentillifera (15–50 ppt, optimum 25–35 ppt), Second Asian Fisheries Forum',
    url: 'https://scholars.ntou.edu.tw/handle/123456789/13622',
  },
  microbes_aquatic_caulerpaLight: {
    title:
      'J. Integr. Plant Biol. 51:147 (2009): Caulerpa serrulata light saturation 200 µmol photons m⁻² s⁻¹, optimum 25–30 °C',
    url: 'https://www.jipb.net/CN/Y2009/V51/I2/147',
  },
  microbes_aquatic_invemarCaulerpa: {
    title: 'Bol. Invest. Mar. Cost. (INVEMAR): Caulerpa growth 1.7–4.8 %/d',
    url: 'https://boletin.invemar.org.co/ojs/index.php/boletin/article/download/36/35/141',
  },
  microbes_aquatic_symbiodiniumDensity: {
    title: 'BioNumbers 114525: Symbiodinium density ≈ 10⁶ cells/cm² coral tissue',
    url: 'https://bionumbers.hms.harvard.edu/bionumber.aspx?id=114525',
  },
  microbes_aquatic_symbiodiniumDoubling: {
    title: 'BioNumbers 114526: Symbiodinium in-host doubling time 7 d (3–74 d)',
    url: 'https://bionumbers.hms.harvard.edu/bionumber.aspx?id=114526',
  },
  microbes_aquatic_mieogSymbiodinium: {
    title:
      'Mieog et al. 2009, Quantification of Symbiodinium in coral tissue, Mol. Ecol. Resour. 9:74 (1.4 × 10⁶ cells/cm²; bleached S/H < 0.005)',
    url: 'https://researchportal.scu.edu.au/esploro/outputs/journalArticle/Quantification-of-algal-endosymbionts-Symbiodinium-in/991012820746302368',
  },
  microbes_aquatic_symbiodiniumWiki: {
    title:
      'Symbiodinium (Wikipedia): cells 6–13 µm, culture division every 1–3 d, Persian Gulf corals tolerate 35 °C',
    url: 'https://en.wikipedia.org/wiki/Symbiodinium',
  },
  microbes_aquatic_reefLighting: {
    title: 'Reefs.com: reef aquarium light intensity for zooxanthellate corals',
    url: 'https://reefs.com/tag/light-intensity/',
  },
  microbes_aquatic_krenekParamecium: {
    title:
      'Krenek et al. 2012, Thermal adaptation in Paramecium caudatum, PLoS One 7:e30598 (CTmin 3.0, CTmax 33.6–35.9 °C, μmax 2.2–2.8 d⁻¹)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3302864',
  },
  microbes_aquatic_takagiParamecium: {
    title:
      'Takagi et al., Relationship between immaturity period and lifespan in Paramecium, Jpn. J. Protozool. 41 (maturity 60, clonal lifespan 600 fissions)',
    url: 'https://www.protistology.jp/journal/jjp41/12TakagiE.pdf',
  },
  microbes_aquatic_parameciumWiki: {
    title:
      'Paramecium (Wikipedia): length 0.06–0.3 mm; P. tetraurelia clone expires after ≈ 200 fissions',
    url: 'https://en.wikipedia.org/wiki/Paramecium',
  },
  microbes_aquatic_ciliateLakes: {
    title: 'Zoociências: planktonic ciliate density in lakes 3–20 cells/mL',
    url: 'https://periodicos.ufjf.br/index.php/zoociencias/article/view/24632',
  },
  microbes_aquatic_ciliateBloom: {
    title: 'BioNumbers 114555: freshwater ciliates in warm summers up to 2,500 cells/mL',
    url: 'https://bionumbers.hms.harvard.edu/bionumber.aspx?id=114555',
  },
  microbes_aquatic_nufebHet: {
    title:
      'NUFEB documentation, fix nufeb/growth/het: biofilm heterotroph Ks 4 mg COD/L, µmax 6.9 × 10⁻⁵ s⁻¹',
    url: 'https://nufeb.readthedocs.io/en/master/fix_growth_het.html',
  },
  microbes_aquatic_henze1987Table: {
    title:
      'PUC-Rio thesis ch. 4, Tabela 6: ASM1 parameters at 20 °C (Henze 1987): µH 6.0 d⁻¹, KS 20 mg COD/L',
    url: 'https://www.maxwell.vrac.puc-rio.br/15510/15510_5.PDF',
  },
  microbes_aquatic_trinci1969: {
    title:
      'Trinci 1969, A kinetic study of the growth of Aspergillus nidulans and other fungi (J. Gen. Microbiol. 57:11): submerged µ 0.090 h⁻¹ at 20 °C',
    url: 'https://davidmoore.org.uk/cyberweb/images_2016/Manuscripts/Trinci-1969-j-gen-mic-57-11.pdf',
  },
  microbes_aquatic_weisse2024: {
    title:
      'Weisse et al. 2024, Numerical and thermal response of the bacterivorous ciliate Colpidium kleini: Colpidium striatum µ ≈ 3.0 d⁻¹ at 20 °C',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11219425/',
  },
  microbes_aquatic_taylor1977: {
    title:
      'Taylor 1977, Growth responses of ciliate protozoa to the abundance of their bacterial prey (Microb. Ecol. 4:207): half-saturation 5.5–42.9 × 10⁶ bacteria/mL',
    url: 'https://link.springer.com/article/10.1007/BF02015077',
  },
  microbes_aquatic_curdsCockburn1968: {
    title:
      'Curds & Cockburn 1968, Tetrahymena pyriformis growing on Klebsiella (J. Gen. Microbiol. 54:343): yield 50% dry/dry',
    url: 'https://www.nies.go.jp/chiiki1/protoz/refere/id999/985.htm',
  },
  microbes_aquatic_brussaard1998: {
    title:
      'Brussaard & Riegman 1998, Influence of bacteria on phytoplankton cell mortality (AME 14:271): diatom death 0.01 d⁻¹ at 13 °C in nutrient-limited chemostats',
    url: 'https://int-res.com/articles/ame/14/a014p271.pdf',
  },
} as const satisfies Record<string, Source>;
