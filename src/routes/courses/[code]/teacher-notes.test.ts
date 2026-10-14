import { describe, expect, it } from 'vitest';
import type { SessionContext } from '@indy-center/identity';
import { AUTHOR_CID } from '$lib/testing/fixtures';
import { fakeTraining, library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load as courseLoad } from './+page.server';
import { load as lessonPlanLoad } from './lesson-plans/[id]/+page.server';
import { load as scenarioLoad } from './scenarios/[id]/+page.server';

/**
 * Who sees teacher notes, on the two pages that carry them: lesson plans (on theory items) and
 * scenarios (on practical tasks). "Sees none" is checked on everything the load returns, since
 * whatever it returns is sent to the browser.
 */

const student = session('1000002');
const teacher = session('1000005');
const otherTeacher = session('1000006');
const admin = session('1000003', ['training:admin']);
const lead = session('1000004', ['training:lead']);

const roster = { '1000005': ['S-GC'], '1000006': ['A-LC'] };

type Training = ReturnType<typeof fakeTraining>;

function lessonPlan(
	reader: SessionContext,
	training: Training = fakeTraining(roster),
	id = 'lp-taxi'
) {
	const code = id === 'lp-runway' ? 'A-LC' : 'S-GC';
	const lib = library({ training });
	return run(
		lessonPlanLoad,
		lib.event(reader, `/courses/${code}/lesson-plans/${id}`, { code, id })
	);
}

function scenario(reader: SessionContext, training: Training = fakeTraining(roster)) {
	const lib = library({ training });
	const params = { code: 'S-GC', id: 'scn-quiet' };
	return run(scenarioLoad, lib.event(reader, '/courses/S-GC/scenarios/scn-quiet', params));
}

describe('teacher notes', () => {
	it('are not sent to a student', async () => {
		const lp = await lessonPlan(student);
		const scn = await scenario(student);

		expect(lp.showsTeacherNotes).toBe(false);
		expect(scn.showsTeacherNotes).toBe(false);
		expect(JSON.stringify([lp, scn])).not.toContain('SECRET');
	});

	it('are shown to a teacher qualified on the course, on its theory items and practical tasks', async () => {
		const lp = await lessonPlan(teacher);
		const scn = await scenario(teacher);

		expect(lp.showsTeacherNotes).toBe(true);
		expect(lp.theoryItems.map((item) => item.teacherNotes)).toEqual([
			'SECRET-TI-1: ask what "hold short" means.',
			null
		]);
		expect(scn.practicalTasks.map((pt) => pt.teacherNotes)).toEqual([
			'SECRET-PT-1: have the pilot read back the wrong runway.',
			'SECRET-PT-2: pilot asks for progressive taxi halfway.'
		]);
	});

	it('are not sent to a teacher of another course', async () => {
		const lp = await lessonPlan(otherTeacher);
		const scn = await scenario(otherTeacher);

		expect(JSON.stringify([lp, scn])).not.toContain('SECRET');
		// ...who does see their own course's.
		expect(
			(await lessonPlan(otherTeacher, undefined, 'lp-runway')).theoryItems[0].teacherNotes
		).toBe('SECRET-ALC: ask about runway crossings.');
	});

	it('are shown on every course to the Training Admin and lead instructors, without asking training-tools', async () => {
		for (const reader of [admin, lead]) {
			const training = fakeTraining();
			const lp = await lessonPlan(reader, training);
			const alc = await lessonPlan(reader, training, 'lp-runway');
			const scn = await scenario(reader, training);

			expect(lp.theoryItems[0].teacherNotes).toContain('SECRET-TI-1');
			expect(alc.theoryItems[0].teacherNotes).toContain('SECRET-ALC');
			expect(scn.practicalTasks[0].teacherNotes).toContain('SECRET-PT-1');
			expect(training.asked).toEqual([]);
		}
	});

	it('are not shown to a course author for being an author', async () => {
		const lp = await lessonPlan(session(AUTHOR_CID));

		expect(JSON.stringify(lp)).not.toContain('SECRET');
	});

	it('are not sent when training-tools fails, and the page still renders', async () => {
		const lp = await lessonPlan(teacher, fakeTraining('throws'));
		const scn = await scenario(teacher, fakeTraining('throws'));

		expect(lp.lessonPlan.code).toBe('S-GC-1');
		expect(scn.scenario.name).toBe('A quiet afternoon at Example Field');
		expect(JSON.stringify([lp, scn])).not.toContain('SECRET');
	});

	it('are not sent when training-tools is too slow, and the page still renders', async () => {
		const lp = await lessonPlan(teacher, fakeTraining('hangs'));

		expect(lp.lessonPlan.code).toBe('S-GC-1');
		expect(JSON.stringify(lp)).not.toContain('SECRET');
	});

	it('are only asked about when the page has some to decide on', async () => {
		const training = fakeTraining(roster);
		await lessonPlan(teacher, training, 'lp-review');
		const lib = library({ training });
		await run(courseLoad, lib.event(teacher, '/courses/S-GC', { code: 'S-GC' }));

		expect(training.asked).toEqual([]);
	});

	it("are asked about with the reader's CID", async () => {
		const training = fakeTraining(roster);
		await lessonPlan(teacher, training);

		expect(training.asked).toEqual(['1000005']);
	});
});
