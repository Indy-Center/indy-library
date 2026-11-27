import {
	catalogueOrEmpty,
	courseVersion,
	findLessonPlan,
	lessonPlanForReader,
	makeShownPosition,
	versionOf
} from '$lib/server/reader';
import type { GradePoint } from '$lib/server/cms/types';
import { lessonPlanTasks } from './tasks';
import type { PageServerLoad } from './$types';

/** A grade point as the page names it: its label and its description's words before the colon. */
function gradeName(point: GradePoint): string {
	const name = point.description.split(':')[0].trim();
	return name ? `${point.label} (${name})` : point.label;
}

/**
 * One lesson plan of the course version the reader asked for (decision 0076). Teacher-only
 * material comes only from `lessonPlanForReader`, which leaves it out for a reader who may not
 * see it.
 */
export const load = (async ({ locals, params, url }) => {
	const doc = await courseVersion(locals, params.code, url);
	const found = findLessonPlan(doc, params.id);
	const { module } = found;
	const [{ lessonPlan, showsTeacherOnly }, catalogue, shownPosition] = await Promise.all([
		lessonPlanForReader(locals, doc.course.code, found.lessonPlan),
		// The same catalogue read as the root layout's positions: the CMS client reads it once a
		// request.
		catalogueOrEmpty(locals),
		makeShownPosition(locals)
	]);

	// The course's order runs across modules: module order, then lesson plan order.
	const inOrder = doc.modules.flatMap((m) => m.lessonPlans);
	const at = inOrder.indexOf(found.lessonPlan);
	const neighbour = (i: number) => {
		const lp = inOrder[i];
		return lp ? { id: lp.id, code: lp.code, title: lp.title } : null;
	};

	return {
		course: { code: doc.course.code, title: doc.course.title },
		version: versionOf(doc),
		module: { title: module.title },
		lessonPlan: {
			id: lessonPlan.id,
			moduleNumber: doc.modules.indexOf(module) + 1,
			code: lessonPlan.code,
			title: lessonPlan.title,
			description: lessonPlan.description,
			bodyHtml: lessonPlan.bodyHtml,
			time: lessonPlan.time,
			isExam: lessonPlan.isExam,
			minimum: lessonPlan.minimum ? gradeName(lessonPlan.minimum) : null
		},
		showsTeacherNotes: showsTeacherOnly,
		resources: lessonPlan.resources.map((r) => ({
			id: r.id,
			title: r.title,
			url: r.url,
			teacherOnly: r.teacherOnly,
			note: r.note
		})),
		tasks: lessonPlanTasks(lessonPlan.tasks, catalogue),
		scenarios: lessonPlan.scenarios.map((scenario) => ({
			id: scenario.id,
			name: scenario.name,
			airport: scenario.airport,
			retired: scenario.retired,
			studentPosition: shownPosition(scenario.studentPosition),
			teacherPosition: scenario.teacherPosition ? shownPosition(scenario.teacherPosition) : null,
			description: scenario.description,
			events:
				scenario.events?.map((e) => ({
					id: e.id,
					difficulty: e.difficulty,
					callsign: e.callsign,
					aircraftType: e.aircraftType,
					description: e.description
				})) ?? null,
			atctrainer: scenario.atctrainer?.trim() ? scenario.atctrainer : null
		})),
		previous: neighbour(at - 1),
		next: neighbour(at + 1)
	};
}) satisfies PageServerLoad;
