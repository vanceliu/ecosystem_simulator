import type { ArchetypeData } from '../archetype';
import { derived, estimated, measured } from '../sourced';
import type { ArchetypeGroups } from './groupTypes';

const DOCS09 = 'docs/09 §8 provisional value; no primary source located';
/** I50 = ln2 · Ik and I95 = 3 · Ik for P = Pmax(1 − e^(−I/Ik)) */
const I50_PER_I95 = 0.231;
/** sunlight: 1 ft-c = 10.764 lux ≈ 0.2 µmol·m⁻²·s⁻¹ PAR */
const UMOL_PER_FTC = 0.2;

/** docs/02, docs/09: moss_liverwort, terrestrial_plant, bromeliad_epiphyte, saprotrophic_fungus, soil_bacteria, soil_nematode, springtail, terrestrial_isopod, millipede, potworm, earthworm, land_snail_slug */
export const LAND_SOIL: Readonly<Partial<Record<ArchetypeGroups['land_soil'], ArchetypeData>>> = {
  moss_liverwort: {
    kind: 'biomass',
    latinStem: 'Bryum',
    nounZh: '苔',
    flags: ['photosynthetic'],
    trophicMode: 'photoautotroph',
    specialised: {
      desiccation: estimated(
        0.1,
        'drying under 14 d barely affects survival',
        'physiology_proctor2007',
      ),
    },
    niche: 'land',
    kinetics: {
      muMax: estimated(
        0.015,
        'below vascular understory RGR 0.011–0.021 d⁻¹',
        'physiology_brito2025',
      ),
      halfSat: {
        nitrogen: estimated(
          0.33,
          'root uptake Km applied to leaf water films',
          'physiology_eucalyptusNh4',
        ),
        phosphorus: estimated(
          0.22,
          'root uptake Km applied to leaf water films',
          'physiology_pepperPhosphate',
        ),
      },
      darkRespiration: estimated(0.3, 'slow growers respire a larger share'),
    },
    morphologies: ['墊狀', '叢生直立', '匍匐羽狀', '葉狀苔', '莖葉苔', '垂掛', '星狀', '絨毯'],
    specialisedMetabolism:
      '耐旱復甦：乾燥時代謝休止，濕度恢復後數小時內恢復光合；乾燥期不死亡但不成長',
    light: {
      halfSaturation: derived(
        Math.round(I50_PER_I95 * Math.sqrt(583 * 214)),
        'land_soil_marschallProctor2004',
        'I50 = 0.231 × I95; I95 = geometric mean of moss (583) and liverwort (214) medians',
      ),
      optimum: derived(
        Math.round(Math.sqrt(583 * 214)),
        'land_soil_marschallProctor2004',
        'geometric mean of moss (583) and liverwort (214) median I95',
      ),
    },
    massMg: {
      min: estimated(0.05, 'shoot dry mass of small pleurocarps (Hypnum, Taxiphyllum)'),
      max: estimated(5, 'shoot dry mass of large acrocarps (Polytrichum-type)'),
    },
    typicalLengthMm: estimated(20, 'typical shoot length of terrarium mosses'),
    tolerance: {
      temperatureC: {
        min: estimated(0, 'hydrated bryophytes survive near-freezing; frost hardiness ignored'),
        max: estimated(
          35,
          'hydrated shoots damaged above ≈ 35 °C; desiccated shoots tolerate more',
        ),
      },
      ph: {
        min: estimated(3.5, 'Sphagnum peat bog pH 3.5–4.5 (docs/11 §5.1)'),
        max: estimated(8.0, 'calcicole mosses on limestone'),
      },
      humidityMinPercent: estimated(80, 'docs/02 §3.9: requires humidity > 80%'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(250, `shoot lifespan; ${DOCS09}`),
        typLow: estimated(700, `shoot lifespan; ${DOCS09}`),
        typHigh: estimated(700, `shoot lifespan; ${DOCS09}`),
        max: estimated(1060, `shoot lifespan; ${DOCS09}`),
      },
      gameCapDays: estimated(1095, `shoot game cap; ${DOCS09}`),
      maturityDays: {
        min: estimated(
          60,
          'biomass doubling under good humidity and light; annual growth 10–50 mm (docs/09)',
        ),
        max: estimated(
          365,
          'biomass doubling for slow cushion mosses; annual growth 10–50 mm (docs/09)',
        ),
      },
      reproduction: { mode: 'fragmentation' },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: estimated(700, `shoot lifespan; ${DOCS09}`),
    },
    density: {
      typical: {
        min: estimated(10, `cover; ${DOCS09}`),
        max: estimated(60, `cover; ${DOCS09}`),
      },
      max: estimated(100, 'full cover of available land surface'),
      unit: 'cover_percent',
    },
  },

  terrestrial_plant: {
    kind: 'biomass',
    latinStem: 'Epiprem',
    nounZh: '草',
    flags: ['photosynthetic'],
    trophicMode: 'photoautotroph',
    specialised: {
      lightHalfSat: derived(
        0.4,
        'physiology_zhang2020',
        'shade-tolerant saturation ≈ 430 vs sun plants ≈ 1050 µmol m⁻² s⁻¹',
      ),
      lightOptimum: derived(
        0.4,
        'physiology_zhang2020',
        'shade-tolerant saturation ≈ 430 vs sun plants ≈ 1050 µmol m⁻² s⁻¹',
      ),
    },
    niche: 'land',
    kinetics: {
      muMax: derived(
        0.015,
        'physiology_brito2025',
        'high-light RGR 0.021 d⁻¹ at ≈ 25 °C ÷ 1.072^5',
      ),
      halfSat: {
        nitrogen: derived(
          0.33,
          'physiology_eucalyptusNh4',
          'geometric mean of root NH4+ 15 µM and NO3− 30–45 µM × 14.007/1000',
        ),
        phosphorus: derived(
          0.22,
          'physiology_pepperPhosphate',
          'geometric mean of root 25.9 µM and transporter 1.9 µM × 30.97/1000',
        ),
      },
      darkRespiration: estimated(0.3, 'slow growers respire a larger share'),
    },
    morphologies: [
      '蔓生攀緣',
      '叢生蓮座',
      '直立挺水',
      '匍匐地被',
      '羽狀蕨葉',
      '心形大葉',
      '細葉簇生',
      '垂枝',
    ],
    specialisedMetabolism:
      '耐陰：光補償點與光飽和點降低、葉大而薄，低光下成長優於一般型，強光下較差',
    light: {
      halfSaturation: derived(
        Math.round(I50_PER_I95 * 2500 * UMOL_PER_FTC),
        'land_soil_ufPothos',
        'I50 = 0.231 × I95; I95 = production light 2,500 ft-c × 0.2 µmol·m⁻²·s⁻¹ per ft-c',
      ),
      optimum: derived(
        2500 * UMOL_PER_FTC,
        'land_soil_ufPothos',
        'production light 2,500 ft-c (80% shade) × 0.2 µmol·m⁻²·s⁻¹ per ft-c',
      ),
    },
    massMg: {
      min: estimated(5, 'leaf dry mass of small ferns and creeping fig (≈ 2 cm² at ≈ 250 cm²/g)'),
      max: estimated(1000, 'leaf dry mass of large aroid leaves (≈ 250 cm² at ≈ 250 cm²/g)'),
    },
    typicalLengthMm: estimated(
      100,
      'leaf length; UF/IFAS: interior pothos leaves seldom exceed 150 mm',
      'land_soil_ufPothos',
    ),
    tolerance: {
      temperatureC: {
        min: derived(
          5,
          'land_soil_ufPothos',
          '33–40 °F (0.5–4.4 °C) for several hours damages leaves; rounded up',
        ),
        max: derived(35, 'land_soil_ufPothos', 'quality declines above 95 °F (35 °C)'),
      },
      ph: {
        min: estimated(
          5.0,
          'ferns and aroids in acidic peat substrates; UF/IFAS medium pH 6.5–7.0',
          'land_soil_ufPothos',
        ),
        max: estimated(
          7.5,
          'UF/IFAS medium pH 6.5–7.0 plus tolerance margin',
          'land_soil_ufPothos',
        ),
      },
      humidityMinPercent: derived(60, 'land_soil_ufPothos', 'lower bound of production RH 60–100%'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(120, `leaf lifespan; ${DOCS09}`),
        typLow: estimated(365, `leaf lifespan; ${DOCS09}`),
        typHigh: estimated(365, `leaf lifespan; ${DOCS09}`),
        max: estimated(540, `leaf lifespan; ${DOCS09}`),
      },
      gameCapDays: estimated(540, `leaf game cap; ${DOCS09}`),
      maturityDays: {
        min: estimated(
          30,
          'biomass doubling; one leaf per shoot every 7–14 d (docs/09) on 5–10-leaf shoots',
        ),
        max: estimated(120, 'biomass doubling under low interior light'),
      },
      reproduction: { mode: 'fragmentation' },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: estimated(365, `leaf lifespan; ${DOCS09}`),
    },
    density: {
      typical: {
        min: estimated(50, 'planted terrarium understory biomass'),
        max: estimated(300, 'densely planted terrarium understory biomass'),
      },
      max: estimated(1000, 'limited by land area (docs/09); dense tropical herb layer'),
      unit: 'g_dry_per_m2',
    },
  },

  bromeliad_epiphyte: {
    kind: 'biomass',
    latinStem: 'Neoreg',
    nounZh: '鳳梨',
    flags: ['photosynthetic'],
    trophicMode: 'photoautotroph',
    specialised: {
      growth: derived(0.63, 'physiology_monteiro2009', 'C3 species grew 60% faster: 1 / 1.6'),
      humidityMinShift: estimated(
        -20,
        'atmospheric CAM species occupy the drier sites',
        'physiology_griffithsSmith1983',
      ),
    },
    niche: 'land',
    kinetics: {
      muMax: derived(
        0.023,
        'physiology_schmidtZotz2002',
        'greenhouse ≈ 10 × in-situ RGR 3.3 × 10⁻³ d⁻¹ at ≈ 25 °C ÷ 1.072^5',
      ),
      halfSat: {
        nitrogen: estimated(
          0.33,
          'root uptake Km applied to tank water',
          'physiology_eucalyptusNh4',
        ),
        phosphorus: estimated(
          0.22,
          'root uptake Km applied to tank water',
          'physiology_pepperPhosphate',
        ),
      },
      darkRespiration: estimated(0.3, 'slow growers respire a larger share'),
    },
    morphologies: [
      '筒狀蓮座',
      '開展蓮座',
      '迷你叢生',
      '斑葉',
      '紅心',
      '橫紋葉',
      '長走莖',
      '銀白鱗片',
    ],
    specialisedMetabolism: 'CAM 景天酸代謝：夜間固定 CO₂、白天氣孔關閉，耐低濕但光合速率較低',
    light: {
      halfSaturation: estimated(
        150,
        'Neoregelia seedlings: lower LSP under 77% shade (noon PPF 258–859); values not reported',
        'land_soil_chen2016Neoregelia',
      ),
      optimum: estimated(
        500,
        'bright light for rosette colour; seedlings grew under noon PPF 258–859',
        'land_soil_chen2016Neoregelia',
      ),
    },
    massMg: {
      min: estimated(1000, 'rosette dry mass of miniature Neoregelia (≈ 10 cm)'),
      max: estimated(50000, 'rosette dry mass of large tank bromeliads (≈ 50 cm)'),
    },
    typicalLengthMm: estimated(200, 'rosette diameter of common terrarium Neoregelia'),
    tolerance: {
      temperatureC: {
        min: measured(10, 'land_soil_neoregelia'),
        max: derived(
          32,
          'land_soil_chen2016Neoregelia',
          'below the 35/30 °C day/night regime that killed seedlings; 30/25 °C grew best',
        ),
      },
      ph: {
        min: estimated(4.5, 'tank water acidified by litter and tannins'),
        max: estimated(7.0, 'epiphytes on bark and soft rainwater'),
      },
      humidityMinPercent: estimated(50, 'CAM tank epiphyte tolerates moderate humidity'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(1100, `rosette lifespan; ${DOCS09}`),
        typLow: estimated(1100, `rosette lifespan; ${DOCS09}`),
        typHigh: estimated(1460, `rosette lifespan; ${DOCS09}`),
        max: estimated(1460, `rosette lifespan; ${DOCS09}`),
      },
      gameCapDays: estimated(1460, `rosette game cap; ${DOCS09}`),
      maturityDays: {
        min: estimated(730, 'rosette flowers at 2–3 yr (docs/09)'),
        max: estimated(1095, 'rosette flowers at 2–3 yr (docs/09)'),
      },
      reproduction: {
        mode: 'budding',
        clutch: {
          min: estimated(
            2,
            'pups per rosette after flowering (docs/02); "several pups"',
            'land_soil_neoregelia',
          ),
          max: estimated(
            6,
            'pups per rosette after flowering (docs/02); "several pups"',
            'land_soil_neoregelia',
          ),
        },
      },
      senescence: 'semelparous',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(2, 'rosettes per m² of terrarium land area'),
        max: estimated(10, 'rosettes per m² of terrarium land area'),
      },
      max: estimated(25, 'touching miniature rosettes (≈ 20 cm spacing)'),
      unit: 'individuals_per_m2',
    },
  },

  saprotrophic_fungus: {
    kind: 'biomass',
    latinStem: 'Mycena',
    nounZh: '蕈',
    flags: [],
    trophicMode: 'decomposer',
    specialised: {
      litterDecay: estimated(
        0.01,
        'Trametes removes up to 60% of litter mass; 12-week run assumed: −ln(0.4) / 84',
        'physiology_osono2018',
      ),
      growth: estimated(0.5, 'lignin specialists grow slower than other saprotrophs'),
    },
    niche: 'soil',
    kinetics: {
      muMax: derived(
        2.16,
        'microbes_aquatic_trinci1969',
        'Aspergillus nidulans 0.090 h⁻¹ at 20 °C × 24 h',
      ),
      halfSat: {},
      yieldCoefficient: estimated(0.67, 'heterotroph YH applied to hyphae', 'asm1'),
    },
    morphologies: [
      '棉絮菌絲',
      '菌索',
      '小型傘菌',
      '杯狀子實體',
      '黴菌孢子團',
      '膠質',
      '珊瑚狀',
      '殼狀',
    ],
    specialisedMetabolism: '白腐木質素分解：可分解木材與硬質落葉，分解範圍廣但成長較慢',
    massMg: {
      min: estimated(1e-8, 'hyphal compartment 2 µm × 20 µm, density 1.1 g/cm³, dry fraction 0.2'),
      max: estimated(
        4e-6,
        'hyphal compartment 10 µm × 200 µm, density 1.1 g/cm³, dry fraction 0.2',
      ),
    },
    typicalLengthMm: estimated(0.1, 'hyphal compartment length'),
    tolerance: {
      temperatureC: {
        min: estimated(
          0,
          'mesophilic saprotrophs; soil fungi still grew slowly at −2 °C',
          'land_soil_hughes2003',
        ),
        max: estimated(35, 'no growth of tested soil fungi at 37 °C', 'land_soil_hughes2003'),
      },
      ph: {
        min: derived(
          4.0,
          'land_soil_rousk2010',
          'fungal abundance unaffected across sampled pH 4.0–8.3; lower bound',
        ),
        max: derived(
          8.3,
          'land_soil_rousk2010',
          'fungal abundance unaffected across sampled pH 4.0–8.3; upper bound',
        ),
      },
      humidityMinPercent: estimated(
        85,
        'hyphal growth needs near-saturated substrate; white mould phase in humid new setups (docs/02)',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(5, `hyphal segment lifespan; fruit bodies 1–5 d; ${DOCS09}`),
        typLow: measured(130, 'land_soil_rousk2007'),
        typHigh: measured(150, 'land_soil_rousk2007'),
        max: estimated(180, 'longest-lived hyphae beyond the measured 130–150 d turnover'),
      },
      gameCapDays: estimated(180, 'hypha game cap above the measured 130–150 d turnover'),
      maturityDays: {
        min: estimated(7, `colony establishment to sporulation; ${DOCS09}`),
        max: estimated(21, `colony establishment to sporulation; ${DOCS09}`),
      },
      reproduction: { mode: 'spores' },
      senescence: 'modular',
      recruitment: 'normal',
      moduleLifespanDays: derived(
        140,
        'land_soil_rousk2007',
        'midpoint of turnover time 130–150 d',
      ),
    },
    density: {
      typical: {
        min: derived(
          5,
          'litterStockTemperate',
          'fungal share 1% (assumed) of 500 g/m² deciduous litter stock',
        ),
        max: derived(
          40,
          'litterStockTemperate',
          'fungal share 5% (assumed) of 800 g/m² deciduous litter stock',
        ),
      },
      max: derived(
        250,
        'litterStockTemperate',
        'fungal share 5% (assumed) of 5,000 g/m² coniferous litter stock',
      ),
      unit: 'g_dry_per_m2',
    },
  },

  soil_bacteria: {
    kind: 'biomass',
    latinStem: 'Streptom',
    nounZh: '細菌',
    flags: [],
    trophicMode: 'decomposer',
    specialised: {
      desiccation: estimated(
        0.02,
        '75% of spores survive extreme desiccation that kills E. coli',
        'physiology_nicholson2000',
      ),
    },
    niche: 'soil',
    kinetics: {
      muMax: derived(6.0, 'land_soil_reischke2014', 'community exponential growth 0.25 h⁻¹ × 24 h'),
      halfSat: {},
      yieldCoefficient: measured(0.67, 'asm1'),
    },
    morphologies: [
      '桿狀',
      '球狀',
      '放線菌絲狀',
      '螺旋狀',
      '芽孢型',
      '微菌落',
      '黏液群體',
      '短桿成對',
    ],
    specialisedMetabolism: '芽孢休眠：乾燥或缺養時形成內孢子存活，存活率高但活性比例降低',
    massMg: {
      min: estimated(
        3e-11,
        'soil cells ≈ 0.1 × E. coli volume; E. coli dry mass 0.3 pg',
        'bionumbers',
      ),
      max: measured(3e-10, 'bionumbers'),
    },
    typicalLengthMm: estimated(0.001, 'soil bacterial cells ≈ 0.5–1.5 µm'),
    tolerance: {
      temperatureC: {
        min: estimated(0, 'mesophilic soil community; slow activity near freezing'),
        max: estimated(45, 'mesophilic soil community; thermophiles excluded'),
      },
      ph: {
        min: derived(
          4.0,
          'land_soil_rousk2010',
          'bacteria present across sampled pH 4.0–8.3; abundance rises with pH; lower bound',
        ),
        max: derived(
          8.3,
          'land_soil_rousk2010',
          'bacteria present across sampled pH 4.0–8.3; upper bound',
        ),
      },
      humidityMinPercent: estimated(
        30,
        'activity governed by soil moisture, not air humidity; set at dry-allele floor',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(
          2,
          'cell lifespan ≈ generation time at steady state; fastest soil growers',
          'land_soil_caro2022',
        ),
        typLow: estimated(
          20,
          'cell lifespan ≈ apparent generation time 20–64 d',
          'land_soil_caro2022',
        ),
        typHigh: estimated(
          40,
          'cell lifespan ≈ apparent generation time 20–64 d',
          'land_soil_caro2022',
        ),
        max: estimated(60, `cell game cap; ${DOCS09}`),
      },
      gameCapDays: estimated(60, `cell game cap; ${DOCS09}`),
      maturityDays: {
        min: estimated(1.6, `fastest community doubling; ${DOCS09}`),
        max: measured(64, 'land_soil_caro2022'),
      },
      reproduction: { mode: 'fission' },
      senescence: 'cell_turnover',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(1e8, 'land_soil_bionumbersSoil'),
        max: measured(1e9, 'land_soil_bionumbersSoil'),
      },
      max: estimated(
        5e9,
        'between top-metre mean 2 × 10⁹ and upper bound 10¹⁰ cells/g',
        'land_soil_bionumbersSoil',
      ),
      unit: 'cells_per_g_soil',
    },
  },

  soil_nematode: {
    kind: 'cohort',
    latinStem: 'Acrobel',
    nounZh: '線蟲',
    flags: [],
    diets: [
      { bacteria: 0.9, detritus: 0.1 },
      { fungi: 0.85, detritus: 0.15 },
      { bacteria: 0.4, fungi: 0.3, protozoa: 0.3 },
      { terrestrial_invertebrate: 0.6, protozoa: 0.3, bacteria: 0.1 },
    ],
    preySizeRatio: { min: 0.001, opt: 0.05, max: 0.5 },
    defenses: [[], ['burrowing'], ['hiding'], ['burrowing', 'hiding']],
    habitats: [['soil'], ['leaf_litter', 'soil']],
    massMg: {
      min: estimated(5e-5, 'adult 0.5 mm, wet ≈ 0.2 µg × 0.25 dry fraction'),
      max: estimated(2e-3, 'adult 2 mm, wet ≈ 8 µg × 0.25 dry fraction'),
    },
    typicalLengthMm: estimated(1, 'docs/09 §8 adult 0.5–2 mm; C. elegans ≈ 1 mm'),
    tolerance: {
      temperatureC: {
        min: estimated(
          4,
          'soil nematodes slow but survive near 4 °C; C. elegans culture limits 16–25 °C',
          'land_soil_byerly1976',
        ),
        max: derived(
          31.5,
          'land_soil_panagrellus',
          'Panagrellus completes its life cycle up to 31.5 °C; applied to group',
        ),
      },
      ph: {
        min: estimated(4.0, 'acid forest soils host diverse nematode communities'),
        max: estimated(8.0, 'calcareous soils'),
      },
      humidityMinPercent: estimated(85, 'active only in soil water films'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(7, DOCS09),
        typLow: derived(14, 'land_soil_woodCelegans', 'C. elegans lifespan 2–3 weeks; lower bound'),
        typHigh: derived(
          21,
          'land_soil_woodCelegans',
          'C. elegans lifespan 2–3 weeks; upper bound',
        ),
        max: estimated(30, DOCS09),
      },
      gameCapDays: estimated(30, DOCS09),
      maturityDays: {
        min: derived(3, 'land_soil_woodCelegans', 'C. elegans life cycle ≈ 3 d'),
        max: estimated(4, DOCS09),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: estimated(10, 'daily egg output of slow-reproducing soil taxa'),
          max: derived(75, 'land_soil_woodCelegans', '≈ 300 self-progeny over ≈ 4 fertile days'),
        },
        intervalDays: {
          min: estimated(1, 'daily laying during the fertile period'),
          max: estimated(1, 'daily laying during the fertile period'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1e6, DOCS09),
        max: estimated(5e6, DOCS09),
      },
      max: estimated(1e7, DOCS09),
      unit: 'individuals_per_m2',
    },
  },

  springtail: {
    kind: 'cohort',
    latinStem: 'Folsom',
    nounZh: '跳蟲',
    flags: [],
    diets: [
      { fungi: 0.7, detritus: 0.3 },
      { detritus: 0.6, litter: 0.2, fungi: 0.2 },
      { food: 0.5, fungi: 0.3, detritus: 0.2 },
      { fungi: 0.4, biofilm: 0.4, plant: 0.2 },
    ],
    defenses: [['hiding'], [], ['toxin'], ['burrowing']],
    habitats: [['leaf_litter', 'ground'], ['soil']],
    massMg: {
      min: estimated(0.005, 'adult 1 mm via typical Collembola length–mass relations'),
      max: estimated(0.1, 'adult 2–3 mm via typical Collembola length–mass relations'),
    },
    typicalLengthMm: measured(2, 'land_soil_tully2023'),
    tolerance: {
      temperatureC: {
        min: estimated(
          5,
          'egg production delayed and hatching reduced at 10 °C; growth to adult ≈ 2 months at 15–16 °C',
          'land_soil_tully2023',
        ),
        max: estimated(
          28,
          'reproduction impaired by 30/26 °C heat; cultures kept at 21 °C',
          'land_soil_tully2023',
        ),
      },
      ph: {
        min: estimated(4.5, 'Folsomia tested in acid field soils (pH 5)'),
        max: estimated(8.0, 'calcareous litter'),
      },
      humidityMinPercent: estimated(
        90,
        'docs/02 §3.10 humidity ≥ 90%; cultures at ≈ 100% RH',
        'land_soil_tully2023',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: measured(17, 'land_soil_tully2023'),
        typLow: measured(42, 'land_soil_tully2023'),
        typHigh: measured(115, 'land_soil_tully2023'),
        max: measured(571, 'land_soil_tully2023'),
      },
      gameCapDays: derived(
        571,
        'land_soil_tully2023',
        'longest observed lifespan (experiment end)',
      ),
      maturityDays: {
        min: measured(14, 'land_soil_tully2008'),
        max: derived(60, 'land_soil_tully2023', 'growth to adult size ≈ 2 months at 15–16 °C'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(26, 'land_soil_tully2023'),
          max: measured(59, 'land_soil_collembolaEggs'),
        },
        intervalDays: {
          min: measured(6.7, 'land_soil_tully2008'),
          max: measured(12, 'land_soil_tully2023'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(1e4, 'land_soil_collembolaDensity'),
        max: estimated(4.4e4, DOCS09),
      },
      max: measured(1e5, 'land_soil_collembolaDensity'),
      unit: 'individuals_per_m2',
    },
  },

  terrestrial_isopod: {
    kind: 'cohort',
    latinStem: 'Porcell',
    nounZh: '鼠婦',
    flags: [],
    diets: [
      { litter: 0.6, detritus: 0.3, fungi: 0.1 },
      { detritus: 0.5, food: 0.3, litter: 0.2 },
      { litter: 0.4, plant: 0.2, fungi: 0.2, carrion: 0.2 },
      { fungi: 0.4, detritus: 0.4, biofilm: 0.2 },
    ],
    defenses: [['armor'], ['armor', 'hiding'], ['hiding'], ['armor', 'toxin']],
    habitats: [
      ['leaf_litter', 'ground'],
      ['crevice', 'leaf_litter'],
    ],
    massMg: {
      min: estimated(
        0.1,
        'Trichorhina-sized adult ≈ 0.4 mg wet × 0.3 dry fraction',
        'land_soil_trichorhina',
      ),
      max: estimated(
        60,
        'Armadillidium-sized adult ≈ 200 mg wet × 0.3 dry fraction',
        'land_soil_ufPillbug',
      ),
    },
    typicalLengthMm: estimated(
      12,
      'common vivarium Porcellio/Armadillidium; adults 2–18 mm (docs/09)',
    ),
    tolerance: {
      temperatureC: {
        min: measured(-4.6, 'land_soil_iucnPorcellio'),
        max: estimated(
          32,
          'sustained limit below short-term heat tolerance ≈ 39 °C',
          'land_soil_porcellioHeat',
        ),
      },
      ph: {
        min: estimated(5.5, 'calcium needed for cuticle; acid litter tolerated'),
        max: estimated(
          8.5,
          'calcareous grassland is a peak habitat',
          'land_soil_paolettiHassall1999',
        ),
      },
      humidityMinPercent: estimated(60, 'needs humid refuge plus drier zone (docs/02 §3.10)'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(180, DOCS09),
        typLow: estimated(365, DOCS09),
        typHigh: derived(730, 'land_soil_ufPillbug', 'lower bound of 2–5 yr adult lifespan'),
        max: derived(1250, 'land_soil_scaberLifeCycle', 'A. vulgare 41 months × 30.4 d'),
      },
      gameCapDays: derived(1250, 'land_soil_scaberLifeCycle', 'A. vulgare 41 months × 30.4 d'),
      maturityDays: {
        min: estimated(60, 'small parthenogenetic species (Trichorhina); docs/09 §8'),
        max: derived(450, 'land_soil_scaberLifeCycle', 'P. scaber mature ≈ 15 months × 30 d'),
      },
      reproduction: {
        mode: 'brood',
        clutch: {
          min: estimated(2, 'small species broods; docs/09 §8'),
          max: measured(200, 'land_soil_ufPillbug'),
        },
        intervalDays: {
          min: derived(122, 'land_soil_ufPillbug', '365 d / 3 broods per year'),
          max: derived(365, 'land_soil_ufPillbug', '365 d / 1 brood per year'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(160, DOCS09),
        max: measured(3000, 'land_soil_paolettiHassall1999'),
      },
      max: estimated(1e4, `culture density; ${DOCS09}`),
      unit: 'individuals_per_m2',
    },
  },

  millipede: {
    kind: 'cohort',
    latinStem: 'Oxidus',
    nounZh: '馬陸',
    flags: [],
    diets: [
      { litter: 0.7, detritus: 0.2, fungi: 0.1 },
      { litter: 0.5, detritus: 0.3, food: 0.2 },
      { litter: 0.4, fruit: 0.3, plant: 0.3 },
      { fungi: 0.5, detritus: 0.3, litter: 0.2 },
    ],
    defenses: [['toxin'], ['armor'], ['armor', 'toxin'], ['toxin', 'hiding']],
    habitats: [
      ['leaf_litter', 'ground'],
      ['soil', 'leaf_litter'],
    ],
    massMg: {
      min: estimated(2, 'small polydesmid ≈ 7 mg wet × 0.3 dry fraction'),
      max: estimated(150, 'large julid/spirostreptid ≈ 500 mg wet × 0.3 dry fraction'),
    },
    typicalLengthMm: estimated(20, 'docs/09 §8 adult ≈ 20 mm (Oxidus gracilis)'),
    tolerance: {
      temperatureC: {
        min: estimated(5, 'temperate leaf-litter millipedes overwinter in cool soil'),
        max: estimated(30, 'desiccation and heat stress above ≈ 30 °C'),
      },
      ph: {
        min: estimated(5.0, 'acid forest litter'),
        max: estimated(8.0, 'calcareous mull soils'),
      },
      humidityMinPercent: estimated(70, 'needs moist litter and soil'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(365, DOCS09),
        typLow: estimated(730, DOCS09),
        typHigh: estimated(730, DOCS09),
        max: estimated(1800, `${DOCS09}; hobby reports of Oxidus up to ≈ 5 yr`),
      },
      gameCapDays: estimated(1800, DOCS09),
      maturityDays: {
        min: derived(150, 'land_soil_bmigOxidus', '≈ 5 months × 30 d at 22 °C'),
        max: derived(180, 'land_soil_bugguideOxidus', '5–6 months × 30 d; upper bound'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(40, 'land_soil_bugguideOxidus'),
          max: measured(150, 'land_soil_bugguideOxidus'),
        },
        intervalDays: {
          min: estimated(
            30,
            'eggs laid year-round; clutch spacing not reported',
            'land_soil_bmigOxidus',
          ),
          max: estimated(
            120,
            'eggs laid year-round; clutch spacing not reported',
            'land_soil_bmigOxidus',
          ),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(10, DOCS09),
        max: estimated(100, DOCS09),
      },
      max: estimated(1000, DOCS09),
      unit: 'individuals_per_m2',
    },
  },

  potworm: {
    kind: 'cohort',
    latinStem: 'Enchytr',
    nounZh: '線蚓',
    flags: [],
    diets: [
      { detritus: 0.5, bacteria: 0.3, fungi: 0.2 },
      { fungi: 0.6, detritus: 0.4 },
      { food: 0.5, detritus: 0.3, bacteria: 0.2 },
      { litter: 0.4, detritus: 0.4, bacteria: 0.2 },
    ],
    defenses: [[], ['burrowing'], ['mucus'], ['burrowing', 'mucus']],
    habitats: [['soil'], ['leaf_litter', 'soil']],
    massMg: {
      min: estimated(0.05, 'small enchytraeid ≈ 0.25 mg wet × 0.2 dry fraction'),
      max: estimated(3, 'large Enchytraeus albidus ≈ 15 mg wet × 0.2 dry fraction'),
    },
    typicalLengthMm: estimated(15, 'docs/09 §8 adult 10–30 mm'),
    tolerance: {
      temperatureC: {
        min: estimated(
          0,
          'E. albidus survives to ≈ −25 °C; clamped to activity range',
          'land_soil_holmstrup2023',
        ),
        max: derived(
          30,
          'land_soil_holmstrup2023',
          'below 31 °C, where 50% of adults die within 257 min',
        ),
      },
      ph: {
        min: estimated(4.0, 'enchytraeids abundant in acid forest soils'),
        max: estimated(8.0, 'neutral to calcareous soils and compost'),
      },
      humidityMinPercent: estimated(85, 'hygrophilic, high cuticular water permeability'),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(60, DOCS09),
        typLow: estimated(120, DOCS09),
        typHigh: estimated(180, DOCS09),
        max: measured(254, 'land_soil_niesEnchytraeus'),
      },
      gameCapDays: derived(254, 'land_soil_niesEnchytraeus', 'longest observed lifespan'),
      maturityDays: {
        min: measured(14, 'land_soil_niesEnchytraeus'),
        max: measured(39, 'land_soil_niesEnchytraeus'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(5, 'land_soil_niesEnchytraeus'),
          max: measured(20, 'land_soil_niesEnchytraeus'),
        },
        intervalDays: {
          min: estimated(2, 'prolific species lay ≈ 85–110 cocoons per life (E. buchholzi)'),
          max: derived(
            9,
            'land_soil_niesEnchytraeus',
            '≈ (254 − 26) reproductive days / ≈ 25 cocoons',
          ),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: measured(3400, 'land_soil_schlaghamersky2013'),
        max: estimated(22000, DOCS09),
      },
      max: estimated(36000, DOCS09),
      unit: 'individuals_per_m2',
    },
  },

  earthworm: {
    kind: 'cohort',
    latinStem: 'Eisenia',
    nounZh: '蚯蚓',
    flags: [],
    diets: [
      { detritus: 0.6, litter: 0.3, bacteria: 0.1 },
      { litter: 0.6, detritus: 0.3, fungi: 0.1 },
      { food: 0.4, detritus: 0.4, fruit: 0.2 },
      { detritus: 0.5, fungi: 0.25, bacteria: 0.25 },
    ],
    defenses: [['burrowing'], ['burrowing', 'mucus'], ['mucus'], ['burrowing', 'autotomy']],
    habitats: [
      ['soil', 'burrow'],
      ['leaf_litter', 'soil'],
    ],
    massMg: {
      min: estimated(60, 'docs/09 §8 adult 0.3 g wet × 0.2 dry fraction'),
      max: estimated(120, 'docs/09 §8 adult 0.6 g wet × 0.2 dry fraction'),
    },
    typicalLengthMm: estimated(80, 'Eisenia fetida adult 60–120 mm'),
    tolerance: {
      temperatureC: {
        min: estimated(5, 'activity and cocoon production cease in cold substrate'),
        max: estimated(32, 'best survival 20–29 °C in vermiculture studies'),
      },
      ph: {
        min: estimated(
          4.5,
          'field earthworms tolerate mildly acid soils; vermiculture pH 6.0–8.0',
          'land_soil_cornellVermicompost',
        ),
        max: measured(8.0, 'land_soil_cornellVermicompost'),
      },
      humidityMinPercent: estimated(
        80,
        'cutaneous respiration needs moist substrate; cultures at 80% substrate moisture',
        'land_soil_hundalZinia',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(365, DOCS09),
        typLow: estimated(730, DOCS09),
        typHigh: estimated(730, DOCS09),
        max: estimated(1800, DOCS09),
      },
      gameCapDays: estimated(1800, DOCS09),
      maturityDays: {
        min: measured(44, 'land_soil_hundalZinia'),
        max: measured(52, 'land_soil_hundalZinia'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(1, 'land_soil_hundalZinia'),
          max: measured(5, 'land_soil_hundalZinia'),
        },
        intervalDays: {
          min: derived(2.1, 'land_soil_hundalZinia', '1 / 0.47 cocoons per worm per day'),
          max: estimated(3, 'docs/09 §8: 2.4–3 cocoons per week at lower rates'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(20, DOCS09),
        max: estimated(100, DOCS09),
      },
      max: estimated(733, DOCS09),
      unit: 'individuals_per_m2',
    },
  },

  land_snail_slug: {
    kind: 'cohort',
    latinStem: 'Subulin',
    nounZh: '蝸牛',
    flags: [],
    diets: [
      { plant: 0.5, litter: 0.3, detritus: 0.2 },
      { fungi: 0.4, detritus: 0.4, biofilm: 0.2 },
      { plant: 0.4, fruit: 0.3, food: 0.3 },
      { detritus: 0.5, litter: 0.3, carrion: 0.2 },
    ],
    defenses: [['shell'], ['shell', 'mucus'], ['mucus'], ['mucus', 'hiding']],
    habitats: [
      ['leaf_litter', 'ground'],
      ['arboreal', 'ground'],
    ],
    massMg: {
      min: estimated(12, 'Subulina-sized snail ≈ 50 mg wet (docs/09) × 0.25 dry fraction'),
      max: derived(150, 'land_soil_osuSlug', 'Deroceras up to 500 mg wet × 0.3 dry fraction'),
    },
    typicalLengthMm: estimated(20, 'Subulina shell 15–20 mm; Deroceras 35–50 mm extended'),
    tolerance: {
      temperatureC: {
        min: estimated(5, 'temperate slugs feed in cool weather'),
        max: estimated(
          32,
          'Subulina survives 35 °C for 48 h only on humid substrate',
          'land_soil_subulinaHeat',
        ),
      },
      ph: {
        min: estimated(5.0, 'shell growth needs calcium; acid substrates limit snails'),
        max: estimated(8.5, 'calcareous substrates'),
      },
      humidityMinPercent: estimated(
        75,
        'desiccation lethal on dry substrate',
        'land_soil_subulinaHeat',
      ),
    },
    lifeHistory: {
      lifespanDays: {
        min: estimated(85, `slug lower bound; ${DOCS09}`),
        typLow: derived(180, 'land_soil_osuSlug', 'Deroceras lives 6–12 months; 6 × 30 d'),
        typHigh: derived(365, 'land_soil_osuSlug', 'Deroceras lives 6–12 months; 12 × 30.4 d'),
        max: estimated(700, `snail upper bound; ${DOCS09}`),
      },
      gameCapDays: estimated(700, DOCS09),
      maturityDays: {
        min: measured(38, 'land_soil_bessa1990'),
        max: derived(180, 'land_soil_osuSlug', 'Deroceras matures at 5–6 months; 6 × 30 d'),
      },
      reproduction: {
        mode: 'eggs',
        clutch: {
          min: measured(2, 'land_soil_bessa1990'),
          max: measured(40, 'land_soil_osuSlug'),
        },
        intervalDays: {
          min: measured(7, 'land_soil_bessa1990'),
          max: measured(31, 'land_soil_bessa1990'),
        },
      },
      senescence: 'gompertz',
      recruitment: 'normal',
    },
    density: {
      typical: {
        min: estimated(1, DOCS09),
        max: estimated(10, DOCS09),
      },
      max: estimated(100, DOCS09),
      unit: 'individuals_per_m2',
    },
  },
};
