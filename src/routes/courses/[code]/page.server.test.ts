import { describe, expect, it } from 'vitest';
import { copyKey, FRESH_MS, KEEP_MS, SHAPE_VERSION } from '$lib/server/cms';
import { sgcCurrent } from '$lib/testing/fixtures';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { AUTHOR_CID } from '$lib/testing/fixtures';
import { load } from './+page.server';

const student = session('1000002');
const author = session(AUTHOR_CID);
const admin = session('1000003', ['training:admin']);
const lead = session('1000004', ['training:lead']);
const CURRENT = '/api/courseware/courses/S-GC/current';
const DRAFT = '/api/courseware/courses/S-GC/draft';
const COURSES = '/api/courseware/courses';

function sgcDraft(lib: ReturnType<typeof library>, reader = author) {
	return run(load, lib.event(reader, '/courses/S-GC?version=draft', { code: 'S-GC' }));
}

function sgc(lib: ReturnType<typeof library>) {
	return run(load, lib.event(student, '/courses/S-GC', { code: 'S-GC' }));
}

describe('/courses/[code]', () => {
	it('shows the current version, its modules in order, each with its lesson plans', async () => {
		const data = await sgc(library());

		expect(data.course).toEqual({ code: 'S-GC', title: 'Ground Control', academyExam: 'S2' });
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

	it("shows the course's VATUSA Academy exam, or none", async () => {
		const withExam = await sgc(library());
		const withoutExam = await run(
			load,
			library().event(student, '/courses/A-LC', { code: 'A-LC' })
		);

		expect(withExam.course.academyExam).toBe('S2');
		expect(withoutExam.course.academyExam).toBeNull();
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

		describe('kept in an older shape', () => {
			/** Copies of what the page reads, kept before the contract last changed shape. */
			async function keepOldShape(lib: ReturnType<typeof library>) {
				const old = (path: string) => copyKey(path, SHAPE_VERSION - 1);
				await lib.store.put(old(CURRENT), {
					fetchedAt: lib.clock.now,
					body: { ...sgcCurrent, course: { ...sgcCurrent.course, title: 'Old shape' } }
				});
				await lib.store.put(old(COURSES), {
					fetchedAt: lib.clock.now,
					body: lib.cms.documents[COURSES]
				});
			}

			it('is not served, even while fresh', async () => {
				const lib = library();
				await keepOldShape(lib);

				const data = await sgc(lib);

				expect(data.course.title).toBe('Ground Control');
				expect(lib.cms.asked(CURRENT)).toBe(1);
			});

			it('is not served when the CMS fails: with no copy in the new shape, it is a 503', async () => {
				const lib = library();
				await keepOldShape(lib);
				lib.cms.down();
				lib.clock.now += FRESH_MS * 10;

				await expect(sgc(lib)).rejects.toMatchObject({ status: 503 });
			});
		});
	});

	it('is a 503 when the CMS fails and nothing is kept', async () => {
		const lib = library();
		lib.cms.down();

		await expect(sgc(lib)).rejects.toMatchObject({ status: 503 });
	});

	describe('the draft', () => {
		it("is shown to the course's authors, marked as a draft", async () => {
			const data = await sgcDraft(library());

			expect(data.version).toMatchObject({ number: 2, isDraft: true });
			expect(data.modules[0].lessonPlans.map((lp) => lp.title)).toEqual(['Taxi basics, rewritten']);
		});

		it('is shown to the Training Admin and lead instructors', async () => {
			for (const reader of [admin, lead]) {
				const data = await sgcDraft(library(), reader);
				expect(data.version).toMatchObject({ number: 2, isDraft: true });
			}
		});

		it('is a 404 for anyone else, and is never fetched for them', async () => {
			const lib = library();

			await expect(sgcDraft(lib, student)).rejects.toMatchObject({ status: 404 });
			await expect(
				run(load, lib.event(session('1000009'), '/courses/A-LC?version=draft', { code: 'A-LC' }))
			).rejects.toMatchObject({ status: 404 });
			expect(lib.cms.requests.filter((r) => r.endsWith('/draft'))).toEqual([]);
		});

		it("is offered from the current version's page to those who may see it", async () => {
			expect((await sgc(library())).draft).toBeNull();
			expect(
				(await run(load, library().event(author, '/courses/S-GC', { code: 'S-GC' }))).draft
			).toBe(2);
		});

		it('is not fetched to show the current version, even for its authors', async () => {
			const lib = library();
			await run(load, lib.event(author, '/courses/S-GC', { code: 'S-GC' }));

			expect(lib.cms.asked(DRAFT)).toBe(0);
		});

		it('is shown for a course that has only a draft', async () => {
			const data = await run(
				load,
				library().event(author, '/courses/X-NEW?version=draft', { code: 'X-NEW' })
			);

			expect(data.version).toMatchObject({ number: 1, isDraft: true });
		});
	});
});
