import { fromCms } from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/** Every course with a current version. A course never yet published is not listed. */
export const load = (async ({ locals }) => {
	const { courses } = await fromCms(() => locals.cms.courseList());

	return {
		courses: courses
			.filter((course) => course.currentVersion !== null)
			.map((course) => ({ code: course.code, title: course.title }))
	};
}) satisfies PageServerLoad;
