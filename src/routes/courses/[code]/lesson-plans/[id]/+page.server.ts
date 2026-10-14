import { currentVersion, findLessonPlan, taskRef } from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/** One lesson plan of a course's current version. */
export const load = (async ({ locals, params }) => {
	const doc = await currentVersion(locals, params.code);
	const { module, lessonPlan } = findLessonPlan(doc, params.id);

	return {
		course: { code: doc.course.code, title: doc.course.title },
		version: { number: doc.version.number, isDraft: doc.version.status === 'draft' },
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
		theoryItems: lessonPlan.theoryItems.map((item) => ({ id: item.id, task: taskRef(item.task) }))
	};
}) satisfies PageServerLoad;
