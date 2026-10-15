import { describe, expect, it } from 'vitest';
import { cmsDocuments, fakeCms, library, run } from '$lib/testing/library';
import { catalogue } from '$lib/testing/fixtures';
import { session } from '$lib/testing/readers';
import { load } from './+page.server';

const student = session('1000002');

function competencies(href = '/competencies') {
	return run(load, library().event(student, href));
}

describe('/competencies', () => {
	it('has a tab for each framework edition, in the order the CMS gives them', async () => {
		const data = await competencies();

		expect(data.tabs).toEqual([
			{ id: 'fw-usa', name: 'USA', edition: 'Example edition 1', current: true },
			{ id: 'fw-gcap', name: 'GCAP', edition: 'Example edition 2', current: false }
		]);
	});

	it('opens the edition the link names', async () => {
		const data = await competencies('/competencies?edition=fw-gcap');

		expect(data.tabs.map((t) => t.current)).toEqual([false, true]);
	});

	it('folds each top-level competency over everything beneath it, with their wording', async () => {
		const data = await competencies();

		expect(data.folds).toEqual([
			{
				from: '1',
				to: null,
				title: 'Ground operations',
				heading: true,
				shared: false,
				rows: [
					{
						id: 'comp-heading',
						sourceId: '1',
						label: 'Ground operations',
						wording: null,
						depth: 0,
						heading: true
					},
					{
						id: 'comp-usa-taxi',
						sourceId: '1.1',
						label: 'Taxi instructions',
						wording: 'Issues clear, correct taxi instructions.',
						depth: 1,
						heading: false
					}
				]
			}
		]);
	});

	it('folds neighbouring top-level competencies with the same title together, showing their text', async () => {
		const gcap = (sourceId: string, title: string, text: string) => ({
			id: `comp-${sourceId}`,
			frameworkId: 'fw-gcap',
			sourceId,
			title,
			text,
			parentId: null,
			sourceReference: '',
			rubricTheory: '',
			rubricPractical: '',
			pairedGcapCode: ''
		});
		const cms = fakeCms({
			...cmsDocuments(),
			'/api/courseware/catalogue': {
				...catalogue,
				competencies: [
					gcap('A.2.a.1', 'General', 'Knows the airport layout.'),
					gcap('A.2.a.2', 'General', 'Knows the local procedures.'),
					gcap('A.2.b.1', 'Clearance Delivery Concepts', 'Issues IFR clearances.'),
					gcap('A.3.a.1', 'General', 'Knows the runway configurations.')
				]
			}
		});
		const data = await run(load, library({ cms }).event(student, '/competencies?edition=fw-gcap'));

		expect(
			data.folds.map(({ rows, ...fold }) => ({ ...fold, rows: rows.map((r) => r.label) }))
		).toEqual([
			{
				from: 'A.2.a.1',
				to: 'A.2.a.2',
				title: 'General',
				heading: true,
				shared: true,
				rows: ['Knows the airport layout.', 'Knows the local procedures.']
			},
			{
				from: 'A.2.b.1',
				to: null,
				title: 'Clearance Delivery Concepts',
				heading: false,
				shared: false,
				rows: ['Clearance Delivery Concepts']
			},
			{
				from: 'A.3.a.1',
				to: null,
				title: 'General',
				heading: false,
				shared: false,
				rows: ['General']
			}
		]);
		expect(data.folds[0].rows.map((r) => r.wording)).toEqual([null, null]);
	});

	it('is a 404 for an edition that does not exist', async () => {
		await expect(competencies('/competencies?edition=fw-none')).rejects.toMatchObject({
			status: 404
		});
	});
});
