import { error } from '@sveltejs/kit';
import { CmsUnavailableError } from '$lib/server/cms';
import type { CourseVersionDocument, LessonPlan, Scenario, TaskRef } from '$lib/server/cms/types';

/**
 * What a reader may see, decided per request. Every page load goes through here rather than
 * reading `locals.cms` itself.
 */

/** Runs a read from the CMS, turning "the CMS is down and nothing is kept" into a 503 page. */
export async function fromCms<T>(read: () => Promise<T>): Promise<T> {
	try {
		return await read();
	} catch (err) {
		if (err instanceof CmsUnavailableError) {
			console.error('[indy-library]', err);
			error(503, 'The library cannot reach its courses right now. Try again in a few minutes.');
		}
		throw err;
	}
}

/** The course's current version, or a 404. Older published versions are never read. */
export async function currentVersion(
	locals: App.Locals,
	code: string
): Promise<CourseVersionDocument> {
	const doc = await fromCms(() => locals.cms.courseVersion(code, 'current'));
	if (!doc) error(404, 'There is no such course.');
	return doc;
}

/** A lesson plan of the version, with the module it sits in, or a 404. */
export function findLessonPlan(
	doc: CourseVersionDocument,
	id: string
): { module: CourseVersionDocument['modules'][number]; lessonPlan: LessonPlan } {
	for (const module of doc.modules) {
		const lessonPlan = module.lessonPlans.find((lp) => lp.id === id);
		if (lessonPlan) return { module, lessonPlan };
	}
	error(404, 'This course has no such lesson plan.');
}

/**
 * A scenario the version offers, with the lesson plans that offer it, or a 404. A scenario
 * belongs to its course, but the version only carries those its lesson plans offer, so one no
 * lesson plan of this version offers is not shown.
 */
export function findScenario(
	doc: CourseVersionDocument,
	id: string
): { scenario: Scenario; offeredBy: LessonPlan[] } {
	const offeredBy = doc.modules
		.flatMap((module) => module.lessonPlans)
		.filter((lp) => lp.scenarios.some((s) => s.id === id));
	const scenario = offeredBy[0]?.scenarios.find((s) => s.id === id);
	if (!scenario) error(404, 'This course offers no such scenario.');
	return { scenario, offeredBy };
}

/** A task as a link to its page shows it. */
export function taskRef(task: TaskRef): TaskRef {
	return { id: task.id, number: task.number, name: task.name };
}
