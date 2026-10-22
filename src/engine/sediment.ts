import type { ParameterSet } from '../content/parameters';
import { waterConcentration, type BioContext } from './bioContext';
import type { PoolKey, Process } from './fluxes';

const LITRES_PER_M2_CM = 10;

/** Porewater volume of the aquatic substrate, L. */
export function porewaterLitres(context: BioContext): number {
  const config = context.state.config;
  if (config.substrate === 'bare') return 0;
  return (
    context.space.geometry.waterFloorAreaM2 *
    config.substrateDepthCm *
    LITRES_PER_M2_CM *
    context.params.physiology.sediment.porosity.value
  );
}

/** Porewater concentration of a substrate pool, mg/L. */
export function porewaterConcentration(context: BioContext, key: PoolKey): number {
  const litres = porewaterLitres(context);
  if (litres <= 0) return 0;
  return (
    (Math.max(0, context.pools.get(key) ?? 0) *
      context.params.physiology.sediment.porewaterShare.value) /
    litres
  );
}

/** docs/04 §5.3 (Carignan 1982): share of uptake drawn through roots from porewater. */
export function rootShare(params: ParameterSet, porewater: number, water: number): number {
  const sediment = params.physiology.sediment;
  if (porewater <= 0) return 0;
  if (water <= 0) return sediment.rootShareA.value / 100;
  const ratio = porewater / water;
  return (
    sediment.rootShareA.value /
    (1 + sediment.rootShareB.value * Math.pow(ratio, sediment.rootShareC.value)) /
    100
  );
}

/** docs/04 §5.3 porewater ↔ water exchange of ammonium and phosphate; mg per dtDays. */
export function sedimentExchange(context: BioContext): Process[] {
  const litres = porewaterLitres(context);
  if (litres <= 0 || !context.media.hasWater) return [];
  const sediment = context.params.physiology.sediment;
  const processes: Process[] = [];
  for (const [sedimentKey, waterKey, rate] of [
    ['sediment_tan', 'water_tan', sediment.exchangeTan.value],
    ['sediment_po4', 'water_po4', sediment.exchangePo4.value],
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
