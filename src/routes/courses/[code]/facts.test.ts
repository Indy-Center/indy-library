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

		expect(facts).toEqual({ prerequisites: [], note: null, issues: null });
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
		expect(draft.facts).toEqual(current.facts);
	});
});
