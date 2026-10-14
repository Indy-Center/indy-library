import { error } from '@sveltejs/kit';
import { fromCms, taskRef } from '$lib/server/reader';
import type { CatalogueTask } from '$lib/server/cms/types';
import type { PageServerLoad } from './$types';

/** One task of the shared task tree, and its place in it. */
export const load = (async ({ locals, params }) => {
	const catalogue = await fromCms(() => locals.cms.catalogue());
	const byId = new Map(catalogue.tasks.map((t) => [t.id, t]));

	const task = byId.get(params.id);
	if (!task) error(404, 'There is no such task.');

	const ancestors: CatalogueTask[] = [];
	for (let up = task.parentId; up; up = byId.get(up)?.parentId ?? null) {
		const parent = byId.get(up);
		if (!parent || ancestors.includes(parent)) break;
		ancestors.unshift(parent);
	}

	return {
		task: {
			id: task.id,
			number: task.number,
			name: task.name,
			description: task.description,
			retired: task.retired
		},
		ancestors: ancestors.map(taskRef),
		// The catalogue is in tree order, so siblings come out in theirs.
		children: catalogue.tasks.filter((t) => t.parentId === task.id).map(taskRef)
	};
}) satisfies PageServerLoad;
