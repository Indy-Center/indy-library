import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * A scenario has no page of its own (decision 0075): its old URL goes to the course page, keeping
 * the draft when it asked for one. It reads nothing, so an unknown scenario redirects too and an
 * unknown course is the course page's 404.
 */
export const GET: RequestHandler = ({ params, url }) => {
	const draft = url.searchParams.get('version') === 'draft' ? '?version=draft' : '';
	redirect(308, `/courses/${params.code}${draft}`);
};
