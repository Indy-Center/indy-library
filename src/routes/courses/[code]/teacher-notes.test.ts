import { describe, expect, it } from 'vitest';
import type { SessionContext } from '@indy-center/identity';
import { AUTHOR_CID } from '$lib/testing/fixtures';
import { fakeTraining, library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load as courseLoad } from './+page.server';
import { load as lessonPlanLoad } from './lesson-plans/[id]/+page.server';
import type { TaskNode } from './lesson-plans/[id]/tasks';
import { load as scenarioLoad } from './scenarios/[id]/+page.server';

/**
 * Who sees teacher-only material (decisions 0017, 0076), on the two pages that carry it: lesson
 * plans (task notes, teacher-only resources and resource notes, a scenario's description,
 * events, ATCTrainer value and teacher position) and scenarios (their teacher position). "Sees
 * none" is checked on everything the load returns, since whatever it returns is sent to the
 * browser.
 */

const student = session('1000002');
const teacher = session('1000005');
const otherTeacher = session('1000006');
const admin = session('1000003', ['training:admin']);
const lead = session('1000004', ['training:lead']);

const roster = { '1000005': ['S-GC'], '1000006': ['A-LC'] };

type Training = ReturnType<typeof fakeTraining>;
type LessonPlanData = Awaited<ReturnType<typeof lessonPlan>>;

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

/** Every task note the page carries, the area leads' and headings' included, by task number. */
function taskNotes(data: LessonPlanData): [string, string | null][] {
	const walk = (rows: TaskNode[]): [string, string | null][] =>
		rows.flatMap((row) => [
			[row.number, row.teacherNotes] as [string, string | null],
			...(row.kind === 'heading' ? walk(row.rows) : [])
		]);
	return data.tasks.areas.flatMap((area) => [
		...(area.lead ? [[area.number, area.lead.teacherNotes] as [string, string | null]] : []),
		...walk(area.rows)
	]);
}

/** Every teacher-only part of the lesson plan's data, for the "all of it" checks. */
function teacherOnly(data: LessonPlanData) {
	const [quiet, evening] = data.scenarios;
	return {
		taskNote: taskNotes(data).find(([number]) => number === '1.1')?.[1],
		resources: data.resources.map((r) => [r.id, r.teacherOnly, r.note]),
		quiet: {
			teacherPosition: quiet.teacherPosition?.callsign,
			description: quiet.description,
			events: quiet.events?.map((e) => [e.id, e.difficulty]),
			atctrainer: quiet.atctrainer
		},
		evening: { teacherPosition: evening.teacherPosition?.callsign, atctrainer: evening.atctrainer }
	};
}

const ALL_OF_IT = {
	taskNote: 'SECRET-LPT-1: ask what "hold short" means.',
	resources: [
		['res-diagram', false, 'SECRET-RES-NOTE: point out taxiway B first.'],
		['res-answers', true, null],
		['res-card', false, null],
		['res-guide', true, 'SECRET-RES-ONLY-NOTE: use the second half only.']
	],
	quiet: {
		teacherPosition: 'XMP_TWR',
		description: 'SECRET-SCN-1: start with one departure.\nAdd arrivals as the student settles.',
		// The scenario's order, not difficulty order.
		events: [
			['evt-1', 'easy'],
			['evt-2', 'medium'],
			['evt-3', 'easy']
		],
		atctrainer: 'https://example.com/atctrainer/SECRET-ATCTRAINER-QUIET'
	},
	evening: { teacherPosition: 'XMP_DEL', atctrainer: 'SECRET-ATCTRAINER-ID-0042' }
};

describe('teacher notes', () => {
	it('are not sent to a student', async () => {
		const lp = await lessonPlan(student);
		const scn = await scenario(student);

		expect(lp.showsTeacherNotes).toBe(false);
		expect(scn.showsTeacherNotes).toBe(false);
		expect(JSON.stringify([lp, scn])).not.toContain('SECRET');
	});

	it("leave a student each scenario's name, airport and student position", async () => {
		const lp = await lessonPlan(student);

		expect(lp.scenarios[0]).toEqual({
			id: 'scn-quiet',
			name: 'A quiet afternoon at Example Field',
			airport: 'KXMP',
			retired: false,
			studentPosition: { id: 'pos-xmp-gnd', callsign: 'XMP_GND', retired: false },
			teacherPosition: null,
			description: null,
			events: null,
			atctrainer: null
		});
	});

	it('are shown to a teacher qualified on the course: all of the lesson plan’s, and the scenario page’s', async () => {
		const lp = await lessonPlan(teacher);
		const scn = await scenario(teacher);

		expect(lp.showsTeacherNotes).toBe(true);
		expect(teacherOnly(lp)).toEqual(ALL_OF_IT);
		expect(lp.scenarios[0].events?.[0]).toEqual({
			id: 'evt-1',
			difficulty: 'easy',
			callsign: 'XMP101',
			aircraftType: 'C172',
			description: 'SECRET-EVT-1: asks for taxi without the ATIS.'
		});
		expect(taskNotes(lp).filter(([, note]) => note !== null)).toEqual([
			['1.1', 'SECRET-LPT-1: ask what "hold short" means.'],
			['1.1.1', 'SECRET-LPT-HEADING: have the student read it back twice.'],
			['2', 'SECRET-LPT-TOP: ask who owns the runway crossing.']
		]);
		expect(scn.scenario.teacherPosition?.callsign).toBe('XMP_TWR');
	});

	it('on a heading row and a top-level row go to the course’s teacher, and not to a student', async () => {
		const forTeacher = await lessonPlan(teacher);
		const forStudent = await lessonPlan(student);

		const heading = forTeacher.tasks.areas[0].rows[1];
		expect(heading).toMatchObject({ kind: 'heading', number: '1.1.1' });
		expect(heading.teacherNotes).toBe('SECRET-LPT-HEADING: have the student read it back twice.');
		expect(forTeacher.tasks.areas[2].lead?.teacherNotes).toBe(
			'SECRET-LPT-TOP: ask who owns the runway crossing.'
		);

		const sent = JSON.stringify(forStudent);
		expect(sent).not.toContain('SECRET');
		expect(sent).not.toContain('SECRET-LPT-HEADING');
		expect(sent).not.toContain('SECRET-LPT-TOP');
	});

	it('are not sent to a teacher of another course', async () => {
		const lp = await lessonPlan(otherTeacher);
		const scn = await scenario(otherTeacher);

		expect(JSON.stringify([lp, scn])).not.toContain('SECRET');
		expect(lp.scenarios.map((s) => s.teacherPosition)).toEqual([null, null]);
		expect(scn.scenario.teacherPosition).toBeNull();
		// ...who does see their own course's.
		const alc = await lessonPlan(otherTeacher, undefined, 'lp-runway');
		expect(alc.tasks.areas[0].lead?.teacherNotes).toBe('SECRET-ALC: ask about runway crossings.');
	});

	it('are shown on every course to the Training Admin and lead instructors, without asking training-tools', async () => {
		for (const reader of [admin, lead]) {
			const training = fakeTraining();
			const lp = await lessonPlan(reader, training);
			const alc = await lessonPlan(reader, training, 'lp-runway');
			const scn = await scenario(reader, training);

			expect(teacherOnly(lp)).toEqual(ALL_OF_IT);
			expect(alc.tasks.areas[0].lead?.teacherNotes).toContain('SECRET-ALC');
			expect(scn.scenario.teacherPosition?.callsign).toBe('XMP_TWR');
			expect(training.asked).toEqual([]);
		}
	});

	it('are not shown to a course author for being an author', async () => {
		const lp = await lessonPlan(session(AUTHOR_CID));

		expect(lp.showsTeacherNotes).toBe(false);
		expect(JSON.stringify(lp)).not.toContain('SECRET');
	});

	it('are not sent when training-tools fails, and the page still renders', async () => {
		const lp = await lessonPlan(teacher, fakeTraining('throws'));
		const scn = await scenario(teacher, fakeTraining('throws'));

		expect(lp.lessonPlan.code).toBe('S-GC-1');
		expect(lp.tasks.count).toBe(4);
		expect(scn.scenario.name).toBe('A quiet afternoon at Example Field');
		expect(JSON.stringify([lp, scn])).not.toContain('SECRET');
	});

	it('are not sent when training-tools is too slow, and the page still renders', async () => {
		const lp = await lessonPlan(teacher, fakeTraining('hangs'));

		expect(lp.lessonPlan.code).toBe('S-GC-1');
		expect(lp.tasks.count).toBe(4);
		expect(JSON.stringify(lp)).not.toContain('SECRET');
	});

	it('are only asked about when the page has some to decide on', async () => {
		const training = fakeTraining(roster);
		await lessonPlan(teacher, training, 'lp-review');
		const lib = library({ training });
		await run(courseLoad, lib.event(teacher, '/courses/S-GC', { code: 'S-GC' }));

		expect(training.asked).toEqual([]);
	});

	it("are asked about once, with the reader's CID", async () => {
		const training = fakeTraining(roster);
		await lessonPlan(teacher, training);

		expect(training.asked).toEqual(['1000005']);
	});
});
