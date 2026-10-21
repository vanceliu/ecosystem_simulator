import type { ArchetypeData, SourcedRange } from '../archetype';
import { derived, estimated, measured, type Sourced } from '../sourced';
import type { ArchetypeGroups } from './groupTypes';

const range = (min: Sourced, max: Sourced): SourcedRange => ({ min, max });

const CELL_GAME_CAP = estimated(30, 'docs/09 §3 cell game cap（估）');
const MONOD_FROM_IK = 'Ik (Pmax/α) equals the Monod half-saturation K_I';

const NITRIFIER_PH = range(measured(6.5, 'nitrifierPh'), estimated(9.5, 'alkaline limit'));
const NEUTRAL_PH = range(
  estimated(4.0, 'heterotrophic bacteria persist in acidic blackwater'),
  estimated(9.5, 'alkaline limit'),
);
const EURYHALINE_BACTERIA = range(
  estimated(0, 'freshwater strains'),
  estimated(40, 'marine strains; hypersaline lagoons excluded'),
);
const NITRIFIER_SALINITY = range(
  estimated(0, 'freshwater Nitrosomonas', 'microbes_aquatic_nitrosomonasWiki'),
  estimated(40, 'marine species N. marina and N. halophila', 'microbes_aquatic_nitrosomonasWiki'),
);
const NITRIFIER_TEMPERATURE = range(
  estimated(4, 'nitrification persists slowly in cold ponds', 'microbes_aquatic_nitrosomonasWiki'),
  estimated(40, 'activity collapses above 40 °C', 'microbes_aquatic_nitrosomonasWiki'),
);
const NITRIFIER_DENSITY = {
  typical: range(
    estimated(1e3, 'docs/09 §3 free-water nitrifiers 10³–10⁵ /mL（估）'),
    estimated(1e5, 'docs/09 §3 free-water nitrifiers 10³–10⁵ /mL（估）'),
  ),
  max: estimated(1e6, 'free-water ceiling; attached biomass limited by biofilm surface'),
  unit: 'cells_per_mL',
} as const;

/** docs/02, docs/09: aob, nob, heterotroph, denitrifier, water_mold, biofilm, diatom, green_algae, cyanobacteria, phytoplankton, aquatic_plant, macroalgae, zooxanthellae, ciliate */
export const MICROBES_AQUATIC: Readonly<
  Partial<Record<ArchetypeGroups['microbes_aquatic'], ArchetypeData>>
> = {
  aob: {
    kind: 'biomass',
    latinStem: 'Nitroso',
    nounZh: '亞硝化菌',
    trophicMode: 'chemoautotroph',
    flags: ['chemoautotroph'],
    morphologies: ['短桿狀', '球狀', '螺旋狀', '分葉狀', '微菌落', '鏈狀', '扁平附著', '囊包群體'],
    specialisedMetabolism: '耐低氧：氧半飽和常數 × 0.5，可於生物膜深層與低流速處運作',
    massMg: range(
      derived(
        2e-10,
        'microbes_aquatic_nitrosomonasWiki',
        'N. marina 0.7 × 1.7 µm rod ≈ 0.65 µm³ × E. coli 0.3 pg per µm³ (bionumbers)',
      ),
      derived(
        9e-10,
        'microbes_aquatic_nitrosomonasWiki',
        'N. eutropha 1.3 × 2.3 µm rod ≈ 3.0 µm³ × E. coli 0.3 pg per µm³ (bionumbers)',
      ),
    ),
    typicalLengthMm: measured(0.0017, 'microbes_aquatic_nitrosomonasWiki'),
    tolerance: {
      temperatureC: NITRIFIER_TEMPERATURE,
      salinityPpt: NITRIFIER_SALINITY,
      ph: NITRIFIER_PH,
      nh3MaxMgL: derived(
        123.5,
        'microbes_aquatic_anthonisen1976',
        'upper bound of AOB free-NH3 inhibition range 10–150 mg NH3/L × 14/17 → mg NH3-N/L',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(5, 'cell turnover under grazing in filters'),
        typLow: estimated(10, 'cell turnover in aquarium biofilm'),
        typHigh: derived(20, 'asm1', '1 / autotroph decay 0.05 d⁻¹'),
        max: estimated(30, 'equals docs/09 cell game cap'),
      },
      gameCapDays: CELL_GAME_CAP,
      maturityDays: range(
        measured(0.23, 'microbes_aquatic_satoNitrosomonas'),
        estimated(3, 'docs/09 §3 aquarium biofilm generation 1–3 d（估）'),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'cell_turnover',
      recruitment: 'normal',
    },
    density: NITRIFIER_DENSITY,
  },

  nob: {
    kind: 'biomass',
    latinStem: 'Nitrospir',
    nounZh: '硝化螺菌',
    trophicMode: 'chemoautotroph',
    flags: ['chemoautotroph'],
    morphologies: ['彎桿狀', '螺旋狀', '短桿狀', '球狀', '多形', '微菌落', '絲狀鏈', '扁平附著'],
    specialisedMetabolism: '完全硝化（comammox）：可直接將氨氧化為硝酸鹽',
    massMg: range(
      estimated(5e-11, 'thin curved Nitrospira rods, smaller than E. coli', 'bionumbers'),
      estimated(3e-10, 'large Nitrobacter cells ≈ E. coli dry mass', 'bionumbers'),
    ),
    typicalLengthMm: estimated(0.0015, 'Nitrospira curved rods 0.9–2.2 µm long'),
    tolerance: {
      temperatureC: NITRIFIER_TEMPERATURE,
      salinityPpt: NITRIFIER_SALINITY,
      ph: NITRIFIER_PH,
      nh3MaxMgL: derived(
        0.82,
        'microbes_aquatic_anthonisen1976',
        'upper bound of NOB free-NH3 inhibition range 0.1–1.0 mg NH3/L × 14/17 → mg NH3-N/L',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(5, 'cell turnover under grazing in filters'),
        typLow: estimated(10, 'cell turnover in aquarium biofilm'),
        typHigh: derived(20, 'asm1', '1 / autotroph decay 0.05 d⁻¹ applied to NOB'),
        max: estimated(30, 'equals docs/09 cell game cap'),
      },
      gameCapDays: CELL_GAME_CAP,
      maturityDays: range(
        estimated(0.54, 'docs/09 §3 fastest NOB generation 13 h', 'nitrospiraKinetics'),
        estimated(5, 'docs/09 §3 aquarium generation of several days（估）'),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'cell_turnover',
      recruitment: 'normal',
    },
    density: NITRIFIER_DENSITY,
  },

  heterotroph: {
    kind: 'biomass',
    latinStem: 'Pseudomon',
    nounZh: '異營菌',
    trophicMode: 'decomposer',
    flags: [],
    morphologies: ['球狀', '桿狀', '弧狀', '螺旋狀', '絲狀', '鏈狀', '柄狀', '菌膠團'],
    specialisedMetabolism: '寡營養型：可分解難分解有機物（腐植質、木質），於低 DOC 下維持成長',
    massMg: range(
      estimated(
        3e-11,
        'small oligotrophic bacterioplankton ≈ 0.1 of E. coli dry mass',
        'bionumbers',
      ),
      measured(3e-10, 'bionumbers'),
    ),
    typicalLengthMm: estimated(0.001, 'typical aquatic rod ≈ 1 µm'),
    tolerance: {
      temperatureC: range(
        estimated(0, 'psychrotolerant heterotrophs remain active near freezing'),
        estimated(45, 'mesophile upper limit'),
      ),
      salinityPpt: EURYHALINE_BACTERIA,
      ph: NEUTRAL_PH,
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(1, 'heavy protist grazing'),
        typLow: derived(3.3, 'asm1', '1 / heterotroph decay 0.3 d⁻¹'),
        typHigh: estimated(10, 'oligotrophic cells with low decay'),
        max: estimated(30, 'equals docs/09 cell game cap'),
      },
      gameCapDays: CELL_GAME_CAP,
      maturityDays: range(
        derived(0.17, 'asm1', 'ln 2 / μH 4.0 d⁻¹'),
        estimated(15, 'docs/09 §3 longest generation 15 d in oligotrophic water'),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'cell_turnover',
      recruitment: 'normal',
    },
    density: {
      typical: range(measured(6e5, 'lakeBacteria'), measured(2e6, 'lakeBacteria')),
      max: measured(1.4e7, 'rasBacteria'),
      unit: 'cells_per_mL',
    },
  },

  denitrifier: {
    kind: 'biomass',
    latinStem: 'Paracocc',
    nounZh: '脫氮菌',
    trophicMode: 'decomposer',
    flags: [],
    morphologies: ['球桿狀', '短桿狀', '長桿狀', '球狀', '弧狀', '鏈狀', '菌膠團', '多形'],
    specialisedMetabolism: '好氧脫氮：溶氧未耗盡時仍可將硝酸鹽還原為氮氣',
    massMg: range(
      estimated(1e-10, 'Paracoccus coccoid rods 0.5–0.9 µm', 'bionumbers'),
      estimated(4e-10, 'larger Pseudomonas-type denitrifiers', 'bionumbers'),
    ),
    typicalLengthMm: estimated(0.001, 'coccoid to short rods ≈ 1 µm'),
    tolerance: {
      temperatureC: range(
        measured(11, 'microbes_aquatic_hahnkeParacoccus'),
        measured(40, 'microbes_aquatic_hahnkeParacoccus'),
      ),
      salinityPpt: EURYHALINE_BACTERIA,
      ph: NEUTRAL_PH,
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(2, 'cell turnover in anoxic sediment'),
        typLow: derived(3.3, 'asm1', '1 / heterotroph decay 0.3 d⁻¹'),
        typHigh: estimated(15, 'slow turnover in deep substrate'),
        max: estimated(30, 'equals docs/09 cell game cap'),
      },
      gameCapDays: CELL_GAME_CAP,
      maturityDays: range(
        measured(0.18, 'microbes_aquatic_hahnkeParacoccus'),
        estimated(10, 'docs/09 §3 substrate generation 1–10 d（估）'),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'cell_turnover',
      recruitment: 'normal',
    },
    density: {
      typical: range(
        measured(1e4, 'microbes_aquatic_denitrifierSediment'),
        estimated(1e6, 'established sand bed'),
      ),
      max: estimated(1e9, 'docs/09 §3 mature deep sand bed（估）'),
      unit: 'cells_per_g_soil',
    },
  },

  water_mold: {
    kind: 'biomass',
    latinStem: 'Saproleg',
    nounZh: '水黴',
    trophicMode: 'decomposer',
    flags: [],
    morphologies: ['棉絮狀', '放射狀', '分枝絲狀', '稀疏絲狀', '叢生', '墊狀', '網狀', '毛球狀'],
    specialisedMetabolism: '寄生型：可侵染受傷或虛弱的魚體與魚卵',
    massMg: range(
      estimated(1e-4, 'single germling hypha'),
      estimated(1, 'cotton-wool tuft on driftwood or egg'),
    ),
    typicalLengthMm: estimated(5, 'visible hyphal tuft'),
    tolerance: {
      temperatureC: range(
        measured(3, 'microbes_aquatic_saprolegniaWiki'),
        measured(33, 'microbes_aquatic_saprolegniaWiki'),
      ),
      salinityPpt: range(
        estimated(0, 'freshwater genus', 'microbes_aquatic_saprolegniaWiki'),
        estimated(
          15,
          'docs/02: growth suppressed above 15 ppt',
          'microbes_aquatic_saprolegniaWiki',
        ),
      ),
      ph: range(
        estimated(4.5, 'occurs in soft acidic hatchery water'),
        estimated(9.0, 'alkaline limit'),
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(
          2,
          'hypha reaches maximal growth in 48 h',
          'microbes_aquatic_saprolegniaLakes',
        ),
        typLow: estimated(14, 'docs/02 new driftwood white film lasts 2–4 weeks'),
        typHigh: estimated(28, 'sporulation within 28 d', 'microbes_aquatic_saprolegniaLakes'),
        max: estimated(60, 'equals docs/09 hypha game cap'),
      },
      gameCapDays: estimated(60, 'docs/09 §3 hypha game cap（估）'),
      maturityDays: range(
        estimated(2, 'maximal hyphal growth at 48 h', 'microbes_aquatic_saprolegniaLakes'),
        estimated(28, 'sporulation within 28 d', 'microbes_aquatic_saprolegniaLakes'),
      ),
      reproduction: { mode: 'spores' },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: estimated(
        28,
        'hypha senesces after sporulation',
        'microbes_aquatic_saprolegniaLakes',
      ),
    },
    density: {
      typical: range(
        measured(6, 'microbes_aquatic_saprolegniaLakes'),
        measured(3200, 'microbes_aquatic_thoenSaprolegnia'),
      ),
      max: measured(5000, 'microbes_aquatic_thoenSaprolegnia'),
      unit: 'individuals_per_L',
    },
  },

  biofilm: {
    kind: 'biomass',
    latinStem: 'Zoogloe',
    nounZh: '菌膜',
    trophicMode: 'decomposer',
    flags: [],
    morphologies: ['薄膜', '黏層', '絲狀叢', '斑塊', '菌墊', '蓬鬆絮狀', '網狀', '光滑凝膠'],
    specialisedMetabolism: '光合型：含附著微藻，光照下自行固碳並產氧',
    massMg: range(
      estimated(1e-10, 'bacterial cell within EPS matrix', 'bionumbers'),
      estimated(1e-9, 'cell plus attached EPS', 'bionumbers'),
    ),
    typicalLengthMm: estimated(0.001, 'bacterial cell ≈ 1 µm'),
    tolerance: {
      temperatureC: range(
        estimated(0, 'biofilms persist on cold surfaces'),
        estimated(45, 'mesophile upper limit'),
      ),
      salinityPpt: EURYHALINE_BACTERIA,
      ph: range(estimated(4.0, 'acidic blackwater surfaces'), estimated(10.0, 'alkaline limit')),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(2, 'grazed surface layer'),
        typLow: estimated(7, 'cell turnover in mature biofilm'),
        typHigh: estimated(20, 'slow turnover in deep layers'),
        max: estimated(30, 'equals docs/09 cell game cap'),
      },
      gameCapDays: CELL_GAME_CAP,
      maturityDays: range(
        estimated(1, 'nutrient-rich surface colonisation'),
        derived(23, 'biofilmDensity', 'ln 2 / oligotrophic community growth 0.03 d⁻¹'),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'cell_turnover',
      recruitment: 'normal',
    },
    density: {
      typical: range(
        measured(1.6e5, 'microbes_aquatic_juhnaBiofilm'),
        measured(1e6, 'biofilmDensity'),
      ),
      max: measured(1e8, 'biofilmDensity'),
      unit: 'cells_per_cm2',
    },
  },

  diatom: {
    kind: 'biomass',
    latinStem: 'Navicul',
    nounZh: '矽藻',
    trophicMode: 'photoautotroph',
    flags: ['photosynthetic'],
    morphologies: ['舟形', '羽紋', '中心圓盤', '鏈狀', '星狀群體', '扇形', '柄狀附著', '管狀群體'],
    specialisedMetabolism: '低矽型：殼較薄，矽需求 × 0.5',
    light: {
      halfSaturation: derived(34, 'microbes_aquatic_thalassiosira', `Ik 32–36; ${MONOD_FROM_IK}`),
      optimum: measured(75, 'microbes_aquatic_thalassiosira'),
    },
    massMg: range(
      estimated(1e-8, 'small pennate diatom ≈ 50 µm³'),
      estimated(5e-6, 'large centric diatom ≈ 10⁴ µm³'),
    ),
    typicalLengthMm: estimated(0.02, 'benthic pennate diatoms 10–40 µm'),
    tolerance: {
      temperatureC: range(
        measured(5, 'microbes_aquatic_thalassiosira'),
        estimated(35, 'tropical benthic diatoms'),
      ),
      salinityPpt: range(
        estimated(0, 'freshwater diatom flora'),
        measured(40, 'microbes_aquatic_thalassiosira'),
      ),
      ph: range(estimated(5.5, 'acidophilic diatoms'), estimated(9.5, 'alkaline limit')),
    },
    lifeHistory: {
      lifespanDays: {
        min: derived(0.52, 'microbes_aquatic_thalassiosira', '1 / 1.93 divisions d⁻¹'),
        typLow: estimated(1, 'docs/09 §3 typical division 1 d'),
        typHigh: estimated(3, 'light-limited division interval'),
        max: estimated(17, 'longest division interval', 'microbes_aquatic_diatomHydrobiologia'),
      },
      gameCapDays: CELL_GAME_CAP,
      maturityDays: range(
        derived(0.52, 'microbes_aquatic_thalassiosira', '1 / 1.93 divisions d⁻¹'),
        estimated(
          17,
          'docs/09 §3 long generation 2.5–17 d',
          'microbes_aquatic_diatomHydrobiologia',
        ),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'clonal_aging',
      recruitment: 'normal',
      clonalMaxGenerations: range(
        estimated(300, 'docs/09 §3 cell shrinkage limit（估）'),
        estimated(1000, 'docs/09 §3 cell shrinkage limit（估）'),
      ),
    },
    density: {
      typical: range(
        measured(6.5e3, 'microbes_aquatic_diatomBiofilm'),
        estimated(5e4, 'established aquarium film'),
      ),
      max: measured(4.6e5, 'microbes_aquatic_diatomBiofilm'),
      unit: 'cells_per_cm2',
    },
  },

  green_algae: {
    kind: 'biomass',
    latinStem: 'Cladophor',
    nounZh: '綠藻',
    trophicMode: 'photoautotroph',
    flags: ['photosynthetic'],
    morphologies: [
      '單列絲狀',
      '分枝絲狀',
      '片狀',
      '管狀',
      '球狀群體',
      '網狀',
      '毛簇狀',
      '匍匐墊狀',
    ],
    specialisedMetabolism: '碳酸氫根利用：高 pH、低 CO₂ 下仍可光合',
    light: {
      halfSaturation: estimated(
        60,
        'about half the light-saturation point 126–148 µmol',
        'microbes_aquatic_cladophoraLight',
      ),
      optimum: estimated(
        300,
        'tropical Cladophora acclimates to 300 µmol with higher Pmax',
        'microbes_aquatic_cladophoraTropical',
      ),
    },
    massMg: range(
      estimated(1e-3, 'short young filament'),
      estimated(1, 'long branched filament tuft'),
    ),
    typicalLengthMm: estimated(20, 'hair-algae filament length'),
    tolerance: {
      temperatureC: range(
        estimated(2, 'temperate Cladophora overwinters', 'microbes_aquatic_cladophoraTemperature'),
        estimated(35, 'above high-rate range 10–30 °C', 'microbes_aquatic_cladophoraTemperature'),
      ),
      salinityPpt: range(
        estimated(0, 'freshwater Cladophora and Spirogyra'),
        estimated(40, 'marine Chaetomorpha and Ulva'),
      ),
      ph: range(
        estimated(6.0, 'acidic limit'),
        estimated(10.0, 'bicarbonate users tolerate high pH'),
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(7, 'grazed filament tips'),
        typLow: estimated(20, 'filament turnover'),
        typHigh: estimated(45, 'old basal filaments'),
        max: estimated(60, 'equals docs/09 filament game cap'),
      },
      gameCapDays: estimated(60, 'docs/09 §3 filament game cap（估）'),
      maturityDays: range(
        estimated(1, 'docs/09 §3 biomass doubling 1–4 d（估）'),
        estimated(4, 'docs/09 §3 biomass doubling 1–4 d（估）'),
      ),
      reproduction: { mode: 'fragmentation' },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: estimated(30, 'filament turnover within docs/09 60 d cap'),
    },
    density: {
      typical: range(
        estimated(10, 'sparse growth on hardscape'),
        measured(150, 'microbes_aquatic_cladophoraOntario'),
      ),
      max: measured(200, 'microbes_aquatic_cladophoraOntario'),
      unit: 'mg_chl_a_per_m2',
    },
  },

  cyanobacteria: {
    kind: 'biomass',
    latinStem: 'Oscillat',
    nounZh: '藍綠菌',
    trophicMode: 'photoautotroph',
    flags: ['photosynthetic', 'nitrogen_fixer'],
    morphologies: [
      '絲狀',
      '鞘絲狀',
      '球狀群體',
      '膠質團',
      '螺旋絲狀',
      '墊狀',
      '束狀',
      '單細胞球狀',
    ],
    specialisedMetabolism: '產毒型：分泌藍綠菌毒素，攝食者避食',
    light: {
      halfSaturation: estimated(
        20,
        'Planktothrix and Microcystis grow at 10 µmol',
        'microbes_aquatic_microcystisLight',
      ),
      optimum: estimated(
        250,
        'P. agardhii tolerates 500 µmol but its optimum is lower',
        'microbes_aquatic_microcystisLight',
      ),
    },
    massMg: range(
      estimated(5e-9, 'single 2–3 µm cell'),
      estimated(1e-7, 'single 8–10 µm trichome cell'),
    ),
    typicalLengthMm: estimated(0.5, 'Oscillatoria trichome length'),
    tolerance: {
      temperatureC: range(
        estimated(5, 'mat cyanobacteria persist in cold water'),
        estimated(45, 'thermotolerant Oscillatoriales'),
      ),
      salinityPpt: range(
        estimated(0, 'freshwater mat formers'),
        estimated(40, 'marine red slime cyanobacteria'),
      ),
      ph: range(estimated(6.0, 'acidic limit'), estimated(10.5, 'bloom pH')),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(1, 'cell turnover under grazing'),
        typLow: estimated(5, 'cell turnover in mats'),
        typHigh: estimated(15, 'sheathed trichomes in old mats'),
        max: estimated(30, 'equals docs/09 cell game cap'),
      },
      gameCapDays: CELL_GAME_CAP,
      maturityDays: range(
        measured(0.54, 'microbes_aquatic_cyanoGrowth'),
        measured(3.2, 'microbes_aquatic_cyanoGrowth'),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'cell_turnover',
      recruitment: 'normal',
    },
    density: {
      typical: range(
        measured(43, 'microbes_aquatic_shenandoahMats'),
        estimated(350, 'docs/09 §3 typical upper bound', 'microbes_aquatic_cyanoAme'),
      ),
      max: measured(1422, 'microbes_aquatic_shenandoahMats'),
      unit: 'mg_chl_a_per_m2',
    },
  },

  phytoplankton: {
    kind: 'biomass',
    latinStem: 'Chlorell',
    nounZh: '浮游藻',
    trophicMode: 'photoautotroph',
    flags: ['photosynthetic'],
    morphologies: ['球狀', '卵形', '新月形', '四聯體', '群體球', '鞭毛單細胞', '鏈狀', '紡錘形'],
    specialisedMetabolism: '混合營養：黑暗或低光下可吸收有機碳維持成長',
    light: {
      halfSaturation: estimated(
        40,
        'experimental best growth 60–80 µmol',
        'microbes_aquatic_chlorellaLight',
      ),
      optimum: measured(150, 'microbes_aquatic_chlorellaLight'),
    },
    massMg: range(
      estimated(1e-9, '2 µm Chlorella cell'),
      estimated(1.5e-7, '10 µm green flagellate'),
    ),
    typicalLengthMm: estimated(0.005, 'Chlorella 2–10 µm'),
    tolerance: {
      temperatureC: range(
        estimated(5, 'cold-water green water'),
        estimated(38, 'above Chlorella optimum 25–30 °C', 'microbes_aquatic_chlorellaLight'),
      ),
      salinityPpt: range(
        estimated(0, 'freshwater Chlorella'),
        estimated(40, 'marine Nannochloropsis and Tetraselmis'),
      ),
      ph: range(estimated(6.0, 'acidic limit'), estimated(10.5, 'bloom pH')),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(1, 'grazed by cladocerans and filter feeders'),
        typLow: estimated(3, 'cell turnover in green water'),
        typHigh: estimated(10, 'light-limited cells'),
        max: estimated(30, 'equals docs/09 cell game cap'),
      },
      gameCapDays: CELL_GAME_CAP,
      maturityDays: range(
        derived(0.38, 'microbes_aquatic_chlorellaGrowth', 'C. sorokiniana doubling 9 h'),
        estimated(7, 'docs/09 §3 long doubling 4–7 d'),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'cell_turnover',
      recruitment: 'normal',
    },
    density: {
      typical: range(
        estimated(1e3, 'docs/09 §3 clear water 10³–10⁴ /mL（估）'),
        estimated(1e4, 'docs/09 §3 clear water 10³–10⁴ /mL（估）'),
      ),
      max: estimated(1e6, 'bloom density 10⁵–10⁶ /mL', 'microbes_aquatic_phytoplanktonBloom'),
      unit: 'cells_per_mL',
    },
  },

  aquatic_plant: {
    kind: 'biomass',
    latinStem: 'Egeri',
    nounZh: '水草',
    trophicMode: 'photoautotroph',
    flags: ['photosynthetic'],
    morphologies: ['有莖', '蓮座', '匍匐', '浮葉', '苔狀', '帶狀葉', '羽狀葉', '細針葉'],
    specialisedMetabolism: '挺水型：葉伸出水面直接取得空氣中的 CO₂',
    light: {
      halfSaturation: measured(18, 'microbes_aquatic_tavechioEgeria'),
      optimum: estimated(
        400,
        'growth saturates near 50 µmol; no inhibition up to 124 µmol tested',
        'microbes_aquatic_tavechioEgeria',
      ),
    },
    massMg: range(
      estimated(20, 'young shoot or small rosette', 'microbes_aquatic_nascimentoEgeria'),
      estimated(2000, 'large stem shoot', 'microbes_aquatic_nascimentoEgeria'),
    ),
    typicalLengthMm: estimated(200, 'aquarium stem plant shoot'),
    tolerance: {
      temperatureC: range(
        estimated(4, 'temperate Elodea and Egeria overwinter'),
        estimated(32, 'tropical stem plants'),
      ),
      salinityPpt: range(
        estimated(0, 'freshwater plants'),
        estimated(10, 'docs/02: requires salinity < 10 ppt'),
      ),
      ph: range(estimated(5.0, 'softwater plants'), estimated(9.0, 'hardwater plants')),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(30, 'docs/09 §3 shoot 30–180 d（估）'),
        typLow: estimated(60, 'leaf turnover'),
        typHigh: estimated(120, 'slow-growing rosette leaves'),
        max: estimated(180, 'docs/09 §3 shoot 30–180 d（估）'),
      },
      gameCapDays: estimated(180, 'docs/09 §3 shoot game cap（估）'),
      maturityDays: range(
        estimated(7, 'docs/09 §3 biomass doubling 7–20 d（估）'),
        estimated(20, 'docs/09 §3 biomass doubling 7–20 d（估）'),
      ),
      reproduction: { mode: 'fragmentation' },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: estimated(90, 'mid-range of docs/09 shoot 30–180 d（估）'),
    },
    density: {
      typical: range(
        estimated(100, 'docs/09 §3 planted tank 100–300 g/m²（估）'),
        estimated(300, 'docs/09 §3 planted tank 100–300 g/m²（估）'),
      ),
      max: measured(522, 'microbes_aquatic_carrilloEgeria'),
      unit: 'g_dry_per_m2',
    },
  },

  macroalgae: {
    kind: 'biomass',
    latinStem: 'Caulerp',
    nounZh: '海藻',
    trophicMode: 'photoautotroph',
    flags: ['photosynthetic'],
    morphologies: ['羽狀', '葡萄狀', '絲團狀', '葉片狀', '扇狀', '分枝狀', '管狀', '殼狀'],
    specialisedMetabolism: '鈣化型：沉積碳酸鈣，消耗鈣與鹼度',
    light: {
      halfSaturation: estimated(
        60,
        'below Caulerpa light saturation 200 µmol',
        'microbes_aquatic_caulerpaLight',
      ),
      optimum: measured(200, 'microbes_aquatic_caulerpaLight'),
    },
    massMg: range(
      estimated(10, 'small frond or Chaetomorpha clump'),
      estimated(5000, 'large thallus'),
    ),
    typicalLengthMm: estimated(100, 'Caulerpa frond or Chaetomorpha ball'),
    tolerance: {
      temperatureC: range(
        estimated(15, 'temperate macroalgae'),
        measured(40.9, 'microbes_aquatic_tsutsuiChaetomorpha'),
      ),
      salinityPpt: range(
        estimated(
          10,
          'docs/02 threshold; Chaetomorpha to 3.4 ppt, Caulerpa deteriorates at 15 ppt',
          'microbes_aquatic_tsutsuiChaetomorpha',
        ),
        derived(
          45,
          'microbes_aquatic_liaoCaulerpa',
          'C. lentillifera tolerates 50 ppt; clipped to 45',
        ),
      ),
      ph: range(estimated(7.0, 'brackish lower limit'), estimated(9.0, 'refugium daytime pH')),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(30, 'docs/09 §3 thallus 30–120 d（估）'),
        typLow: estimated(45, 'frond turnover'),
        typHigh: estimated(90, 'mature fronds'),
        max: estimated(120, 'docs/09 §3 thallus 30–120 d（估）'),
      },
      gameCapDays: estimated(120, 'docs/09 §3 thallus game cap（估）'),
      maturityDays: range(
        derived(
          1.5,
          'microbes_aquatic_tsutsuiChaetomorpha',
          'ln 2 / ln(1.60) at ≈ 60 %/d laboratory growth',
        ),
        derived(41, 'microbes_aquatic_invemarCaulerpa', 'ln 2 / ln(1.017) at 1.7 %/d'),
      ),
      reproduction: { mode: 'fragmentation' },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: estimated(60, 'mid-range of docs/09 thallus 30–120 d（估）'),
    },
    density: {
      typical: range(estimated(10, 'small refugium clump'), estimated(50, 'established refugium')),
      max: estimated(100, 'docs/09 §3 limited by space'),
      unit: 'cover_percent',
    },
  },

  zooxanthellae: {
    kind: 'biomass',
    latinStem: 'Symbiodin',
    nounZh: '蟲黃藻',
    trophicMode: 'symbiont',
    flags: ['photosynthetic'],
    morphologies: [
      '球形',
      '卵形',
      '大型細胞',
      '小型細胞',
      '厚壁囊胞',
      '鞭毛游孢',
      '色素密集',
      '色素稀疏',
    ],
    specialisedMetabolism: '耐熱型：白化溫度門檻較高，光合產量較低',
    light: {
      halfSaturation: estimated(
        100,
        'reef aquarium PAR 50–400; corals saturate in mid range',
        'microbes_aquatic_reefLighting',
      ),
      optimum: estimated(
        300,
        'reef aquarium PAR upper range; in-hospite electron transport optimum ≈ 200',
        'microbes_aquatic_reefLighting',
      ),
    },
    massMg: range(
      estimated(3e-8, '6 µm cell ≈ 113 µm³', 'microbes_aquatic_symbiodiniumWiki'),
      estimated(3.5e-7, '13 µm cell ≈ 1,150 µm³', 'microbes_aquatic_symbiodiniumWiki'),
    ),
    typicalLengthMm: derived(0.0095, 'microbes_aquatic_symbiodiniumWiki', 'midpoint of 6–13 µm'),
    tolerance: {
      temperatureC: range(
        estimated(18, 'reef-building coral lower limit'),
        measured(35, 'microbes_aquatic_symbiodiniumWiki'),
      ),
      salinityPpt: range(
        estimated(25, 'host coral lower salinity limit'),
        estimated(40, 'Red Sea and Persian Gulf hosts'),
      ),
      ph: range(estimated(7.6, 'host calcification limit'), estimated(8.6, 'reef daytime maximum')),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(3, 'microbes_aquatic_symbiodiniumDoubling'),
        typLow: measured(7, 'microbes_aquatic_symbiodiniumDoubling'),
        typHigh: estimated(30, 'cells expelled or digested by host'),
        max: measured(74, 'microbes_aquatic_symbiodiniumDoubling'),
      },
      gameCapDays: estimated(120, 'docs/09 §3 cell game cap（估）'),
      maturityDays: range(
        measured(3, 'microbes_aquatic_symbiodiniumDoubling'),
        measured(74, 'microbes_aquatic_symbiodiniumDoubling'),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'cell_turnover',
      recruitment: 'normal',
    },
    density: {
      typical: range(
        measured(1e6, 'microbes_aquatic_symbiodiniumDensity'),
        measured(1.4e6, 'microbes_aquatic_mieogSymbiodinium'),
      ),
      max: estimated(4e6, 'docs/09 §3 maximum in coral tissue（估）'),
      unit: 'cells_per_cm2',
    },
  },

  ciliate: {
    kind: 'biomass',
    latinStem: 'Parameci',
    nounZh: '纖毛蟲',
    trophicMode: 'consumer',
    flags: [],
    morphologies: [
      '拖鞋形',
      '鐘形有柄',
      '喇叭形',
      '球形',
      '扁平爬行',
      '長頸形',
      '毛刺形',
      '群體有柄',
    ],
    specialisedMetabolism: '共生藻型：細胞內攜帶小球藻，光照下補充營養並耐低氧',
    massMg: range(
      estimated(2e-6, '60 µm ciliate ≈ 10⁴ µm³', 'microbes_aquatic_parameciumWiki'),
      estimated(6e-4, '300 µm ciliate ≈ 3 × 10⁶ µm³', 'microbes_aquatic_parameciumWiki'),
    ),
    typicalLengthMm: estimated(0.2, 'Paramecium caudatum', 'microbes_aquatic_parameciumWiki'),
    tolerance: {
      temperatureC: range(
        measured(3.0, 'microbes_aquatic_krenekParamecium'),
        measured(35.9, 'microbes_aquatic_krenekParamecium'),
      ),
      salinityPpt: range(
        estimated(0, 'freshwater Paramecium', 'microbes_aquatic_parameciumWiki'),
        estimated(40, 'marine ciliates', 'microbes_aquatic_parameciumWiki'),
      ),
      ph: range(estimated(5.5, 'acidic limit'), estimated(9.0, 'alkaline limit')),
    },
    lifeHistory: {
      lifespanDays: {
        min: derived(0.25, 'microbes_aquatic_krenekParamecium', 'ln 2 / μmax 2.77 d⁻¹'),
        typLow: estimated(0.8, 'docs/09 §3 typical division 20–26 h'),
        typHigh: estimated(1.1, 'docs/09 §3 typical division 20–26 h'),
        max: estimated(10, 'starved cells survive several days'),
      },
      gameCapDays: CELL_GAME_CAP,
      maturityDays: range(
        derived(0.25, 'microbes_aquatic_krenekParamecium', 'ln 2 / μmax 2.77 d⁻¹'),
        estimated(3, 'docs/09 §3 slow division over several days'),
      ),
      reproduction: { mode: 'fission' },
      senescence: 'clonal_aging',
      recruitment: 'normal',
      clonalMaxGenerations: range(
        measured(200, 'microbes_aquatic_parameciumWiki'),
        measured(600, 'microbes_aquatic_takagiParamecium'),
      ),
    },
    density: {
      typical: range(
        measured(3, 'microbes_aquatic_ciliateLakes'),
        measured(20, 'microbes_aquatic_ciliateLakes'),
      ),
      max: estimated(14000, 'docs/09 §3 culture 4,000–14,000 /mL', 'microbes_aquatic_ciliateBloom'),
      unit: 'cells_per_mL',
    },
  },
};
