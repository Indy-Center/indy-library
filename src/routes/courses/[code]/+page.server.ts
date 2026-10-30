import { courseSummary, courseVersion, fromCms, maySeeDraft, versionOf } from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/**
 * A course's current version, or its draft for those who may see it: its modules in order, each
 * with its lesson plans.
 */
export const load = (async ({ locals, params, url }) => {
	const doc = await courseVersion(locals, params.code, url);
	const isDraft = doc.version.status === 'draft';
	const summary = await courseSummary(locals, params.code);
	const { credentials } = await fromCms(() => locals.cms.catalogue());

	// A code the catalogue lacks keeps its bare code: name and kind are null.
	const credential = (code: string) => {
		const found = credentials.find((c) => c.code === code);
		return {
			code,
			name: found?.name ?? null,
			kind: found?.kind ?? null,
			retired: found?.retired ?? false
		};
	};

	// Built field by field rather than passed through, so nothing the reader may not see (teacher
	// notes, authors) reaches the browser by accident.
	return {
		course: {
			code: doc.course.code,
			title: doc.course.title
		},
		version: {
			...versionOf(doc),
			description: doc.version.description,
			time: doc.version.time,
			// As written, line breaks kept; null when blank.
			completionStandard: doc.version.completionStandard.trim()
				? doc.version.completionStandard
				: null
		},
		// The course's facts block (the same on the current edition and the draft).
		facts: {
			academyExam: doc.course.academyExam,
			estimatedWeeks: doc.course.estimatedWeeks,
			consolidation: doc.course.consolidation,
			ratingExam: doc.course.ratingExam,
			moodleUrl: doc.course.moodleUrl,
			prerequisites: doc.course.prerequisites.map((row) => row.anyOf.map(credential)),
			prerequisitesNote: doc.course.prerequisitesNote.trim() ? doc.course.prerequisitesNote : null,
			credentialIssued: doc.course.credentialIssued ? credential(doc.course.credentialIssued) : null
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
