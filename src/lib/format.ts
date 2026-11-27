/** Minutes as a reader would say them: "45 min", "2 h", "1 h 30 min". */
export function duration(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h === 0) return `${m} min`;
	if (m === 0) return `${h} h`;
	return `${h} h ${m} min`;
}

/** A course's length: "6 weeks", or "4–8 weeks" for a range. */
export function weeks(range: { min: number; max: number }): string {
	return range.min === range.max ? `${range.min} weeks` : `${range.min}–${range.max} weeks`;
}

/** A count with its noun: "1 task", "2 tasks". */
export function count(n: number, noun: string): string {
	return `${n} ${noun}${n === 1 ? '' : 's'}`;
}
