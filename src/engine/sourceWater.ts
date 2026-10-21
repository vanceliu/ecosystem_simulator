import type { MicrobeId } from '../content/microbes';
import {
  COD_PER_ORGANIC_CARBON,
  LABILE_DOC_FRACTION,
  SEA_SALT_MIX,
  WATER_SOURCES,
} from '../content/waterSources';
import type { TankConfig } from './types';

const SEA_SALT_REFERENCE_PPT = 35;

/** Per-litre composition of the water filling the tank; docs/04 §3. */
export interface WaterComposition {
  readonly salinityPpt: number;
  /** fraction of the fill that is source water; the rest is RO water */
  readonly sourceFraction: number;
  readonly kh: number;
  readonly tan: number;
  readonly no3: number;
  readonly po4: number;
  readonly sio2: number;
  readonly ca: number;
  /** mg COD/L readily degradable */
  readonly labileCod: number;
  /** mg COD/L refractory humic matter */
  readonly refractoryCod: number;
  /** cells/mL */
  readonly inoculum: Readonly<Partial<Record<MicrobeId, number>>>;
}

/**
 * Salt water sources are diluted with RO water down to the target salinity; any salinity the
 * source cannot supply comes from synthetic sea salt.
 */
export function waterComposition(config: TankConfig): WaterComposition {
  const source = WATER_SOURCES[config.waterSource];
  const sourceSalinity = source.salinityPpt.value;
  const target = Math.max(0, config.salinityPpt);
  const sourceFraction = sourceSalinity > 0 ? Math.min(1, target / sourceSalinity) : 1;
  const addedSalt = Math.max(0, target - sourceSalinity * sourceFraction);
  const saltShare = addedSalt / SEA_SALT_REFERENCE_PPT;
  const doc = source.docMgC.value * COD_PER_ORGANIC_CARBON.value * sourceFraction;
  const inoculum: Partial<Record<MicrobeId, number>> = {};
  for (const [id, cells] of Object.entries(source.inoculum) as [MicrobeId, { value: number }][]) {
    inoculum[id] = cells.value * sourceFraction;
  }
  return {
    salinityPpt: target,
    sourceFraction,
    kh: source.kh.value * sourceFraction + SEA_SALT_MIX.khAt35Ppt.value * saltShare,
    tan: source.tan.value * sourceFraction,
    no3: source.no3.value * sourceFraction,
    po4: source.po4.value * sourceFraction,
    sio2: source.sio2.value * sourceFraction,
    ca: source.ca.value * sourceFraction + SEA_SALT_MIX.caAt35Ppt.value * saltShare,
    labileCod: doc * LABILE_DOC_FRACTION.value,
    refractoryCod: doc * (1 - LABILE_DOC_FRACTION.value),
    inoculum,
  };
}
