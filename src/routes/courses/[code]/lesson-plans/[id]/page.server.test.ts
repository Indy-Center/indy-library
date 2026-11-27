import { describe, expect, it } from 'vitest';
import type { CourseVersionDocument } from '$lib/server/cms/types';
import { cmsDocuments, fakeCms, library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { AUTHOR_CID, sgcCurrent, sgcDraft } from '$lib/testing/fixtures';
import { load } from './+page.server';

const student = session('1000002');

function lessonPlan(lib: ReturnType<typeof library>, id: string, code = 'S-GC') {
	return run(load, lib.event(student, `/courses/${code}/lesson-plans/${id}`, { code, id }));
}

/** S-GC's version with its lesson plans split over two modules: lp-taxi, then lp-review. */
function twoModules(doc: CourseVersionDocument): CourseVersionDocument {
	const [first] = doc.modules;
	const [taxi, ...rest] = first.lessonPlans;
	const review = rest.length ? rest : [{ ...sgcCurrent.modules[0].lessonPlans[1] }];
	return {
		...doc,
		modules: [
			{ ...first, lessonPlans: [taxi] },
			{ id: 'mod-review', title: 'Review', description: '', lessonPlans: review }
		]
	};
}

function withTwoModules() {
	const documents = cmsDocuments();
	documents['/api/courseware/courses/S-GC/current'] = twoModules(sgcCurrent);
	documents['/api/courseware/courses/S-GC/draft'] = twoModules(sgcDraft);
	return library({ cms: fakeCms(documents) });
}

describe('/courses/[code]/lesson-plans/[id]', () => {
	describe('the header', () => {
		it('shows the code, title, description, body, module, time and exam flag', async () => {
			const data = await lessonPlan(library(), 'lp-taxi');

			expect(data.course).toEqual({ code: 'S-GC', title: 'Ground Control' });
			expect(data.module).toEqual({ title: 'Ground control' });
			expect(data.lessonPlan).toMatchObject({
				code: 'S-GC-1',
				title: 'Taxi basics',
				description: 'Moving aircraft around a made-up field.',
				bodyHtml: '<p>Read the field diagram of Example Field before the lesson.</p>',
				moduleNumber: 1,
				time: 90,
				isExam: false
			});
		});

		it("names the minimum grade by its label and its description's words before the colon", async () => {
			const data = await lessonPlan(library(), 'lp-taxi');

			expect(data.lessonPlan.minimum).toBe('2 (Satisfactory)');
		});

		it('shows no grade for a lesson plan with no minimum', async () => {
			const data = await lessonPlan(library(), 'lp-review');

			expect(data.lessonPlan.minimum).toBeNull();
			expect(data.lessonPlan.isExam).toBe(true);
		});
	});

	describe('the tasks', () => {
		it('are grouped by the top of the task tree, in the order each area first comes in the lesson', async () => {
			const { tasks } = await lessonPlan(library(), 'lp-taxi');

			expect(tasks.areas.map((a) => [a.number, a.name])).toEqual([
				['1', 'Ground movement'],
				// The catalogue has no task 5: the number alone.
				['5', null],
				['2', 'Coordination']
			]);
		});

		it('draw no row for a top-level task, which is its panel, and its statements as the first row', async () => {
			const { tasks } = await lessonPlan(library(), 'lp-taxi');
			const [ground, , coordination] = tasks.areas;

			// Area 1's own row has no statements: nothing is drawn for it.
			expect(ground.lead).toBeNull();
			expect(ground.rows.map((r) => r.number)).toEqual(['1.1', '1.1.1', '1.2']);
			expect(coordination.lead).toMatchObject({
				knowledge: 'Knows who to call before a crossing.',
				skill: ''
			});
			expect(coordination.rows).toEqual([]);
		});

		it('put a statement-less row whose descendants are here as a heading over them', async () => {
			const { tasks } = await lessonPlan(library(), 'lp-taxi');
			const heading = tasks.areas[0].rows[1];

			expect(heading).toMatchObject({
				kind: 'heading',
				number: '1.1.1',
				name: 'Check the readback'
			});
			expect(heading.kind === 'heading' && heading.rows).toEqual([
				expect.objectContaining({
					kind: 'task',
					number: '1.1.1.1',
					name: 'Confirm the hold short',
					knowledge: 'Knows why a hold short is read back.'
				})
			]);
		});

		it('draw a statement-less row with nothing beneath it here as an ordinary task', async () => {
			const { tasks } = await lessonPlan(library(), 'lp-taxi');

			expect(tasks.areas[1].rows).toEqual([
				expect.objectContaining({
					kind: 'task',
					number: '5.1',
					name: 'Read the weather board',
					knowledge: '',
					skill: ''
				})
			]);
		});

		it('flag only the optional ones', async () => {
			const { tasks } = await lessonPlan(library(), 'lp-taxi');
			const [clearance, , progressive] = tasks.areas[0].rows;

			expect(clearance).toMatchObject({ number: '1.1', optional: false });
			expect(progressive).toMatchObject({ number: '1.2', optional: true });
		});

		it('are counted without headings or top-level rows, in all and per area', async () => {
			const { tasks } = await lessonPlan(library(), 'lp-taxi');

			// 1.1, 1.1.1.1, 1.2 and 5.1; not 1, 1.1.1 or 2.
			expect(tasks.count).toBe(4);
			expect(tasks.optional).toBe(1);
			expect(tasks.areas.map((a) => a.count)).toEqual([3, 1, 0]);
		});

		it('are none for a lesson plan without them', async () => {
			const documents = cmsDocuments();
			const doc = structuredClone(sgcCurrent);
			doc.modules[0].lessonPlans[1].tasks = [];
			documents['/api/courseware/courses/S-GC/current'] = doc;

			const { tasks } = await lessonPlan(library({ cms: fakeCms(documents) }), 'lp-review');

			expect(tasks).toEqual({ count: 0, optional: 0, areas: [] });
		});
	});

	describe("each task's citations, from the catalogue", () => {
		it("link to the citation's own link, else its source's, else nowhere", async () => {
			const { tasks } = await lessonPlan(library(), 'lp-taxi');
			const [clearance, heading] = tasks.areas[0].rows;
			const cited = heading.kind === 'heading' ? heading.rows[0] : undefined;

			expect(clearance.kind === 'task' && clearance.citations).toEqual([
				{
					source: 'Example Notes',
					text: 'Chapter 4',
					url: 'https://example.com/notes#chapter-4'
				}
			]);
			expect(cited?.kind === 'task' && cited.citations).toEqual([
				{
					source: 'Example Order',
					text: 'Taxi and ground movement',
					url: 'https://example.com/order'
				},
				// No title: its place.
				{ source: 'Example Notes', text: 'Chapter 4', url: 'https://example.com/notes' },
				{
					source: 'Example Order',
					text: 'Whole-document overview',
					url: 'https://example.com/order'
				}
			]);
			expect(tasks.areas[2].lead?.citations[0]).toEqual({
				source: 'Example Handbook',
				text: 'Section 2',
				url: null
			});
		});

		it('show a citation whose source the catalogue lacks by its title, with no link', async () => {
			const { tasks } = await lessonPlan(library(), 'lp-taxi');

			expect(tasks.areas[2].lead?.citations[1]).toEqual({
				source: null,
				text: 'Calling the next position',
				url: null
			});
		});

		it('are none, with areas by their numbers, when the catalogue cannot be read', async () => {
			const documents = cmsDocuments();
			delete documents['/api/courseware/catalogue'];
			const { tasks } = await lessonPlan(library({ cms: fakeCms(documents) }), 'lp-taxi');

			expect(tasks.areas.map((a) => a.name)).toEqual([null, null, null]);
			expect(tasks.areas[0].rows[0]).toMatchObject({ number: '1.1', citations: [] });
		});
	});

	it('lists the resources a student may see, linking to their urls', async () => {
		const data = await lessonPlan(library(), 'lp-taxi');

		expect(data.resources).toEqual([
			{
				id: 'res-diagram',
				title: 'Example Field diagram',
				url: 'https://example.com/xmp-diagram',
				teacherOnly: false,
				note: null
			},
			{
				id: 'res-card',
				title: 'Example phraseology card',
				url: 'https://example.com/phraseology',
				teacherOnly: false,
				note: null
			}
		]);
	});

	it('lists the scenarios it offers, each with its name, airport and student position', async () => {
		const data = await lessonPlan(library(), 'lp-taxi');

		expect(
			data.scenarios.map((s) => [s.id, s.name, s.airport, s.retired, s.studentPosition])
		).toEqual([
			[
				'scn-quiet',
				'A quiet afternoon at Example Field',
				'KXMP',
				false,
				{ id: 'pos-xmp-gnd', callsign: 'XMP_GND', retired: false }
			],
			[
				'scn-evening',
				'An evening push at Example Field',
				'KXMP',
				false,
				{ id: 'pos-xmp-gnd', callsign: 'XMP_GND', retired: false }
			]
		]);
	});

	describe("each scenario's student position, a vNAS id looked up in the catalogue", () => {
		it('resolves to its callsign, marked when retired, and is shown by id when unknown', async () => {
			// A-LC's scenarios: no short name, retired, and a position the catalogue lacks.
			const data = await lessonPlan(library(), 'lp-runway', 'A-LC');

			expect(data.scenarios.map((s) => [s.id, s.studentPosition])).toEqual([
				['scn-tower-day', { id: 'pos-xmp-twr', callsign: 'XMP_TWR', retired: false }],
				['scn-old-delivery', { id: 'pos-xmp-del', callsign: 'XMP_DEL', retired: true }],
				['scn-lost-position', { id: 'pos-xmp-app', callsign: 'pos-xmp-app', retired: false }]
			]);
		});

		it('is shown by id when the catalogue cannot be read', async () => {
			const documents = cmsDocuments();
			delete documents['/api/courseware/catalogue'];
			const data = await lessonPlan(library({ cms: fakeCms(documents) }), 'lp-runway', 'A-LC');

			expect(data.scenarios[1].studentPosition).toEqual({
				id: 'pos-xmp-del',
				callsign: 'pos-xmp-del',
				retired: false
			});
		});
	});

	describe('the previous and next lesson plans', () => {
		it("run across modules, in the course's order", async () => {
			const lib = withTwoModules();

			const taxi = await lessonPlan(lib, 'lp-taxi');
			const review = await lessonPlan(lib, 'lp-review');

			expect(taxi.next).toEqual({ id: 'lp-review', code: 'S-GC-2', title: 'Ground review' });
			expect(review.previous).toEqual({ id: 'lp-taxi', code: 'S-GC-1', title: 'Taxi basics' });
		});

		it('are none before the first or after the last', async () => {
			const taxi = await lessonPlan(library(), 'lp-taxi');
			const review = await lessonPlan(library(), 'lp-review');

			expect(taxi.previous).toBeNull();
			expect(review.next).toBeNull();
		});

		it("are the draft's on a draft, which the page keeps in their links", async () => {
			const lib = withTwoModules();
			const href = '/courses/S-GC/lesson-plans/lp-taxi?version=draft';
			const data = await run(
				load,
				lib.event(session(AUTHOR_CID), href, { code: 'S-GC', id: 'lp-taxi' })
			);

			expect(data.version.isDraft).toBe(true);
			expect(data.next).toEqual({ id: 'lp-review', code: 'S-GC-2', title: 'Ground review' });
		});
	});

	it('sends a student none of the teacher-only material', async () => {
		const data = await lessonPlan(library(), 'lp-taxi');

		expect(data.showsTeacherNotes).toBe(false);
		expect(JSON.stringify(data)).not.toContain('SECRET');
		// The teacher positions, XMP_TWR and XMP_DEL.
		expect(JSON.stringify(data)).not.toContain('XMP_TWR');
		expect(JSON.stringify(data)).not.toContain('XMP_DEL');
	});

	it('is a 404 for a lesson plan not in the current version', async () => {
		await expect(lessonPlan(library(), 'lp-runway')).rejects.toMatchObject({ status: 404 });
	});

	it("shows the draft's lesson plan to the course's authors, and nobody else", async () => {
		const lib = library();
		const href = '/courses/S-GC/lesson-plans/lp-taxi?version=draft';
		const params = { code: 'S-GC', id: 'lp-taxi' };

		const data = await run(load, lib.event(session(AUTHOR_CID), href, params));
		expect(data.version).toEqual({ number: 2, isDraft: true });
		expect(data.lessonPlan.title).toBe('Taxi basics, rewritten');

		const other = library();
		await expect(run(load, other.event(student, href, params))).rejects.toMatchObject({
			status: 404
		});
		expect(other.cms.requests.filter((r) => r.endsWith('/draft'))).toEqual([]);
	});
});
