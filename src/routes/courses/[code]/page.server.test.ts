import { describe, expect, it } from 'vitest';
import { FRESH_MS, KEEP_MS } from '$lib/server/cms';
import { sgcCurrent } from '$lib/testing/fixtures';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load } from './+page.server';

const student = session('1000002');
const CURRENT = '/api/courseware/courses/S-GC/current';

function sgc(lib: ReturnType<typeof library>) {
	return run(load, lib.event(student, '/courses/S-GC', { code: 'S-GC' }));
}

describe('/courses/[code]', () => {
	it('shows the current version, its modules in order, each with its lesson plans', async () => {
		const data = await sgc(library());

		expect(data.course).toEqual({ code: 'S-GC', title: 'Ground Control' });
		expect(data.version).toMatchObject({ number: 1, isDraft: false, time: 600 });
		expect(data.modules).toEqual([
			{
				id: 'mod-ground',
				title: 'Ground control',
				description: 'Everything on the ground.',
				lessonPlans: [
					expect.objectContaining({ id: 'lp-taxi', code: 'S-GC-1', title: 'Taxi basics' }),
					expect.objectContaining({ id: 'lp-review', code: 'S-GC-2', title: 'Ground review' })
				]
			}
		]);
	});

	it('sends no teacher notes', async () => {
		const data = await sgc(library());

		expect(JSON.stringify(data)).not.toContain('SECRET');
	});

	it('is a 404 for a course with no current version', async () => {
		const lib = library();
		await expect(
			run(load, lib.event(student, '/courses/X-NEW', { code: 'X-NEW' }))
		).rejects.toMatchObject({ status: 404 });
	});

	describe('the kept copy', () => {
		it('is reused within its window', async () => {
			const lib = library();
			await sgc(lib);
			lib.clock.now += FRESH_MS - 1;
			await sgc(lib);

			expect(lib.cms.asked(CURRENT)).toBe(1);
		});

		it('is fetched again once its window has passed', async () => {
			const lib = library();
			await sgc(lib);
			lib.clock.now += FRESH_MS;
			await sgc(lib);

			expect(lib.cms.asked(CURRENT)).toBe(2);
		});

		it('is served when the CMS fails', async () => {
			const lib = library();
			await sgc(lib);
			lib.cms.down();
			lib.clock.now += FRESH_MS * 10;

			const data = await sgc(lib);

			expect(data.course.code).toBe('S-GC');
			expect(lib.cms.asked(CURRENT)).toBe(2);
		});

		it('is not served once it is older than the keep window', async () => {
			const lib = library();
			await sgc(lib);
			lib.cms.down();
			lib.clock.now += KEEP_MS;

			await expect(sgc(lib)).rejects.toMatchObject({ status: 503 });
		});

		it('gives way to a newly published version once it expires', async () => {
			const lib = library();
			await sgc(lib);
			lib.cms.documents[CURRENT] = {
				...sgcCurrent,
				version: { ...sgcCurrent.version, id: 'ver-sgc-2', number: 2 }
			};

			lib.clock.now += FRESH_MS - 1;
			expect((await sgc(lib)).version.number).toBe(1);
			lib.clock.now += 1;
			expect((await sgc(lib)).version.number).toBe(2);
		});
	});

	it('is a 503 when the CMS fails and nothing is kept', async () => {
		const lib = library();
		lib.cms.down();

		await expect(sgc(lib)).rejects.toMatchObject({ status: 503 });
	});
});
