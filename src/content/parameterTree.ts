import type { Sourced } from './sourced';

/** One leaf of a reference-data tree (ref_param / ref_archetype_param row). */
export interface LeafRow {
  readonly path: string;
  readonly kind: 'number' | 'text' | 'boolean' | 'null' | 'empty_array' | 'empty_object';
  readonly num: number | null;
  readonly txt: string | null;
  readonly basis: 'measured' | 'derived' | 'estimated' | null;
  readonly sourceId: string | null;
  readonly derivation: string | null;
  readonly note: string | null;
}

type Tree = Record<string, unknown>;

function leafValue(row: LeafRow): unknown {
  switch (row.kind) {
    case 'null':
      return null;
    case 'empty_array':
      return [];
    case 'empty_object':
      return {};
    case 'text':
      return row.txt ?? '';
    case 'boolean':
      return row.num === 1;
    case 'number':
      return row.basis === null ? (row.num ?? 0) : sourcedValue(row);
  }
}

function sourcedValue(row: LeafRow): Sourced {
  const value = row.num ?? 0;
  const source = row.sourceId;
  switch (row.basis) {
    case 'measured':
      return { value, basis: 'measured', source: source ?? '' };
    case 'derived':
      return {
        value,
        basis: 'derived',
        source: source ?? '',
        derivation: row.derivation ?? '',
      };
    default:
      return source === null
        ? { value, basis: 'estimated', note: row.note ?? '' }
        : { value, basis: 'estimated', note: row.note ?? '', source };
  }
}

/** Objects whose keys are exactly 0..n−1 become arrays. */
function toArrays(node: unknown): unknown {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return node;
  if (isSourcedLike(node)) return node;
  const entries = Object.entries(node as Tree).map(
    ([key, child]) => [key, toArrays(child)] as const,
  );
  const indices = entries.every(([key]) => /^\d+$/.test(key));
  if (indices && entries.length > 0) {
    const array: unknown[] = [];
    for (const [key, child] of entries) array[Number(key)] = child;
    if (array.length === entries.length) return array;
  }
  return Object.fromEntries(entries);
}

const isSourcedLike = (node: object): boolean => 'basis' in node && 'value' in node;

/** Rebuilds nested objects from dotted-path leaves. */
export function nestLeaves(rows: readonly LeafRow[]): Record<string, unknown> {
  const root: Tree = {};
  for (const row of rows) {
    const keys = row.path.split('.');
    let node = root;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        node[key] = leafValue(row);
        return;
      }
      const child = node[key];
      if (child === undefined || child === null || typeof child !== 'object') node[key] = {};
      node = node[key] as Tree;
    });
  }
  return toArrays(root) as Record<string, unknown>;
}
