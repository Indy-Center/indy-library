import { describe, expect, it } from 'vitest';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load } from './+page.server';

const student = session('1000002');

function task(id: string) {
	return run(load, library().event(student, `/tasks/${id}`, { id }));
}

describe('/tasks/[id]', () => {
	it("shows the task's number, name and description", async () => {
		const data = await task('task-taxi-clearance');

		expect(data.task).toMatchObject({
			number: '1.1',
			name: 'Issue a taxi clearance',
			description: 'Route, hold short, readback.',
			retired: false
		});
	});

	it('shows its place in the tree: the tasks above it, top first, and those beneath it', async () => {
		const data = await task('task-readback');

		expect(data.ancestors).toEqual([
			{ id: 'task-ground', number: '1', name: 'Ground movement' },
			{ id: 'task-taxi-clearance', number: '1.1', name: 'Issue a taxi clearance' }
		]);
		expect((await task('task-ground')).children).toEqual([
			{ id: 'task-taxi-clearance', number: '1.1', name: 'Issue a taxi clearance' },
			{ id: 'task-progressive', number: '1.2', name: 'Give progressive taxi' }
		]);
	});

	it('shows the competencies it is mapped to, including those inherited from above', async () => {
		const data = await task('task-readback');

		expect(data.mappings).toEqual([
			{
				competency: { id: 'comp-usa-taxi', sourceId: '1.1', title: 'Taxi instructions' },
				framework: { name: 'USA', edition: 'Example edition 1' },
				inheritedFrom: { id: 'task-ground', number: '1', name: 'Ground movement' }
			},
			{
				competency: { id: 'comp-gcap-move', sourceId: 'G-9.9', title: 'Movement area' },
				framework: { name: 'GCAP', edition: 'Example edition 2' },
				inheritedFrom: { id: 'task-taxi-clearance', number: '1.1', name: 'Issue a taxi clearance' }
			}
		]);
		expect((await task('task-ground')).mappings[0].inheritedFrom).toBeNull();
	});

	it('shows the sources it cites, with section and link', async () => {
		expect((await task('task-ground')).citations).toEqual([
			{ name: 'Example Order', edition: 'B', url: 'https://example.com/order', section: '3-7-2' }
		]);
		expect((await task('task-taxi-clearance')).citations).toEqual([
			{
				name: 'Example Notes',
				edition: '2',
				url: 'https://example.com/notes',
				section: 'Chapter 4'
			}
		]);
	});

	it('is a 404 for a task that does not exist', async () => {
		await expect(task('task-none')).rejects.toMatchObject({ status: 404 });
	});
});
