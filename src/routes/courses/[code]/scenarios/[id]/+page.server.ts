import { courseVersion, versionOf, findScenario, taskRef } from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/** One scenario offered by a course's current version: what a student is graded on. */
export const load = (async ({ locals, params, url }) => {
	const doc = await courseVersion(locals, params.code, url);
	const { scenario, offeredBy } = findScenario(doc, params.id);

	return {
		course: { code: doc.course.code, title: doc.course.title },
		version: versionOf(doc),
		scenario: {
			id: scenario.id,
			name: scenario.name,
			airport: scenario.airport,
			position: scenario.position,
			difficulty: scenario.difficulty,
			mode: scenario.mode,
			retired: scenario.retired
		},
		practicalTasks: scenario.practicalTasks.map((pt) => ({
			id: pt.id,
			task: taskRef(pt.task),
			required: pt.required
		})),
		offeredBy: offeredBy.map((lp) => ({ id: lp.id, code: lp.code, title: lp.title }))
	};
}) satisfies PageServerLoad;
