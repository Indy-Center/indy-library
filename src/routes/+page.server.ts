import { count, weeks } from '$lib/format';
import { fromCms, maySeeDraft } from '$lib/server/reader';
import type { CourseVersionDocument } from '$lib/server/cms/types';
import type { PageServerLoad } from './$types';

/** The facts line of a course's row: each part is left out when the document has none. */
function factsOf(doc: CourseVersionDocument | null): string[] {
	if (!doc) return [];
	const { course } = doc;
	const facts: string[] = [];
	if (course.prerequisites.length > 0) {
		facts.push(`Needs ${course.prerequisites.map((row) => row.anyOf.join(' or ')).join(', ')}`);
	}
	if (course.credentialIssued) {
		facts.push(
			`Earns ${course.credentialIssued}${course.ratingExam ? ` and the ${course.ratingExam} rating` : ''}`
		);
	}
	if (course.estimatedWeeks) facts.push(weeks(course.estimatedWeeks));
	const lessonPlans = doc.modules.reduce((n, module) => n + module.lessonPlans.length, 0);
	facts.push(count(lessonPlans, 'lesson plan'));
	return facts;
}

/**
 * Every course with a current version, with its facts from that version. A course never yet
 * published is not listed, except to those who may see its draft, and then its facts come from
 * the draft. A draft is fetched only for a reader who may see it, and only when there is no
 * current version to read the facts from.
 */
export const load = (async ({ locals }) => {
	const { courses } = await fromCms(() => locals.cms.courseList());

	const rows = await Promise.all(
		courses.map(async (course) => {
			const draft =
				course.draftVersion && maySeeDraft(locals.session, course)
					? course.draftVersion.number
					: null;
			const hasCurrent = course.currentVersion !== null;
			if (!hasCurrent && draft === null) return null;
			const doc = await fromCms(() =>
				locals.cms.courseVersion(course.code, hasCurrent ? 'current' : 'draft')
			);
			return {
				code: course.code,
				title: course.title,
				hasCurrent,
				draft,
				facts: factsOf(doc)
			};
		})
	);

	return { courses: rows.filter((row) => row !== null) };
}) satisfies PageServerLoad;
