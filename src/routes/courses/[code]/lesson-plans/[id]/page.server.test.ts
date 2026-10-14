import { describe, expect, it } from 'vitest';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
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

	it('is a 404 for a lesson plan not in the current version', async () => {
		await expect(lessonPlan(library(), 'lp-runway')).rejects.toMatchObject({ status: 404 });
	});
});
