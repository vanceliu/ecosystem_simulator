import type { Source } from './sources';

/** Sources for consumer physiology, body composition and producer kinetics; keys are prefixed 'physiology_'. */
export const PHYSIOLOGY_SOURCES = {
  physiology_white2006: {
    title:
      'White, Phillips & Seymour 2006, The scaling and temperature dependence of vertebrate metabolism (Biol. Lett.): SMR at 20 °C, fish 0.091 M^0.879, amphibians 0.081 M^0.884, reptiles 0.110 M^0.768 mL O2/h (M in g wet)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1617203',
  },
  physiology_makarieva2008: {
    title:
      'Makarieva et al. 2008, Mean mass-specific metabolic rates are strikingly similar across life’s major domains (PNAS): aquatic invertebrates 1.3 W/kg, protozoa 7.5 W/kg wet at 25 °C',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2572558',
  },
  physiology_andrieux2020: {
    title:
      'Andrieux et al. 2020, Body stoichiometry of heterotrophs (bioRxiv): wet-to-dry fish 0.235, amphibians 0.2046, reptiles 0.268; heterotroph N 8.2–11%, P 0.7–2.1%',
    url: 'https://www.biorxiv.org/content/10.1101/2020.04.08.027656.full.pdf',
  },
  physiology_nonaka2021: {
    title:
      'Nonaka & Kuparinen 2021, A modified niche model for stage-structured food webs (Ecol. Evol.), Table 1b: maximum ingestion 8 × metabolism for invertebrates, 4 for fish; assimilation 0.45 autotroph, 0.75 invertebrate, 0.95 fish prey',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8093700/',
  },
  physiology_bioenergetic: {
    title:
      'BioEnergeticFoodWebs.jl consumption docs (Yodzis & Innes 1992): assimilation 0.45 herbivores, 0.85 carnivores',
    url: 'https://docs.juliahub.com/General/BioEnergeticFoodWebs/stable/man/consumption/',
  },
  physiology_amonHerndl1991: {
    title:
      'Amon & Herndl 1991, Deposit feeding and sediment I (P.S.Z.N. Mar. Ecol.): bacteria absorbed at 71% by holothurians',
    url: 'https://ucrisportal.univie.ac.at/en/publications/deposit-feeding-and-sediment-i-interrelationship-between-holothur/',
  },
  physiology_woodBalloniscus2012: {
    title:
      'Wood et al. 2012, Feeding rates of Balloniscus sellowii (ZooKeys): digestibility ≈ 20% for decomposed leaves',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3335417',
  },
  physiology_bird2012: {
    title:
      'Bird 2012, Importance of the aquatic detritus food web (Proc. CNS): Gammarus assimilates 11% of leaf material',
    url: 'https://proceedings.cns-snc.ca/index.php/pcns/article/view/6699',
  },
  physiology_sheppard2023: {
    title:
      'Sheppard et al. 2023, Seaweed biogeochemistry: global C:N and C:P (J. Phycol.): phytoplankton C:N 7.1, C:P 200 mol (Martiny 2014)',
    url: 'https://par.nsf.gov/servlets/purl/10468202',
  },
  physiology_usgsYakima: {
    title:
      'USGS SIR 2009-5078 Table 7, Lower Yakima River macrophytes: 2.61–3.52% N, 0.42–0.45% P of dry mass',
    url: 'https://pubs.usgs.gov/sir/2009/5078/table7.html',
  },
  physiology_tian2017: {
    title:
      'Tian et al. 2017, Global leaf nitrogen and phosphorus stoichiometry (Natl Sci Rev): leaf N 18.9, P 1.2 mg/g',
    url: 'https://sonar.ch/global/documents/204152',
  },
  physiology_zhangElser2017: {
    title:
      'Zhang & Elser 2017, C:N:P stoichiometry in fungi: a meta-analysis: median 3.70% N, 0.53% P',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5508194/',
  },
  physiology_hessenLyche1991: {
    title:
      'Hessen & Lyche 1991, Inter- and intraspecific variations in zooplankton element composition (Arch. Hydrobiol.): ≈ 9–10% N, ≈ 1% P',
    url: 'https://www.schweizerbart.de//papers/archiv_hydrobiologie/detail/121/101345/Inter_and_intraspecific_variations_in_zooplankton_element_composition',
  },
  physiology_hendrixson2007: {
    title:
      'Hendrixson, Sterner & Kay 2007, Elemental stoichiometry of freshwater fishes (J. Fish Biol.): N ≈ 9–12%, P < 2 to > 4%',
    url: 'https://www.waterboards.ca.gov/waterrights/water_issues/programs/bay_delta/docs/cmnt081712/sldmwa/hendrixsonetal2006.pdf',
  },
  physiology_vertebrateStoichiometry2022: {
    title:
      'Life stage and taxonomy determine vertebrate stoichiometry: a meta-analysis (Ecol. Evol. 2022): amphibians 1.74% P, reptiles 3.08% P, non-fish vertebrate N 10.51%',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9526032/',
  },
  physiology_mulderHendriks2013: {
    title:
      'Mulder & Hendriks 2013, Half-saturation constants in functional responses (arXiv:1305.5533): arthropods on algae 2.7, rotifers 5.2, fish 1.7 mg wet/L; lizards 200 kg/km²',
    url: 'https://arxiv.org/pdf/1305.5533',
  },
  physiology_bowie1985: {
    title:
      'Bowie et al. 1985, Rates, constants, and kinetics formulations in surface water quality modeling (EPA/600/3-85/040), Tables 6-5, 6-10, 6-18',
    url: 'https://www.literature.wolkersdorfer.info/literature/Rates%20Constants%20and%20Kinetics%20Formulations%20In%20Surface%20Water%20Quality%20Modeling.pdf',
  },
  physiology_affan2007: {
    title:
      'Affan et al. 2007, Growth characteristics of the benthic diatom Navicula incerta: µmax 0.81–1.04 d⁻¹ at 20 °C',
    url: 'https://sciwatch.kiost.ac.kr/handle/2020.kiost/4660?mode=full',
  },
  physiology_auerCanale1982: {
    title:
      'Auer & Canale 1982, Cladophora in Lake Huron III: maximum gross specific growth 1.08 d⁻¹',
    url: 'https://digitalcommons.mtu.edu/michigantech-p/7570',
  },
  physiology_madsen1995: {
    title:
      'Madsen & Baattrup-Pedersen 1995, Growth of Elodea canadensis vs inorganic N (J. Ecol.): RGR up to 0.045 d⁻¹',
    url: 'https://doi.org/10.2307/2390570',
  },
  physiology_browse1979: {
    title:
      'Browse, Dromgoole & Brown 1979, Photosynthesis in Egeria densa III: apparent Km 77 µM free CO2',
    url: 'https://doi.org/10.1071/pp9790499',
  },
  physiology_tsutsui2015: {
    title:
      'Tsutsui et al. 2015, High tolerance of Chaetomorpha sp. to salinity and temperature: ≈ 60% growth per day at 30 °C',
    url: 'https://doi.org/10.1007/s40071-014-0092-4',
  },
  physiology_ale2011: {
    title:
      'Ale, Mikkelsen & Meyer 2011, Growth of Ulva lactuca on ammonium and nitrate: 16.4% per day',
    url: 'https://orbit.dtu.dk/en/publications/differential-growth-response-of-ulva-lactuca-to-ammonium-and-nitr/',
  },
  physiology_carneiro2011: {
    title:
      'Carneiro et al. 2011, Nutrient uptake kinetics of Gracilaria cervicornis: NH4⁺ Km 41.6 µM, PO4 Ks 5 µM',
    url: 'https://scielo.br/j/rbfar/a/PYg5vZCvcNbfrDgKKpTL7Zr/?lang=en',
  },
  physiology_brito2025: {
    title:
      'Brito et al. 2025, Increasing leaf sizes of Epipremnum aureum: RGR 0.011–0.021 d⁻¹ in a greenhouse',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11974542/',
  },
  physiology_eucalyptusNh4: {
    title:
      'Ammonium and nitrate uptake by Eucalyptus nitens (thesis 1996): whole-root NH4⁺ Km 15 µM',
    url: 'https://doi.org/10.25959/23231681',
  },
  physiology_pepperPhosphate: {
    title: 'Kinetics of P uptake through roots of habanero pepper (Agriculture 2022): Km 25.9 µM',
    url: 'https://doi.org/10.3390/agriculture12091389',
  },
  physiology_schmidtZotz2002: {
    title:
      'Schmidt & Zotz 2002, Inherently slow growth in two Caribbean epiphytes (J. Veg. Sci.): in-situ RGR 3.3 × 10⁻³ d⁻¹, ≈ 10-fold in the greenhouse',
    url: 'https://doi.org/10.1111/j.1654-1103.2002.tb02079.x',
  },
  physiology_tremblay2013: {
    title:
      'Tremblay et al. 2013, Photosynthate translocation in Stylophora pistillata (Biogeosciences 10:3997): gross 101 µg C cm⁻² d⁻¹, 60% translocated at 25 °C',
    url: 'https://bg.copernicus.org/articles/10/3997/2013/',
  },
  physiology_nitschke2018: {
    title:
      'Nitschke et al. 2018, Photochemical traits as diagnostics of coral thermal tolerance (Front. Mar. Sci.): saturating irradiance Ek 228–534 µmol m⁻² s⁻¹',
    url: 'https://www.frontiersin.org/articles/10.3389/fmars.2018.00045/pdf',
  },
  physiology_williamsMartinez2004: {
    title:
      'Williams & Martinez 2004, Stabilization of chaotic and non-permanent food-web dynamics (Eur. Phys. J. B 38:297): Hill exponent 1.2 in the functional response',
    url: 'https://doi.org/10.1140/epjb/e2004-00122-1',
  },
  physiology_barrAquasoil: {
    title:
      'Barr Report 5(1), ADA Aqua Soil and Power Sand analysis: new Aqua Soil 263 mg/kg KCl-exchangeable NH4-N, Olsen-P 111 mg/kg; wetland clay 15.7 / 18.7; sandy pond 8.0 / 5.2 mg/kg',
    url: 'https://barrreport.com/barr-report-resources/old-newsletters/ADA-Aqua-Soil-Power-Soil-Analysis-Barr-Report.pdf',
  },
  physiology_barko1988: {
    title:
      'Barko et al. 1988, Interactions between macrophyte growth and sediment nutrient availability (TR A-88-2): porewater holds < 15% of the exchangeable pool; unplanted losses 24% N, 26% P in 84 d',
    url: 'https://apcrp.el.erdc.dren.mil/elpubs/pdf/tra88-2.pdf',
  },
  physiology_carignan1982: {
    title:
      'Carignan 1982, An empirical model to estimate the relative importance of roots in phosphorus uptake by aquatic macrophytes (CJFAS 39:243): P% = 99.8 / (1 + 2.66 (s/w)^−0.83)',
    url: 'https://api.crossref.org/works/10.1139/f82-034',
  },
  physiology_christiansen2016: {
    title:
      'Christiansen, Andersen & Jensen 2016, Phosphate uptake kinetics for four submerged freshwater macrophytes (Aquat. Bot. 128:58): root Km 0.85–8.82 µmol/L',
    url: 'https://findresearcher.sdu.dk/ws/files/128914716/Phosphate_uptake_kinetics_for_four_species_of_submerged_freshwater.pdf',
  },
  physiology_aqionDiffusion: {
    title: 'aqion, Table of diffusion coefficients (PHREEQC): NH4+ 1.98, H2PO4− 0.846 × 10⁻⁹ m²/s',
    url: 'https://www.aqion.de/sd/77?page=5',
  },
  physiology_aquasabiTropica: {
    title: 'Aquasabi, Tropica Aquarium Soil 9 l: 9.00 kg per 9 L bag',
    url: 'https://www.aquasabi.de/Tropica-Aquarium-Soil-9-l_1',
  },
  physiology_park2007: {
    title:
      'Park & Noguera 2007, Characterization of two ammonia-oxidizing bacteria isolated from low-DO reactors: strain ML1 K_O 0.24 mg/L',
    url: 'https://pure.korea.ac.kr/en/publications/characterization-of-two-ammonia-oxidizing-bacteria-isolated-from-/',
  },
  physiology_kits2017: {
    title:
      'Kits et al. 2017, Kinetic analysis of a complete nitrifier reveals an oligotrophic lifestyle (Nature): N. inopinata K(NH4+) 0.84 µM',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5600814',
  },
  physiology_norris2021: {
    title:
      'Norris et al. 2021, Mechanistic model of nutrient uptake explains dichotomy between oligotrophic and copiotrophic bacteria',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8168909',
  },
  physiology_evans2017: {
    title:
      'Evans et al. 2017, Variability in organic carbon reactivity across lake residence time and trophic gradients: humic DOM half-life months to years',
    url: 'https://nora.nerc.ac.uk/id/eprint/518436/1/N518436PP.pdf',
  },
  physiology_li2017: {
    title:
      'Li, Wang & Huang 2017, Aerobic denitrifiers: characteristics and recent research: Paracoccus at ≈ 5.6 mg/L DO denitrifies at 50% of the anoxic rate',
    url: 'https://download.atlantis-press.com/article/25877672.pdf',
  },
  physiology_songe2016: {
    title:
      'Songe et al. 2016, Saprolegnia diclina and S. parasitica infection strategies on Atlantic salmon eggs',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4973706/',
  },
  physiology_wagner2015: {
    title:
      'Wagner et al. 2015, Light availability affects stream biofilm community composition and function: NPP:R ≈ 2',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4950016',
  },
  physiology_baines2010: {
    title:
      'Baines et al. 2010, Regional differences in silicification of marine diatoms: silicification varies 6–10×',
    url: 'https://www.us-ocb.org/wp-content/uploads/sites/43/2020/05/Baines_et_al_GBC_2010_176407.pdf',
  },
  physiology_nielsenBorum2008: {
    title:
      'Nielsen & Borum 2008, Why Stratiotes aloides mainly grows in CO2-supersaturated waters: HCO3− users reach 34% of maximum at air-equilibrium CO2; emersed leaves 3–5× submersed photosynthesis',
    url: 'https://researchprofiles.ku.dk/da/publications/why-the-free-floating-macrophyte-emstratiotes-aloidesem-mainly-gr/',
  },
  physiology_rohrlack1999: {
    title:
      'Rohrlack et al. 1999, Role of microcystins in poisoning and food ingestion inhibition of Daphnia galeata: wild-type Microcystis cut ingestion by 75%',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC91088',
  },
  physiology_wang2018: {
    title:
      'Wang et al. 2018, Euglena gracilis growth under different trophic conditions: dark heterotrophic 0.70 vs phototrophic 0.90 d⁻¹',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5896972',
  },
  physiology_hatt2019: {
    title:
      'Hatt & Collado-Vides 2019, Organic and inorganic carbon content of Halimeda and Penicillus: inorganic:organic 80:20',
    url: 'https://par.nsf.gov/servlets/purl/10122358',
  },
  physiology_jonesBerkelmans2010: {
    title:
      'Jones & Berkelmans 2010, Potential costs of acclimatization to a warmer climate: type D symbionts raise tolerance 1.0–1.5 °C',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2862701',
  },
  physiology_cantin2009: {
    title:
      'Cantin et al. 2009, Juvenile corals acquire more carbon from high-performance symbionts: photosynthate to host doubled with C1 vs D',
    url: 'https://researchonline.jcu.edu.au/4850/',
  },
  physiology_karakashian1975: {
    title:
      'Karakashian 1975, Symbiosis in Paramecium bursaria (NIES record): symbiotic cells grow and survive better when bacteria are scarce',
    url: 'https://www.nies.go.jp/chiiki1/protoz/refere/id999/277.htm',
  },
  physiology_proctor2007: {
    title:
      'Proctor, Ligrone & Duckett 2007, Desiccation tolerance in the moss Polytrichum formosum: drying under 14 d barely affects survival',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2802982',
  },
  physiology_zhang2020: {
    title:
      'Zhang et al. 2020, Photosynthetic performance of Liriope muscari under poplar forests: light saturation 364–493 vs poplar 800–1300 µmol m⁻² s⁻¹',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7191787',
  },
  physiology_monteiro2009: {
    title:
      'Monteiro, Zotz & Körner 2009, Tropical epiphytes in a CO2-rich world: C3 species grew 60% faster than CAM',
    url: 'https://edoc.unibas.ch/8761/',
  },
  physiology_griffithsSmith1983: {
    title:
      'Griffiths & Smith 1983, Photosynthetic pathways in the Bromeliaceae of Trinidad: atmospheric CAM species in drier areas',
    url: 'https://link.springer.com/article/10.1007/BF00379519',
  },
  physiology_osono2018: {
    title:
      'Osono et al. 2018, Litter quality control of decomposition by the white-rot fungus Trametes versicolor: 0.9–59.8% mass loss',
    url: 'https://www.jstage.jst.go.jp/article/jfsc/129/0/129_644/_article/-char/ja',
  },
  physiology_nicholson2000: {
    title:
      'Nicholson et al. 2000, Resistance of Bacillus endospores to extreme environments: 75% of spores survive extreme desiccation',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC99004',
  },
} as const satisfies Record<string, Source>;
