import { courseSummary, courseVersion, maySeeDraft, versionOf } from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/**
 * A course's current version, or its draft for those who may see it: its modules in order, each
 * with its lesson plans.
 */
export const load = (async ({ locals, params, url }) => {
	const doc = await courseVersion(locals, params.code, url);
	const isDraft = doc.version.status === 'draft';
	const summary = await courseSummary(locals, params.code);

	// Built field by field rather than passed through, so nothing the reader may not see (teacher
	// notes, authors) reaches the browser by accident.
	return {
		course: { code: doc.course.code, title: doc.course.title },
		version: {
			...versionOf(doc),
			description: doc.version.description,
			time: doc.version.time,
			academyRequired: doc.version.academyRequired
		},
		// The draft's number, to link to it from the current version, for those who may see it.
		draft:
			!isDraft && summary?.draftVersion && maySeeDraft(locals.session, summary)
				? summary.draftVersion.number
				: null,
		// Whether there is a current version to link back to from the draft.
		hasCurrent: Boolean(summary?.currentVersion),
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
