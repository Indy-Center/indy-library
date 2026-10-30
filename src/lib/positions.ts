/**
 * A scenario's position as a page shows it: the vNAS id (`Position`'s `positionId`) and callsign
 * the scenario names, and whether the catalogue marks it retired. A position the catalogue lacks
 * is not retired; `Position` shows its callsign alone.
 */
export type ShownPosition = { id: string; callsign: string; retired: boolean };
