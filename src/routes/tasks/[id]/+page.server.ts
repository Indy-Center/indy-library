import { error } from '@sveltejs/kit';
import { fromCms, taskRef } from '$lib/server/reader';
import type { CatalogueTask } from '$lib/server/cms/types';
import type { PageServerLoad } from './$types';

/** One task of the shared task tree: its place in it, its mappings and its citations. */
export const load = (async ({ locals, params }) => {
	const catalogue = await fromCms(() => locals.cms.catalogue());
	const tasks = new Map(catalogue.tasks.map((t) => [t.id, t]));
	const competencies = new Map(catalogue.competencies.map((c) => [c.id, c]));
	const frameworks = new Map(catalogue.frameworks.map((f) => [f.id, f]));
	const sources = new Map(catalogue.sources.map((s) => [s.id, s]));

	const task = tasks.get(params.id);
	if (!task) error(404, 'There is no such task.');

	const ancestors: CatalogueTask[] = [];
	for (let up = task.parentId; up; up = tasks.get(up)?.parentId ?? null) {
		const parent = tasks.get(up);
		if (!parent || ancestors.includes(parent)) break;
		ancestors.unshift(parent);
	}

	// The CMS already applies a mapping to every task beneath the one it is written on;
	// `fromTaskId` says which task that was.
	const mappings = task.mappings.flatMap(({ competencyId, fromTaskId }) => {
		const competency = competencies.get(competencyId);
		const framework = competency && frameworks.get(competency.frameworkId);
		if (!competency || !framework) return [];
		const from = fromTaskId === task.id ? undefined : tasks.get(fromTaskId);
		return [
			{
				competency: { id: competency.id, sourceId: competency.sourceId, title: competency.title },
				framework: { name: framework.name, edition: framework.edition },
				inheritedFrom: from ? taskRef(from) : null
			}
		];
	});

	// `place` is where in the source, such as `3-7-2`; the citation's title is not shown yet.
	const citations = task.citations.flatMap(({ sourceId, place }) => {
		const source = sources.get(sourceId);
		if (!source) return [];
		return [{ name: source.name, edition: source.edition, url: source.url, section: place }];
	});

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
		children: catalogue.tasks.filter((t) => t.parentId === task.id).map(taskRef),
		mappings,
		citations
	};
}) satisfies PageServerLoad;
