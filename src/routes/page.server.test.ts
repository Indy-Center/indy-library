import { describe, expect, it } from 'vitest';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { AUTHOR_CID } from '$lib/testing/fixtures';
import { load } from './+page.server';

const student = session('1000002');
const author = session(AUTHOR_CID);
const admin = session('1000003', ['training:admin']);
const lead = session('1000004', ['training:lead']);

describe('/ (course list)', () => {
	it('lists every course with a current version', async () => {
		const lib = library();
		const data = await run(load, lib.event(student, '/'));

		expect(data.courses).toEqual([
			{ code: 'S-GC', title: 'Ground Control', hasCurrent: true, draft: null },
			{ code: 'A-LC', title: 'Local Control', hasCurrent: true, draft: null }
		]);
	});

	it('does not list a course with no current version', async () => {
		const lib = library();
		const data = await run(load, lib.event(student, '/'));

		expect(data.courses.map((c) => c.code)).not.toContain('X-NEW');
	});

	it('sends the CMS the library credential', async () => {
		const lib = library();
		await run(load, lib.event(student, '/'));

		expect(lib.cms.authorizations).toEqual(['Bearer test-token']);
	});

	it("shows a course's authors its drafts, including a course with only a draft", async () => {
		const data = await run(load, library().event(author, '/'));

		expect(data.courses).toEqual([
			{ code: 'S-GC', title: 'Ground Control', hasCurrent: true, draft: 2 },
			{ code: 'A-LC', title: 'Local Control', hasCurrent: true, draft: null },
			{ code: 'X-NEW', title: 'Unreleased Course', hasCurrent: false, draft: 1 }
		]);
	});

	it('shows the Training Admin and lead instructors every draft', async () => {
		for (const reader of [admin, lead]) {
			const data = await run(load, library().event(reader, '/'));
			expect(data.courses.map((c) => [c.code, c.draft])).toEqual([
				['S-GC', 2],
				['A-LC', null],
				['X-NEW', 1]
			]);
		}
	});
});
