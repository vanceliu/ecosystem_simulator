import { boundaryCases, describeBoundaryYear } from './boundary';

describeBoundaryYear(
  'temperate continental',
  boundaryCases({
    zone: 'temperate',
    moisture: 'humid',
    continentality: 'continental',
    habitat: 'lake',
    realm: 'NA',
  }),
);
