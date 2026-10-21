import { boundaryCases, describeBoundaryYear } from './boundary';

describeBoundaryYear(
  'tropical',
  boundaryCases({ zone: 'tropical', moisture: 'humid', habitat: 'lake', realm: 'NT' }),
);
