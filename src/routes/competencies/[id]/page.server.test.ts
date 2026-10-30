import { describe, expect, it } from 'vitest';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load } from './+page.server';

const student = session('1000002');

function competency(id: string) {
	return run(load, library().event(student, `/competencies/${id}`, { id }));
}

describe('/competencies/[id]', () => {
	it('shows its text and framework edition', async () => {
		const data = await competency('comp-usa-taxi');

		expect(data.competency).toMatchObject({
			sourceId: '1.1',
			title: 'Taxi instructions',
			text: 'Issues clear, correct taxi instructions.',
			sourceReference: 'Example Order 1-2-3',
			pairedGcapCode: 'G-9.9',
			frameworkId: 'fw-usa'
		});
		expect(data.framework).toEqual({ name: 'USA', edition: 'Example edition 1' });
		expect(data.parent).toEqual({ id: 'comp-heading', sourceId: '1', title: 'Ground operations' });
	});

	it('shows the rating exam rubric wording when there is some', async () => {
		expect((await competency('comp-usa-taxi')).rubric).toEqual({
			theory: 'Explains each part of a taxi instruction.',
			practical: 'Issues taxi instructions without prompting.'
		});
		expect((await competency('comp-gcap-move')).rubric).toEqual({ theory: null, practical: null });
	});

	it('lists the tasks mapped to it, including those inheriting the mapping', async () => {
		const data = await competency('comp-usa-taxi');

		expect(data.tasks).toEqual([
			{
				task: { id: 'task-ground', number: '1', name: 'Ground movement' },
				retired: false,
				inheritedFrom: null
			},
			{
				task: { id: 'task-taxi-clearance', number: '1.1', name: 'Issue a taxi clearance' },
				retired: false,
				inheritedFrom: { id: 'task-ground', number: '1', name: 'Ground movement' }
			},
			{
				task: { id: 'task-readback', number: '1.1.1', name: 'Check the readback' },
				retired: false,
				inheritedFrom: { id: 'task-ground', number: '1', name: 'Ground movement' }
			},
			{
				task: { id: 'task-progressive', number: '1.2', name: 'Give progressive taxi' },
				retired: false,
				inheritedFrom: { id: 'task-ground', number: '1', name: 'Ground movement' }
			}
		]);
	});

	it('lists a retired task mapped to it, marked retired and not inherited', async () => {
		const data = await competency('comp-gcap-move');

		expect(data.tasks).toContainEqual({
			task: { id: 'task-retired-strip', number: '4', name: 'Mark a flight strip' },
			retired: true,
			inheritedFrom: null
		});
	});

	it('is a 404 for a competency that does not exist', async () => {
		await expect(competency('comp-none')).rejects.toMatchObject({ status: 404 });
	});
});
