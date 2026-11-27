import { describe, expect, it } from 'vitest';
import { SECTIONS } from './nav';

describe('SECTIONS', () => {
	it('is Courses alone', () => {
		expect(SECTIONS.map(({ label, href }) => [label, href])).toEqual([['Courses', '/']]);
	});
});
