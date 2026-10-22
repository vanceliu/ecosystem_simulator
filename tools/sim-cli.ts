import { parseArgs } from 'node:util';
import { ARCHETYPE_IDS, type ArchetypeId } from '../src/content/archetypeIds';
import type { HabitatId } from '../src/content/habitats';
import type { ParameterSet } from '../src/content/parameters';
import {
  archetypeOf,
  computeGeometry,
  createInitialState,
  freeAmmoniaMgL,
  populationCod,
  populationSize,
  step,
  totalNitrogen,
  totalPhosphorus,
  waterPh,
} from '../src/engine/index';
import type { Command, SimEvent, SimulationState, TankConfig } from '../src/engine/types';
import { recommendTankConfig, representativeLocation } from '../src/game/setup';
import { commonName, rarityScore, rarityTier, scientificName } from '../src/generation/index';
import { loadParameterSet } from './reference-node';

/** CLI presets: indoor tropical tanks filled and furnished from the wild (docs/00 M3). */
const PRESETS: Readonly<Record<string, { habitat: HabitatId; overrides: Partial<TankConfig> }>> = {
  freshwater: { habitat: 'stream', overrides: { waterSource: 'pond' } },
  brackish: { habitat: 'mangrove', overrides: { waterSource: 'estuary' } },
  marine: { habitat: 'coral_reef', overrides: { waterSource: 'seawater' } },
  rainforest: { habitat: 'rainforest_floor', overrides: {} },
};

const USAGE =
  'npm run sim -- --seed <text> --days <n> --preset <freshwater|brackish|marine|rainforest> ' +
  '[--feed <mg/day>] [--every <days>] [--light <µmol>] [--release <archetype[:count]@day>]...';

interface Release {
  readonly archetypeId: ArchetypeId;
  readonly count: number;
  readonly day: number;
}

function parseRelease(text: string): Release {
  const match = /^([a-z_]+)(?::(\d+))?@(\d+)$/.exec(text);
  const id = match?.[1];
  if (match === null || id === undefined || !(ARCHETYPE_IDS as readonly string[]).includes(id))
    throw new Error(`Invalid --release ${text}; expected archetype[:count]@day`);
  return { archetypeId: id as ArchetypeId, count: Number(match[2] ?? 5), day: Number(match[3]) };
}

function presetConfig(params: ParameterSet, name: string): TankConfig {
  const preset = PRESETS[name];
  if (preset === undefined) throw new Error(`Unknown preset ${name}\n${USAGE}`);
  const location = representativeLocation(params, {
    hemisphere: 'north',
    latitudeZone: 'tropical',
    altitudeBand: 'lowland',
    moisture: 'humid',
    continentality: 'maritime',
    habitat: preset.habitat,
    realm: 'IM',
  });
  const wild = { origin: 'wild', realm: 'IM' } as const;
  const base = recommendTankConfig(params, location, 'indoor');
  return {
    ...base,
    waterRealm: 'IM',
    substrateSource: wild,
    landSubstrateSource: wild,
    hardscape: base.hardscape.map((item) => ({ ...item, source: wild })),
    ...preset.overrides,
  };
}

const format = (value: number, digits = 2): string =>
  Math.abs(value) >= 1e4 || (value !== 0 && Math.abs(value) < 1e-2)
    ? value.toExponential(1)
    : value.toFixed(digits);

function speciesLabel(params: ParameterSet, speciesId: string): string {
  const archetype = archetypeOf(params, speciesId);
  const rarity = rarityTier(params, rarityScore(params, archetype, speciesId));
  return `${commonName(params, archetype, speciesId)} ${scientificName(params, archetype, speciesId)} [${rarity}]`;
}

function report(params: ParameterSet, state: SimulationState, day: number): string {
  const water = state.water;
  const substances = state.substances;
  const volume = water.volumeL;
  const lines: string[] = [];
  const perL = (mg: number): string => format(volume > 0 ? mg / volume : 0);
  lines.push(
    `── day ${day} ── water ${format(water.temperatureC, 1)} °C ` +
      `pH ${format(waterPh(params, state))} O2 ${perL(substances.water_o2)} ` +
      `TAN ${perL(substances.water_tan)} NH3 ${format(freeAmmoniaMgL(params, state), 3)} ` +
      `NO2 ${perL(substances.water_no2)} NO3 ${perL(substances.water_no3)} ` +
      `PO4 ${perL(substances.water_po4)} mg/L · ` +
      `detritus ${perL(substances.detritus_cod)} mg COD/L · ` +
      `populations ${state.populations.length} · cycle ${state.tracking.cycleStatus}`,
  );
  const levels = state.records.trophicLevels;
  const rows = state.populations
    .map((population) => ({
      population,
      level: levels[population.speciesId] ?? 1,
      cod: populationCod(params, population),
    }))
    .sort((a, b) => b.level - a.level || b.cod - a.cod);
  for (const { population, level, cod } of rows) {
    const archetype = params.archetypes[population.archetypeId];
    const size =
      population.kind === 'cohort'
        ? `${format(populationSize(params, population), 1)} ind`
        : `${format(cod)} mg COD`;
    const cohorts = population.kind === 'cohort' ? ` cohorts ${population.cohorts.length}` : '';
    const established = population.establishedTick === null ? '' : ' ✓';
    lines.push(
      `  TL ${level.toFixed(1)} ${archetype.layer.padEnd(4)} ${archetype.nameZh} · ` +
        `${speciesLabel(params, population.speciesId)} · ${size}${cohorts}${established}`,
    );
  }
  return lines.join('\n');
}

function describeEvent(params: ParameterSet, event: SimEvent): string {
  const day = Math.floor(event.tick / 24);
  const subject = event.speciesId === undefined ? '' : ` ${speciesLabel(params, event.speciesId)}`;
  const detail = event.detail === undefined ? '' : ` (${event.detail})`;
  return `  d${day} [${event.level}] ${event.type}${subject}${detail}`;
}

async function main(): Promise<void> {
  const params = await loadParameterSet();
  const { values } = parseArgs({
    options: {
      seed: { type: 'string', default: 'cli' },
      days: { type: 'string', default: '60' },
      preset: { type: 'string', default: 'freshwater' },
      feed: { type: 'string', default: '0' },
      every: { type: 'string', default: '10' },
      light: { type: 'string' },
      release: { type: 'string', multiple: true, default: [] },
    },
  });
  const days = Number(values.days);
  const every = Math.max(1, Number(values.every));
  const feedMg = Number(values.feed);
  const releases = values.release.map(parseRelease);
  const preset = presetConfig(params, values.preset);
  const config =
    values.light === undefined ? preset : { ...preset, lightPpfd: Number(values.light) };
  const geometry = computeGeometry(params, config);
  let state = createInitialState(params, config, values.seed);
  const initialN = totalNitrogen(params, state);
  const initialP = totalPhosphorus(params, state);
  const out: string[] = [
    `seed ${values.seed} · preset ${values.preset} · ${config.lengthCm}×${config.widthCm}×${config.heightCm} cm · ` +
      `water ${format(geometry.nominalWaterVolumeL, 0)} L · land ${format(geometry.landAreaM2, 3)} m² · ` +
      `source ${config.waterSource} · feed ${feedMg} mg/day`,
    report(params, state, 0),
  ];
  const events: SimEvent[] = [];
  const quiet = new Set(['equinox']);
  for (let day = 0; day < days; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      const commands: Command[] = [];
      if (feedMg > 0 && hour === 9) commands.push({ type: 'feed', dryMassMg: feedMg });
      if (hour === 10)
        for (const entry of releases)
          if (entry.day === day)
            commands.push({ type: 'release', archetypeId: entry.archetypeId, count: entry.count });
      const result = step(params, state, commands);
      state = result.state;
      events.push(...result.events.filter((event) => !quiet.has(event.type)));
    }
    if ((day + 1) % every === 0 || day + 1 === days) {
      out.push(report(params, state, day + 1));
      out.push(...events.map((event) => describeEvent(params, event)));
      events.length = 0;
    }
  }
  const ledger = state.ledger;
  const nError = totalNitrogen(params, state) - (initialN + ledger.nIn - ledger.nOut);
  const pError = totalPhosphorus(params, state) - (initialP + ledger.pIn - ledger.pOut);
  out.push(
    `mass balance: N error ${nError.toExponential(2)} mg, P error ${pError.toExponential(2)} mg · ` +
      `species seen ${Object.keys(state.species).length}`,
  );
  process.stdout.write(`${out.join('\n')}\n`);
}

await main();
