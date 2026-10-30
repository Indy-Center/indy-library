import { describe, expect, it } from 'vitest';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { AUTHOR_CID } from '$lib/testing/fixtures';
import { load } from './+page.server';

const student = session('1000002');

function lessonPlan(lib: ReturnType<typeof library>, id: string, code = 'S-GC') {
	return run(load, lib.event(student, `/courses/${code}/lesson-plans/${id}`, { code, id }));
}

describe('/courses/[code]/lesson-plans/[id]', () => {
	it('shows the lesson plan: code, title, body, time and exam flag', async () => {
		const data = await lessonPlan(library(), 'lp-taxi');

		expect(data.course).toEqual({ code: 'S-GC', title: 'Ground Control' });
		expect(data.module).toEqual({ title: 'Ground control' });
		expect(data.lessonPlan).toMatchObject({
			code: 'S-GC-1',
			title: 'Taxi basics',
			bodyHtml: '<p>Read the field diagram of Example Field before the lesson.</p>',
			time: 90,
			isExam: false,
			minimum: 'Satisfactory'
		});
	});

	it("numbers the lesson plan's module by its place in the course", async () => {
		const data = await lessonPlan(library(), 'lp-taxi');

		expect(data.lessonPlan.moduleNumber).toBe(1);
	});

	it('lists its theory items in order, each with its task number and name', async () => {
		const data = await lessonPlan(library(), 'lp-taxi');

		expect(data.theoryItems).toEqual([
			{
				id: 'ti-1',
				task: { id: 'task-taxi-clearance', number: '1.1', name: 'Issue a taxi clearance' },
				teacherNotes: null
			},
			{
				id: 'ti-2',
				task: { id: 'task-progressive', number: '1.2', name: 'Give progressive taxi' },
				teacherNotes: null
			}
		]);
	});

	it('lists the scenarios it offers', async () => {
		const data = await lessonPlan(library(), 'lp-taxi');

		expect(data.scenarios).toEqual([
			{
				id: 'scn-quiet',
				name: 'A quiet afternoon at Example Field',
				airport: 'KXMP',
				studentPosition: { id: 'pos-xmp-gnd', callsign: 'XMP_GND', retired: false },
				difficulty: 'Easy',
				mode: 'sim'
			}
		]);
	});

	it("hands each scenario's student position to Position, with whether it is retired", async () => {
		// A-LC's scenarios: no short name, retired, and a position the catalogue lacks.
		const data = await lessonPlan(library(), 'lp-runway', 'A-LC');

		expect(data.scenarios.map((s) => [s.id, s.studentPosition])).toEqual([
			['scn-tower-day', { id: 'pos-xmp-twr', callsign: 'XMP_TWR', retired: false }],
			['scn-old-delivery', { id: 'pos-xmp-del', callsign: 'XMP_DEL', retired: true }],
			['scn-lost-position', { id: 'pos-xmp-app', callsign: 'XMP_APP', retired: false }]
		]);
	});

	it('sends a student no teacher notes', async () => {
		const data = await lessonPlan(library(), 'lp-taxi');

		expect(JSON.stringify(data)).not.toContain('SECRET');
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
