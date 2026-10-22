import type { OceanRegion, RealmCode } from './location';
import type { SourceId } from './sources';

export interface NativeRange {
  /** terrestrial and freshwater realms */
  readonly realms: readonly RealmCode[];
  /** marine regions */
  readonly oceans: readonly OceanRegion[];
  readonly basis: 'measured' | 'estimated';
  readonly source?: SourceId;
}
