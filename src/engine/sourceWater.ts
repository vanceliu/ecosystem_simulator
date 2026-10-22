import type { MicrobeId } from '../content/microbes';
import type { ParameterSet } from '../content/parameters';
import type { StateSubstanceId } from '../content/substances';
import type { TankConfig } from './types';

const MG_PER_G = 1000;

/** Per-litre composition of the water filling the tank; docs/04 §3. */
export interface WaterComposition {
  readonly salinityPpt: number;
  /** fraction of the fill that is source water; the rest is RO water */
  readonly sourceFraction: number;
  /** mg per litre of fill by substance; water_o2, water_co2 and water_no2 are set separately */
  readonly perLitre: Readonly<Partial<Record<StateSubstanceId, number>>>;
  /** cells/mL */
  readonly inoculum: Readonly<Partial<Record<MicrobeId, number>>>;
}

/**
 * Salt water sources are diluted with RO water down to the target salinity; any salinity the
 * source cannot supply comes from synthetic sea salt.
 */
export function waterComposition(params: ParameterSet, config: TankConfig): WaterComposition {
  const sources = params.waterSources;
  const source = sources.sources[config.waterSource];
  const sourceSalinity = source.salinityPpt.value;
  const target = Math.max(0, config.salinityPpt);
  const sourceFraction = sourceSalinity > 0 ? Math.min(1, target / sourceSalinity) : 1;
  const addedSalt = Math.max(0, target - sourceSalinity * sourceFraction);
  const saltShare = addedSalt / params.physics.seaSaltReferencePpt.value;
  const doc = source.docMgC.value * sources.codPerOrganicCarbon.value * sourceFraction;
  const inoculum: Partial<Record<MicrobeId, number>> = {};
  for (const [id, cells] of Object.entries(source.inoculum) as [MicrobeId, { value: number }][]) {
    inoculum[id] = cells.value * sourceFraction;
  }
  const kh = source.kh.value * sourceFraction + sources.seaSaltMix.khAt35Ppt.value * saltShare;
  return {
    salinityPpt: target,
    sourceFraction,
    perLitre: {
      water_salt: target * MG_PER_G,
      water_alkalinity: kh * params.stoichiometry.base.caco3PerDkh.value,
      water_tan: source.tan.value * sourceFraction,
      water_no3: source.no3.value * sourceFraction,
      water_po4: source.po4.value * sourceFraction,
      water_sio2: source.sio2.value * sourceFraction,
      water_ca: source.ca.value * sourceFraction + sources.seaSaltMix.caAt35Ppt.value * saltShare,
      water_substrate: doc * sources.labileDocFraction.value,
      inert_cod: doc * (1 - sources.labileDocFraction.value),
    },
    inoculum,
  };
}
