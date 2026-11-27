import { describe, expect, it } from 'vitest';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { AUTHOR_CID, alcCurrent, sgcCurrent } from '$lib/testing/fixtures';
import { load } from './+page.server';

const student = session('1000002');
const author = session(AUTHOR_CID);
const admin = session('1000003', ['training:admin']);
const lead = session('1000004', ['training:lead']);

const SGC_FACTS = [
	'Needs X-OBS or X-OLD, X-GONE',
	'Earns S-GC and the S1 rating',
	'4–8 weeks',
	'2 lesson plans'
];

describe('/ (course list)', () => {
	it('lists every course with a current version, with its facts', async () => {
		const lib = library();
		const data = await run(load, lib.event(student, '/'));

		expect(data.courses).toEqual([
			{ code: 'S-GC', title: 'Ground Control', hasCurrent: true, draft: null, facts: SGC_FACTS },
			{
				code: 'A-LC',
				title: 'Local Control',
				hasCurrent: true,
				draft: null,
				facts: ['1 lesson plan']
			}
		]);
	});

	it('counts lesson plans across every module', async () => {
		const lib = library();
		const lessonPlans = sgcCurrent.modules[0].lessonPlans;
		lib.cms.documents['/api/courseware/courses/S-GC/current'] = {
			...sgcCurrent,
			modules: [
				{ ...sgcCurrent.modules[0], lessonPlans: [lessonPlans[0]] },
				{ ...alcCurrent.modules[0], id: 'mod-two', lessonPlans: [lessonPlans[1], lessonPlans[0]] }
			]
		};
		const data = await run(load, lib.event(student, '/'));

		expect(data.courses[0].facts.at(-1)).toBe('3 lesson plans');
	});

	it('leaves out a part the document has no value for', async () => {
		const data = await run(load, library().event(student, '/'));

		const alc = data.courses.find((c) => c.code === 'A-LC');
		expect(alc?.facts).toEqual(['1 lesson plan']);
	});

	it('says only "Earns" the credential when the course has no rating exam', async () => {
		const lib = library();
		lib.cms.documents['/api/courseware/courses/S-GC/current'] = {
			...sgcCurrent,
			course: { ...sgcCurrent.course, ratingExam: null }
		};
		const data = await run(load, lib.event(student, '/'));

		expect(data.courses[0].facts).toContain('Earns S-GC');
	});

	it('does not list a course with no current version, and fetches no draft for a student', async () => {
		const lib = library();
		const data = await run(load, lib.event(student, '/'));

		expect(data.courses.map((c) => c.code)).not.toContain('X-NEW');
		expect(lib.cms.requests.filter((r) => r.endsWith('/draft'))).toEqual([]);
	});

	it('sends the CMS the library credential', async () => {
		const lib = library();
		await run(load, lib.event(student, '/'));

		expect(lib.cms.authorizations.length).toBeGreaterThan(0);
		expect(new Set(lib.cms.authorizations)).toEqual(new Set(['Bearer test-token']));
	});

	it("shows a course's authors its drafts, including a course with only a draft", async () => {
		const data = await run(load, library().event(author, '/'));

		expect(data.courses).toEqual([
			{ code: 'S-GC', title: 'Ground Control', hasCurrent: true, draft: 2, facts: SGC_FACTS },
			{
				code: 'A-LC',
				title: 'Local Control',
				hasCurrent: true,
				draft: null,
				facts: ['1 lesson plan']
			},
			{
				code: 'X-NEW',
				title: 'Unreleased Course',
				hasCurrent: false,
				draft: 1,
				facts: ['6 weeks', '0 lesson plans']
			}
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

	it("takes a course's facts from its current version when it also has a draft", async () => {
		const lib = library();
		const data = await run(load, lib.event(author, '/'));

		// The draft has one lesson plan; the current version has two.
		expect(data.courses[0].facts).toContain('2 lesson plans');
		expect(lib.cms.asked('/api/courseware/courses/S-GC/draft')).toBe(0);
	});

	it('is a 503 when the CMS fails and nothing is kept', async () => {
		const lib = library();
		lib.cms.down();

		await expect(run(load, lib.event(student, '/'))).rejects.toMatchObject({ status: 503 });
	});

	it('sends no teacher-only material', async () => {
		const data = await run(load, library().event(admin, '/'));

		expect(JSON.stringify(data)).not.toContain('SECRET');
	});
});
