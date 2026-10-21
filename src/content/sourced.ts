import type { SourceId } from './sources';

export type Basis = 'measured' | 'derived' | 'estimated';

export type Sourced =
  | { readonly value: number; readonly basis: 'measured'; readonly source: SourceId }
  | {
      readonly value: number;
      readonly basis: 'derived';
      readonly source: SourceId;
      readonly derivation: string;
    }
  | {
      readonly value: number;
      readonly basis: 'estimated';
      readonly source?: SourceId;
      readonly note: string;
    };

export const measured = (value: number, source: SourceId): Sourced => ({
  value,
  basis: 'measured',
  source,
});

export const derived = (value: number, source: SourceId, derivation: string): Sourced => ({
  value,
  basis: 'derived',
  source,
  derivation,
});

export const estimated = (value: number, note: string, source?: SourceId): Sourced =>
  source === undefined
    ? { value, basis: 'estimated', note }
    : { value, basis: 'estimated', note, source };

export function isSourced(candidate: unknown): candidate is Sourced {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'value' in candidate &&
    'basis' in candidate &&
    typeof (candidate as { value: unknown }).value === 'number'
  );
}
