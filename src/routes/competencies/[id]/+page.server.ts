import { error } from '@sveltejs/kit';
import { fromCms, taskRef } from '$lib/server/reader';
import type { PageServerLoad } from './$types';

/** One competency of a framework edition, and the tasks that teach it. */
export const load = (async ({ locals, params }) => {
	const catalogue = await fromCms(() => locals.cms.catalogue());
	const competencies = new Map(catalogue.competencies.map((c) => [c.id, c]));
	const tasks = new Map(catalogue.tasks.map((t) => [t.id, t]));

	const competency = competencies.get(params.id);
	if (!competency) error(404, 'There is no such competency.');
	const framework = catalogue.frameworks.find((f) => f.id === competency.frameworkId);
	const parent = competency.parentId ? competencies.get(competency.parentId) : undefined;

	// A task's mappings already include those inherited from the tasks above it, so this finds
	// every task that teaches the competency, in tree order.
	const mapped = catalogue.tasks.flatMap((task) => {
		const mapping = task.mappings.find((m) => m.competencyId === competency.id);
		if (!mapping) return [];
		const from = mapping.fromTaskId === task.id ? undefined : tasks.get(mapping.fromTaskId);
		return [
			{ task: taskRef(task), retired: task.retired, inheritedFrom: from ? taskRef(from) : null }
		];
	});

	return {
		competency: {
			id: competency.id,
			frameworkId: competency.frameworkId,
			sourceId: competency.sourceId,
			title: competency.title,
			text: competency.text,
			sourceReference: competency.sourceReference,
			pairedGcapCode: competency.pairedGcapCode
		},
		framework: framework ? { name: framework.name, edition: framework.edition } : null,
		parent: parent ? { id: parent.id, sourceId: parent.sourceId, title: parent.title } : null,
		children: catalogue.competencies
			.filter((c) => c.parentId === competency.id)
			.map((c) => ({ id: c.id, sourceId: c.sourceId, title: c.title })),
		rubric: {
			theory: competency.rubricTheory || null,
			practical: competency.rubricPractical || null
		},
		tasks: mapped
	};
}) satisfies PageServerLoad;
