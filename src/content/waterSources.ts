import type { MicrobeId } from './microbes';
import type { Sourced } from './sourced';

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
