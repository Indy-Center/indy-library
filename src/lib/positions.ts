/**
 * A scenario's position as a page shows it: the vNAS id the scenario names (`Position`'s
 * `positionId`), with the callsign and whether it is retired from the catalogue. A position the
 * catalogue lacks has its id for a callsign and is not retired; `Position` shows that alone.
 */
export type ShownPosition = { id: string; callsign: string; retired: boolean };
