import { SEDIMENT } from '../content/physiology';
import { waterConcentration, type BioContext } from './bioContext';
import type { Process } from './fluxes';
import { POOL } from './pools';

const LITRES_PER_M2_CM = 10;

/** Porewater volume of the aquatic substrate, L. */
export function porewaterLitres(context: BioContext): number {
  const config = context.state.config;
  if (config.substrate === 'bare') return 0;
  return (
    context.space.geometry.waterFloorAreaM2 *
    config.substrateDepthCm *
    LITRES_PER_M2_CM *
    SEDIMENT.porosity.value
  );
}

/** Porewater concentration of a substrate pool, mg/L. */
export function porewaterConcentration(context: BioContext, key: string): number {
  const litres = porewaterLitres(context);
  if (litres <= 0) return 0;
  return (Math.max(0, context.pools.get(key) ?? 0) * SEDIMENT.porewaterShare.value) / litres;
}

/** docs/04 §5.3 (Carignan 1982): share of uptake drawn through roots from porewater. */
export function rootShare(porewater: number, water: number): number {
  if (porewater <= 0) return 0;
  if (water <= 0) return SEDIMENT.rootShareA.value / 100;
  const ratio = porewater / water;
  return (
    SEDIMENT.rootShareA.value /
    (1 + SEDIMENT.rootShareB.value * Math.pow(ratio, SEDIMENT.rootShareC.value)) /
    100
  );
}

/** docs/04 §5.3 porewater ↔ water exchange of ammonium and phosphate; mg per dtDays. */
export function sedimentExchange(context: BioContext): Process[] {
  const litres = porewaterLitres(context);
  if (litres <= 0 || !context.media.hasWater) return [];
  const processes: Process[] = [];
  for (const [sedimentKey, waterKey, rate] of [
    [POOL.sedimentTan, POOL.tan, SEDIMENT.exchangeTan.value],
    [POOL.sedimentPo4, POOL.po4, SEDIMENT.exchangePo4.value],
  ] as const) {
    const gradient =
      porewaterConcentration(context, sedimentKey) - waterConcentration(context, waterKey);
    const flux = rate * gradient * litres * context.dtDays;
    if (flux === 0) continue;
    const [from, to] = flux > 0 ? [sedimentKey, waterKey] : [waterKey, sedimentKey];
    processes.push({
      name: `sediment_exchange:${waterKey}`,
      rate: Math.abs(flux),
      stoichiometry: { [from]: -1, [to]: 1 },
    });
  }
  return processes;
}
