import { describe, expect, it } from 'vitest';
import type { SessionContext } from '@indy-center/identity';
import { alcCurrent, sgcCurrent } from '$lib/testing/fixtures';
import { fakeTraining, library } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { lessonPlanForReader } from './reader';

/**
 * The one place teacher-only material (decisions 0017, 0076) is held back from a lesson plan.
 * Runs on S-GC's `lp-taxi`, which has every teacher-only field set.
 */

const student = session('1000002');
const teacher = session('1000005');
const otherTeacher = session('1000006');
const admin = session('1000003', ['training:admin']);
const lead = session('1000004', ['training:lead']);

const roster = { '1000005': ['S-GC'], '1000006': ['A-LC'] };

const [taxiBasics, groundReview] = sgcCurrent.modules[0].lessonPlans;

function forReader(
	reader: SessionContext,
	training = fakeTraining(roster),
	lessonPlan = taxiBasics
) {
	const { locals } = library({ training }).event(reader, '/');
	return lessonPlanForReader(locals as App.Locals, 'S-GC', lessonPlan);
}

describe('lessonPlanForReader', () => {
	it('gives a student none of the teacher-only material, and keeps everything else', async () => {
		const { lessonPlan, showsTeacherOnly } = await forReader(student);

		expect(showsTeacherOnly).toBe(false);
		expect(lessonPlan.tasks.every((t) => t.teacherNotes === null)).toBe(true);
		expect(lessonPlan.tasks[1].statements).toEqual({
			knowledge: 'Knows the parts of a taxi clearance.',
			skill: 'Issues a taxi clearance with a route and a hold short.'
		});
		expect(lessonPlan.resources).toEqual([
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
		expect(lessonPlan.scenarios).toEqual([
			{
				id: 'scn-quiet',
				name: 'A quiet afternoon at Example Field',
				airport: 'KXMP',
				studentPosition: 'pos-xmp-gnd',
				teacherPosition: null,
				description: null,
				events: null,
				atctrainer: null,
				retired: false
			},
			{
				id: 'scn-evening',
				name: 'An evening push at Example Field',
				airport: 'KXMP',
				studentPosition: 'pos-xmp-gnd',
				teacherPosition: null,
				description: null,
				events: null,
				atctrainer: null,
				retired: false
			}
		]);
		expect(JSON.stringify(lessonPlan)).not.toContain('SECRET');
	});

	it('gives a teacher of the course all of it', async () => {
		const { lessonPlan, showsTeacherOnly } = await forReader(teacher);

		expect(showsTeacherOnly).toBe(true);
		expect(lessonPlan.tasks[1].teacherNotes).toBe('SECRET-LPT-1: ask what "hold short" means.');
		expect(lessonPlan.resources.map((r) => [r.id, r.note])).toEqual([
			['res-diagram', 'SECRET-RES-NOTE: point out taxiway B first.'],
			['res-answers', null],
			['res-card', null],
			['res-guide', 'SECRET-RES-ONLY-NOTE: use the second half only.']
		]);
		const [scenario] = lessonPlan.scenarios;
		expect(scenario.teacherPosition).toBe('pos-xmp-twr');
		expect(scenario.description).toContain('SECRET-SCN-1');
		expect(scenario.events?.map((e) => e.id)).toEqual(['evt-1', 'evt-2', 'evt-3']);
		expect(scenario.atctrainer).toBe('https://example.com/atctrainer/SECRET-ATCTRAINER-QUIET');
	});

	it('gives a teacher of another course none of it', async () => {
		const { lessonPlan, showsTeacherOnly } = await forReader(otherTeacher);

		expect(showsTeacherOnly).toBe(false);
		expect(lessonPlan.scenarios[0].teacherPosition).toBeNull();
		expect(JSON.stringify(lessonPlan)).not.toContain('SECRET');
	});

	it('gives the Training Admin and a lead all of it, without asking training-tools', async () => {
		for (const reader of [admin, lead]) {
			const training = fakeTraining();
			const { lessonPlan } = await forReader(reader, training);

			expect(lessonPlan.tasks[1].teacherNotes).toContain('SECRET-LPT-1');
			expect(lessonPlan.resources.map((r) => r.id)).toContain('res-answers');
			expect(lessonPlan.scenarios[0].atctrainer).toContain('SECRET-ATCTRAINER-QUIET');
			expect(training.asked).toEqual([]);
		}
	});

	it('gives none when training-tools throws or takes too long', async () => {
		for (const failure of ['throws', 'hangs'] as const) {
			const { lessonPlan, showsTeacherOnly } = await forReader(teacher, fakeTraining(failure));

			expect(showsTeacherOnly).toBe(false);
			expect(lessonPlan.scenarios[0].teacherPosition).toBeNull();
			expect(JSON.stringify(lessonPlan)).not.toContain('SECRET');
		}
	});

	it('asks training-tools once, with the reader’s CID, when there is something to decide', async () => {
		const training = fakeTraining(roster);
		await forReader(teacher, training);

		expect(training.asked).toEqual(['1000005']);
	});

	it('does not ask training-tools about a lesson plan with nothing teacher-only', async () => {
		const training = fakeTraining(roster);
		const { lessonPlan, showsTeacherOnly } = await forReader(teacher, training, groundReview);

		expect(showsTeacherOnly).toBe(false);
		expect(lessonPlan.resources.map((r) => r.id)).toEqual(['res-review']);
		expect(training.asked).toEqual([]);
	});

	it('asks about a lesson plan whose only teacher-only material is a scenario', async () => {
		const training = fakeTraining(roster);
		const towerOnly = { ...alcCurrent.modules[0].lessonPlans[0], tasks: [] };
		await forReader(teacher, training, towerOnly);

		expect(training.asked).toEqual(['1000005']);
	});
});
