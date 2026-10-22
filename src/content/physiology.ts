import type { Sourced } from './sourced';

/** Body elemental composition per dry mass (docs/04 §3.2). */
export interface BodyComposition {
  readonly nPerDryMass: Sourced;
  readonly pPerDryMass: Sourced;
}

export type ConsumerClass = 'protist' | 'invertebrate' | 'fish' | 'amphibian' | 'reptile';

/** r = r0 × M^exponent × Q10^((T−20)/10); r in d⁻¹ of body COD, M in mg dry mass (docs/04 §5.4). */
export interface MetabolicScaling {
  readonly r0: Sourced;
  readonly exponent: Sourced;
}

export type FoodClass = 'detritus' | 'feed' | 'plant' | 'microbe' | 'animal';
