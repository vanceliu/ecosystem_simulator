import { boundaryCases, describeBoundaryYear } from './boundary';

describeBoundaryYear(
  'polar',
  boundaryCases({ zone: 'polar', moisture: 'humid', habitat: 'lake', realm: 'PA' }),
);
