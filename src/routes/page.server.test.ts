import { describe, expect, it } from 'vitest';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load } from './+page.server';

const student = session('1000002');

describe('/ (course list)', () => {
	it('lists every course with a current version', async () => {
		const lib = library();
		const data = await run(load, lib.event(student, '/'));

		expect(data.courses.map((c) => [c.code, c.title])).toEqual([
			['S-GC', 'Ground Control'],
			['A-LC', 'Local Control']
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
});
