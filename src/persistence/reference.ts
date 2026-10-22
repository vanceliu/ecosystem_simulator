import type { LeafRow } from '../content/parameterTree';
import type { ArchetypeRow, ArchetypeTagRow, ReferenceRows } from '../content/parameters';
import type { SubstanceSpec } from '../content/substances';

/** Runs one read-only SQL statement and returns its rows. */
export type QueryRows = (sql: string) => readonly Record<string, unknown>[];

const text = (value: unknown): string => (typeof value === 'string' ? value : String(value));
const optionalText = (value: unknown): string | null =>
  value === null || value === undefined ? null : text(value);
const optionalNumber = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

const LEAF_COLUMNS = 'kind, num, txt, basis, source_id, derivation, note';

function leaf(row: Record<string, unknown>, path: unknown): LeafRow {
  return {
    path: text(path),
    kind: text(row.kind) as LeafRow['kind'],
    num: optionalNumber(row.num),
    txt: optionalText(row.txt),
    basis: optionalText(row.basis) as LeafRow['basis'],
    sourceId: optionalText(row.source_id),
    derivation: optionalText(row.derivation),
    note: optionalText(row.note),
  };
}

/** Reads every ref_ table (docs/10 §2.1). */
export function readReferenceRows(query: QueryRows): ReferenceRows {
  return {
    sources: query('SELECT id, title, url FROM ref_source ORDER BY id').map((row) => ({
      id: text(row.id),
      title: text(row.title),
      url: optionalText(row.url),
    })),
    substances: query(
      'SELECT id, name_zh, medium, form, unit, element FROM ref_substance ORDER BY position',
    ).map((row): SubstanceSpec => ({
      id: text(row.id) as SubstanceSpec['id'],
      nameZh: text(row.name_zh),
      medium: text(row.medium) as SubstanceSpec['medium'],
      form: optionalText(row.form) as SubstanceSpec['form'],
      unit: text(row.unit),
      element: optionalText(row.element) as SubstanceSpec['element'],
    })),
    params: query(`SELECT id, ${LEAF_COLUMNS} FROM ref_param ORDER BY rowid`).map((row) =>
      leaf(row, row.id),
    ),
    archetypes: query(
      'SELECT id, name_zh, layer, zone, kind, category, metabolic_class, latin_stem, noun_zh, position FROM ref_archetype ORDER BY position',
    ).map((row): ArchetypeRow => ({
      id: text(row.id),
      nameZh: text(row.name_zh),
      layer: text(row.layer),
      zone: text(row.zone),
      kind: text(row.kind),
      category: text(row.category),
      metabolicClass: text(row.metabolic_class),
      latinStem: text(row.latin_stem),
      nounZh: text(row.noun_zh),
      position: Number(row.position),
    })),
    archetypeParams: query(
      `SELECT archetype_id, param_id, ${LEAF_COLUMNS} FROM ref_archetype_param ORDER BY rowid`,
    ).map((row) => ({ ...leaf(row, row.param_id), archetypeId: text(row.archetype_id) })),
    archetypeTags: query(
      'SELECT archetype_id, tag, position, item, value, weight FROM ref_archetype_tag ORDER BY rowid',
    ).map((row): ArchetypeTagRow => ({
      archetypeId: text(row.archetype_id),
      tag: text(row.tag),
      position: Number(row.position),
      item: Number(row.item),
      value: text(row.value),
      weight: optionalNumber(row.weight),
    })),
  };
}
