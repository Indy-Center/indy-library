import { error } from '@sveltejs/kit';
import {
	courseVersion,
	findScenario,
	lessonPlanForReader,
	makeShownPosition,
	versionOf
} from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/** One scenario offered by a course's version, and the lesson plans that offer it. */
export const load = (async ({ locals, params, url }) => {
	const doc = await courseVersion(locals, params.code, url);
	const { offeredBy } = findScenario(doc, params.id);
	// Teacher-only material is held back on the lesson plan that offers the scenario (0076).
	const { lessonPlan, showsTeacherOnly } = await lessonPlanForReader(
		locals,
		doc.course.code,
		offeredBy[0]
	);
	const scenario = lessonPlan.scenarios.find((s) => s.id === params.id);
	if (!scenario) error(404, 'This course offers no such scenario.');
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
			teacherPosition:
				scenario.teacherPosition === null ? null : shownPosition(scenario.teacherPosition),
			retired: scenario.retired
		},
		showsTeacherNotes: showsTeacherOnly,
		offeredBy: offeredBy.map((lp) => ({ id: lp.id, code: lp.code, title: lp.title }))
	};
}) satisfies PageServerLoad;
