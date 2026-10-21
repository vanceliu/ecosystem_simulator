import type { MicrobeId } from './microbes';
import { derived, estimated, measured, type Sourced } from './sourced';

export type WaterSourceId =
  | 'tap'
  | 'ro'
  | 'aged'
  | 'river'
  | 'lake'
  | 'pond'
  | 'blackwater'
  | 'spring'
  | 'estuary'
  | 'seawater';

export type WaterSourceKind = 'treated' | 'aquarium' | 'wild';

export interface WaterSourceSpec {
  readonly id: WaterSourceId;
  readonly nameZh: string;
  readonly kind: WaterSourceKind;
  readonly salinityPpt: Sourced;
  /** dKH */
  readonly kh: Sourced;
  /** mg N/L */
  readonly tan: Sourced;
  /** mg N/L */
  readonly no3: Sourced;
  /** mg P/L */
  readonly po4: Sourced;
  /** mg/L */
  readonly sio2: Sourced;
  /** mg/L */
  readonly ca: Sourced;
  /** mg C/L of dissolved organic carbon */
  readonly docMgC: Sourced;
  /** cells/mL */
  readonly inoculum: Readonly<Partial<Record<MicrobeId, Sourced>>>;
}

/** Fraction of natural DOC that bacteria degrade readily; the rest is refractory humic matter. */
export const LABILE_DOC_FRACTION = estimated(0.1, 'most natural DOC is refractory humic matter');
/** g COD per g organic carbon */
export const COD_PER_ORGANIC_CARBON = derived(
  2.67,
  'cellFormula',
  'carbohydrate CH2O: 32 g O2 per 12 g C',
);

const NONE = estimated(0, 'not present');
const lakeBacteria = measured(1e6, 'lakeBacteria');

export const WATER_SOURCES: Readonly<Record<WaterSourceId, WaterSourceSpec>> = {
  tap: {
    id: 'tap',
    nameZh: '自來水（除氯）',
    kind: 'treated',
    salinityPpt: NONE,
    kh: estimated(4, 'moderately soft municipal water'),
    tan: NONE,
    no3: estimated(1, 'municipal water, well below the 11.3 mg N/L limit'),
    po4: estimated(0.05, 'municipal water'),
    sio2: estimated(10, 'municipal water'),
    ca: estimated(30, 'moderately soft municipal water'),
    docMgC: estimated(1, 'treated drinking water'),
    inoculum: { heterotroph: measured(500, 'epaHpc') },
  },
  ro: {
    id: 'ro',
    nameZh: '過濾水（RO／蒸餾）',
    kind: 'treated',
    salinityPpt: NONE,
    kh: NONE,
    tan: NONE,
    no3: NONE,
    po4: NONE,
    sio2: NONE,
    ca: NONE,
    docMgC: NONE,
    inoculum: {},
  },
  aged: {
    id: 'aged',
    nameZh: '熟成缸水',
    kind: 'aquarium',
    salinityPpt: NONE,
    kh: estimated(3, 'carbonate hardness depleted by nitrification'),
    tan: estimated(0.05, 'established aquarium'),
    no3: estimated(10, 'established aquarium between water changes'),
    po4: estimated(0.5, 'established aquarium'),
    sio2: estimated(5, 'established aquarium'),
    ca: estimated(30, 'established aquarium'),
    docMgC: estimated(3, 'established aquarium'),
    inoculum: {
      heterotroph: lakeBacteria,
      aob: estimated(1e4, 'water column of a cycled aquarium, 10³–10⁵ cells/mL'),
      nob: estimated(1e4, 'water column of a cycled aquarium, 10³–10⁵ cells/mL'),
      denitrifier: estimated(100, 'facultative anaerobes in aerobic water'),
    },
  },
  river: {
    id: 'river',
    nameZh: '河川水',
    kind: 'wild',
    salinityPpt: NONE,
    kh: estimated(3, 'river water'),
    tan: estimated(0.05, 'unpolluted river'),
    no3: estimated(0.5, 'unpolluted river'),
    po4: estimated(0.03, 'unpolluted river'),
    sio2: estimated(8, 'river water'),
    ca: estimated(20, 'river water'),
    docMgC: measured(5, 'riverDoc'),
    inoculum: {
      heterotroph: lakeBacteria,
      aob: estimated(1e3, 'natural fresh water'),
      nob: estimated(1e3, 'natural fresh water'),
      denitrifier: estimated(1e2, 'aerobic river water'),
    },
  },
  lake: {
    id: 'lake',
    nameZh: '湖水',
    kind: 'wild',
    salinityPpt: NONE,
    kh: estimated(3, 'lake water'),
    tan: estimated(0.05, 'mesotrophic lake'),
    no3: estimated(0.3, 'mesotrophic lake'),
    po4: estimated(0.02, 'mesotrophic lake'),
    sio2: estimated(5, 'lake water'),
    ca: estimated(20, 'lake water'),
    docMgC: estimated(4, 'lake water'),
    inoculum: {
      heterotroph: lakeBacteria,
      aob: estimated(1e3, 'natural fresh water'),
      nob: estimated(1e3, 'natural fresh water'),
      denitrifier: estimated(1e2, 'aerobic lake water'),
    },
  },
  pond: {
    id: 'pond',
    nameZh: '池塘水',
    kind: 'wild',
    salinityPpt: NONE,
    kh: estimated(3, 'freshwater pond'),
    tan: estimated(0.1, 'freshwater pond'),
    no3: estimated(1, 'freshwater pond'),
    po4: estimated(0.1, 'freshwater pond'),
    sio2: estimated(5, 'freshwater pond'),
    ca: estimated(30, 'freshwater pond'),
    docMgC: estimated(10, 'productive pond'),
    inoculum: {
      heterotroph: estimated(3e6, 'productive pond, above lake abundance'),
      aob: estimated(1e3, 'natural fresh water'),
      nob: estimated(1e3, 'natural fresh water'),
      denitrifier: estimated(1e3, 'natural fresh water with sediment contact'),
    },
  },
  blackwater: {
    id: 'blackwater',
    nameZh: '黑水',
    kind: 'wild',
    salinityPpt: NONE,
    kh: derived(0.5, 'biotopeAquarium', 'midpoint of blackwater KH 0–1'),
    tan: estimated(0.05, 'nutrient-poor blackwater'),
    no3: estimated(0.1, 'nutrient-poor blackwater'),
    po4: estimated(0.01, 'nutrient-poor blackwater'),
    sio2: estimated(3, 'blackwater'),
    ca: estimated(2, 'very soft water'),
    docMgC: estimated(25, 'tannin-rich blackwater'),
    inoculum: {
      heterotroph: lakeBacteria,
      aob: estimated(1e2, 'acidic water inhibits nitrifiers'),
      nob: estimated(1e2, 'acidic water inhibits nitrifiers'),
      denitrifier: estimated(1e2, 'aerobic water'),
    },
  },
  spring: {
    id: 'spring',
    nameZh: '泉水',
    kind: 'wild',
    salinityPpt: NONE,
    kh: estimated(12, 'karst spring'),
    tan: NONE,
    no3: estimated(1, 'groundwater'),
    po4: estimated(0.01, 'groundwater'),
    sio2: estimated(10, 'groundwater'),
    ca: estimated(80, 'hard karst water'),
    docMgC: estimated(0.5, 'groundwater'),
    inoculum: {
      heterotroph: estimated(1e5, 'oligotrophic groundwater'),
      aob: estimated(10, 'groundwater'),
      nob: estimated(10, 'groundwater'),
    },
  },
  estuary: {
    id: 'estuary',
    nameZh: '河口水',
    kind: 'wild',
    salinityPpt: estimated(15, 'mid-estuary'),
    kh: estimated(6, 'mixed river and seawater'),
    tan: estimated(0.1, 'estuary'),
    no3: estimated(0.5, 'estuary'),
    po4: estimated(0.05, 'estuary'),
    sio2: estimated(4, 'estuary'),
    ca: estimated(180, 'mixed river and seawater'),
    docMgC: estimated(4, 'between river and seawater'),
    inoculum: {
      heterotroph: estimated(3e6, 'productive estuary'),
      aob: estimated(1e3, 'estuary'),
      nob: estimated(1e3, 'estuary'),
      denitrifier: estimated(1e3, 'estuary'),
    },
  },
  seawater: {
    id: 'seawater',
    nameZh: '天然海水',
    kind: 'wild',
    salinityPpt: estimated(35, 'mean ocean salinity'),
    kh: estimated(7, 'natural seawater alkalinity'),
    tan: estimated(0.01, 'coastal seawater'),
    no3: estimated(0.1, 'coastal seawater'),
    po4: estimated(0.02, 'coastal seawater'),
    sio2: estimated(1, 'coastal seawater'),
    ca: estimated(412, 'mean seawater calcium'),
    docMgC: derived(1.2, 'seawaterDoc', '40–165 µM × 0.012 mg C/µmol, midpoint'),
    inoculum: {
      heterotroph: estimated(1e6, 'coastal seawater bacterioplankton'),
      aob: estimated(1e3, 'coastal seawater'),
      nob: estimated(1e3, 'coastal seawater'),
      denitrifier: estimated(100, 'coastal seawater'),
    },
  },
};

/** Synthetic sea salt dissolved to 35 ppt; scales linearly with salinity. */
export const SEA_SALT_MIX = {
  khAt35Ppt: estimated(8, 'typical commercial reef salt mix'),
  caAt35Ppt: estimated(420, 'typical commercial reef salt mix'),
} as const;

/** Wet deposition: inorganic nitrogen in rainwater, mg N/L. */
export const RAIN_CHEMISTRY = {
  ammoniumN: derived(0.25, 'rainNitrogenThailand', 'rural Thai rain, ammonium ≈ nitrate'),
  nitrateN: measured(0.25, 'rainNitrogenThailand'),
} as const;
