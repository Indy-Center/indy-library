import { courseVersion, versionOf, findLessonPlan, taskRef } from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/** One lesson plan of the course version the reader asked for. */
export const load = (async ({ locals, params, url }) => {
	const doc = await courseVersion(locals, params.code, url);
	const { module, lessonPlan } = findLessonPlan(doc, params.id);

	return {
		course: { code: doc.course.code, title: doc.course.title },
		version: versionOf(doc),
		module: { title: module.title },
		lessonPlan: {
			id: lessonPlan.id,
			code: lessonPlan.code,
			title: lessonPlan.title,
			description: lessonPlan.description,
			bodyHtml: lessonPlan.bodyHtml,
			time: lessonPlan.time,
			isExam: lessonPlan.isExam,
			minimum: lessonPlan.minimum?.label ?? null
		},
		theoryItems: lessonPlan.theoryItems.map((item) => ({ id: item.id, task: taskRef(item.task) })),
		scenarios: lessonPlan.scenarios.map((scenario) => ({
			id: scenario.id,
			name: scenario.name,
			airport: scenario.airport,
			position: scenario.position,
			difficulty: scenario.difficulty,
			mode: scenario.mode
		}))
	};
}) satisfies PageServerLoad;
