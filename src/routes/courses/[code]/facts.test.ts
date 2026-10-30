import { describe, expect, it } from 'vitest';
import { AUTHOR_CID } from '$lib/testing/fixtures';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load } from './+page.server';

const student = session('1000002');

function page(href: string, code: string, reader = student) {
	return run(load, library().event(reader, href, { code }));
}

describe('/courses/[code] facts', () => {
	it('names each prerequisite row, a row with several credentials being "one of"', async () => {
		const { facts } = await page('/courses/S-GC', 'S-GC');

		expect(facts.prerequisites).toEqual([
			[
				{
					code: 'X-OBS',
					name: 'Made-up observer endorsement',
					kind: 'endorsement',
					retired: false
				},
				{ code: 'X-OLD', name: 'Made-up retired endorsement', kind: 'endorsement', retired: true }
			],
			[{ code: 'X-GONE', name: null, kind: null, retired: false }]
		]);
	});

	it('gives the prerequisites note and the credential finishing earns', async () => {
		const { facts } = await page('/courses/S-GC', 'S-GC');

		expect(facts.note).toBe('Read the made-up policy first.');
		expect(facts.issues).toEqual({
			code: 'S-GC',
			name: 'Made-up ground certification',
			kind: 'certification',
			retired: false
		});
	});

	it('holds nothing for a course that sets none', async () => {
		const { facts } = await page('/courses/A-LC', 'A-LC');

		expect(facts).toEqual({
			prerequisites: [],
			note: null,
			issues: null,
			academyExam: null,
			estimatedWeeks: null,
			consolidation: null,
			ratingExam: null,
			moodleUrl: null
		});
	});

	it('gives every fact a course sets, and the completion standard as written', async () => {
		const { facts, version } = await page('/courses/S-GC', 'S-GC');

		expect(facts).toMatchObject({
			academyExam: 'S2',
			estimatedWeeks: { min: 4, max: 8 },
			consolidation: { hours: 10, positionTypes: ['DEL', 'GND'] },
			ratingExam: 'S1',
			moodleUrl: 'https://moodle.example.com/course/1'
		});
		expect(version.completionStandard).toBe(
			'Pass every lesson plan.\nThen sit the made-up review.'
		);
	});

	it('gives equal weeks as min and max alike', async () => {
		const { facts } = await page('/courses/X-NEW?version=draft', 'X-NEW', session(AUTHOR_CID));

		expect(facts.estimatedWeeks).toEqual({ min: 6, max: 6 });
	});

	it('sends no completion standard when it is blank', async () => {
		const { version } = await page('/courses/A-LC', 'A-LC');

		expect(version.completionStandard).toBeNull();
	});

	it("shows the draft's own completion standard and the estimated length", async () => {
		const draft = await page('/courses/S-GC?version=draft', 'S-GC', session(AUTHOR_CID));

		expect(draft.version.completionStandard).toBe('Pass every lesson plan, rewritten.');
		expect(draft.facts.estimatedWeeks).toEqual({ min: 4, max: 8 });
	});

	it('sends only what the page draws', async () => {
		const data = await page('/courses/S-GC', 'S-GC');

		expect(JSON.stringify(data.facts)).not.toContain('Works the ground');
		expect(JSON.stringify(data.facts)).not.toContain('grantedOnArrival');
	});

	it('shows the draft the same facts', async () => {
		const current = await page('/courses/S-GC', 'S-GC');
		const draft = await page('/courses/S-GC?version=draft', 'S-GC', session(AUTHOR_CID));

		expect(draft.version.isDraft).toBe(true);
		expect(draft.facts.prerequisites).toEqual(current.facts.prerequisites);
		expect(draft.facts.issues).toEqual(current.facts.issues);
	});
});
