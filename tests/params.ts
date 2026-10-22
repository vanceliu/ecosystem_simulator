import { loadParameterSet } from '../tools/reference-node';

/** Parameter set read from db/reference through SQLite, shared by all tests. */
export const params = await loadParameterSet();
