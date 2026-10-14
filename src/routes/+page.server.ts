import { fromCms, maySeeDraft } from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/**
 * Every course with a current version. A course never yet published is not listed, except to
 * those who may see its draft. Only the course list is read here; no draft is fetched.
 */
export const load = (async ({ locals }) => {
	const { courses } = await fromCms(() => locals.cms.courseList());

	return {
		courses: courses.flatMap((course) => {
			const draft =
				course.draftVersion && maySeeDraft(locals.session, course)
					? course.draftVersion.number
					: null;
			const hasCurrent = course.currentVersion !== null;
			if (!hasCurrent && draft === null) return [];
			return [{ code: course.code, title: course.title, hasCurrent, draft }];
		})
	};
}) satisfies PageServerLoad;
