import {
	courseVersion,
	findLessonPlan,
	hasTeacherNotes,
	maySeeTeacherNotes,
	taskRef,
	teacherNotes,
	versionOf
} from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/** One lesson plan of the course version the reader asked for. */
export const load = (async ({ locals, params, url }) => {
	const doc = await courseVersion(locals, params.code, url);
	const { module, lessonPlan } = findLessonPlan(doc, params.id);
	const showsTeacherNotes =
		hasTeacherNotes(lessonPlan.theoryItems) && (await maySeeTeacherNotes(locals, doc.course.code));

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
		showsTeacherNotes,
		theoryItems: lessonPlan.theoryItems.map((item) => ({
			id: item.id,
			task: taskRef(item.task),
			teacherNotes: teacherNotes(item.teacherNotes, showsTeacherNotes)
		})),
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
