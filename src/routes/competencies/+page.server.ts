import { error } from '@sveltejs/kit';
import { fromCms } from '$lib/server/reader';
import type { Competency } from '$lib/server/cms/types';
import type { PageServerLoad } from './$types';

/**
 * Every competency of one framework edition, with a tab for each edition.
 * (courseware, decisions/0049-the-library-lists-competencies.md)
 */
export const load = (async ({ locals, url }) => {
	const catalogue = await fromCms(() => locals.cms.catalogue());
	const wanted = url.searchParams.get('edition');
	const framework = wanted
		? catalogue.frameworks.find((f) => f.id === wanted)
		: catalogue.frameworks[0];
	if (wanted && !framework) error(404, 'There is no such framework edition.');

	const competencies = catalogue.competencies.filter((c) => c.frameworkId === framework?.id);
	const ids = new Set(competencies.map((c) => c.id));
	const children = (c: Competency) => competencies.filter((child) => child.parentId === c.id);
	const roots = competencies.filter((c) => !c.parentId || !ids.has(c.parentId));

	// A row shows its title, with its wording beneath, unless the fold is already named by it.
	const rows = (c: Competency, depth: number, foldTitle: string | null): Row[] => {
		const showTitle = !!c.title && c.title !== foldTitle;
		return [
			{
				id: c.id,
				sourceId: c.sourceId,
				label: showTitle ? c.title : c.text,
				wording: showTitle && c.text ? c.text : null,
				depth,
				heading: !c.text
			},
			...children(c).flatMap((child) => rows(child, depth + 1, foldTitle))
		];
	};

	// Neighbouring top-level competencies with the same title fold together under it: GCAP writes
	// its topic once per group, and the groups are not competencies of their own.
	const groups: Competency[][] = [];
	for (const c of roots) {
		const last = groups.at(-1);
		if (last && c.title && last[0].title === c.title) last.push(c);
		else groups.push([c]);
	}

	return {
		tabs: catalogue.frameworks.map((f) => ({
			id: f.id,
			name: f.name,
			edition: f.edition,
			current: f.id === framework?.id
		})),
		folds: groups.map((group) => {
			const [first] = group;
			const shared = group.length > 1;
			return {
				from: first.sourceId,
				to: shared ? group[group.length - 1].sourceId : null,
				title: first.title || first.text,
				heading: shared || !first.text,
				shared,
				rows: group.flatMap((c) => rows(c, 0, shared ? first.title : null))
			};
		})
	};
}) satisfies PageServerLoad;

type Row = {
	id: string;
	sourceId: string;
	label: string;
	wording: string | null;
	depth: number;
	heading: boolean;
};
