import { describe, expect, it } from 'vitest';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load } from './+page.server';

const student = session('1000002');

function scenario(lib: ReturnType<typeof library>, id: string, code = 'S-GC') {
	return run(load, lib.event(student, `/courses/${code}/scenarios/${id}`, { code, id }));
}

describe('/courses/[code]/scenarios/[id]', () => {
	it('shows the airport, position, difficulty and whether it is live or sim', async () => {
		const data = await scenario(library(), 'scn-quiet');

		expect(data.course).toEqual({ code: 'S-GC', title: 'Ground Control' });
		expect(data.scenario).toEqual({
			id: 'scn-quiet',
			name: 'A quiet afternoon at Example Field',
			airport: 'KXMP',
			position: 'XMP_GND',
			difficulty: 'Easy',
			mode: 'sim',
			retired: false
		});
	});

	it('lists its practical tasks in order, each required or optional', async () => {
		const data = await scenario(library(), 'scn-quiet');

		expect(data.practicalTasks).toEqual([
			{
				id: 'pt-1',
				task: { id: 'task-taxi-clearance', number: '1.1', name: 'Issue a taxi clearance' },
				required: true
			},
			{
				id: 'pt-2',
				task: { id: 'task-progressive', number: '1.2', name: 'Give progressive taxi' },
				required: false
			}
		]);
	});

	it('names the lesson plans that offer it', async () => {
		const data = await scenario(library(), 'scn-quiet');

		expect(data.offeredBy).toEqual([{ id: 'lp-taxi', code: 'S-GC-1', title: 'Taxi basics' }]);
	});

	it('sends a student no teacher notes', async () => {
		const data = await scenario(library(), 'scn-quiet');

		expect(JSON.stringify(data)).not.toContain('SECRET');
	});

	it('is a 404 for a scenario the current version does not offer', async () => {
		await expect(scenario(library(), 'scn-quiet', 'A-LC')).rejects.toMatchObject({
			status: 404
		});
	});
});
