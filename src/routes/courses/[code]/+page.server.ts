import { currentVersion } from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/** A course's current version: its modules in order, each with its lesson plans. */
export const load = (async ({ locals, params }) => {
	const doc = await currentVersion(locals, params.code);

	// Built field by field rather than passed through, so nothing the reader may not see (teacher
	// notes, authors) reaches the browser by accident.
	return {
		course: { code: doc.course.code, title: doc.course.title },
		version: {
			number: doc.version.number,
			isDraft: doc.version.status === 'draft',
			description: doc.version.description,
			time: doc.version.time,
			academyRequired: doc.version.academyRequired
		},
		modules: doc.modules.map((module) => ({
			id: module.id,
			title: module.title,
			description: module.description,
			lessonPlans: module.lessonPlans.map((lp) => ({
				id: lp.id,
				code: lp.code,
				title: lp.title,
				description: lp.description,
				time: lp.time,
				isExam: lp.isExam
			}))
		}))
	};
}) satisfies PageServerLoad;
