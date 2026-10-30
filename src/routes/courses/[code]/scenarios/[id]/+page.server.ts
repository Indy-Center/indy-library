import {
	courseVersion,
	difficultyLabel,
	findScenario,
	hasTeacherNotes,
	maySeeTeacherNotes,
	makeShownPosition,
	taskRef,
	teacherNotes,
	versionOf
} from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/** One scenario offered by a course's current version: what a student is graded on, and
 * for those who may teach it, how each challenge is posed. */
export const load = (async ({ locals, params, url }) => {
	const doc = await courseVersion(locals, params.code, url);
	const { scenario, offeredBy } = findScenario(doc, params.id);
	const showsTeacherNotes =
		hasTeacherNotes(scenario.practicalTasks) && (await maySeeTeacherNotes(locals, doc.course.code));
	// The same catalogue read as the root layout's positions: the CMS client reads it once a request.
	const shownPosition = await makeShownPosition(locals);

	return {
		course: { code: doc.course.code, title: doc.course.title },
		version: versionOf(doc),
		scenario: {
			id: scenario.id,
			name: scenario.name,
			airport: scenario.airport,
			studentPosition: shownPosition(scenario.studentPosition),
			teacherPosition: shownPosition(scenario.teacherPosition),
			difficulty: difficultyLabel(scenario.difficulty),
			mode: scenario.mode,
			retired: scenario.retired
		},
		showsTeacherNotes,
		practicalTasks: scenario.practicalTasks.map((pt) => ({
			id: pt.id,
			task: taskRef(pt.task),
			required: pt.required,
			teacherNotes: teacherNotes(pt.teacherNotes, showsTeacherNotes)
		})),
		offeredBy: offeredBy.map((lp) => ({ id: lp.id, code: lp.code, title: lp.title }))
	};
}) satisfies PageServerLoad;
