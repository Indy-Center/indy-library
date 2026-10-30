import { describe, expect, it } from 'vitest';
import type { SessionContext } from '@indy-center/identity';
import { catalogue } from '$lib/testing/fixtures';
import { fakeCms, library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load } from './+layout.server';
import { load as scenarioLoad } from './courses/[code]/scenarios/[id]/+page.server';
import { load as taskLoad } from './tasks/[id]/+page.server';

/** A reader whose VATSIM profile carries a controller and a pilot rating, as identity sends them. */
function rated(cid: string): SessionContext {
	const reader = session(cid);
	reader.user.vatsimData = {
		...reader.user.vatsimData!,
		vatsim: {
			rating: { id: 3, short: 'S2', long: 'Tower Trainee' },
			pilotrating: { id: 1, short: 'PPL', long: 'Private Pilot License' }
		}
	};
	return reader;
}

function layoutEvent(
	reader: SessionContext | null,
	lib = library(),
	href = '/',
	params: Record<string, string> = {}
) {
	return {
		...lib.event(reader, href, params),
		cookies: { get: () => undefined },
		platform: undefined
	};
}

const CATALOGUE = '/api/courseware/catalogue';

describe('root layout', () => {
	it("gives the header the reader's name, CID and ratings, by their short codes", async () => {
		const data = await run(load, layoutEvent(rated('1000002')));

		expect(data.member).toEqual({
			name: 'Reader 1000002',
			cid: '1000002',
			rating: 'S2',
			pilotRating: 'PPL'
		});
	});

	it('gives a reader with no ratings neither', async () => {
		const data = await run(load, layoutEvent(session('1000002')));

		expect(data.member).toEqual({ name: 'Reader 1000002', cid: '1000002' });
		expect(data.member).not.toHaveProperty('rating');
		expect(data.member).not.toHaveProperty('pilotRating');
	});

	describe('positions', () => {
		it("gives the page the catalogue's positions as the CMS serves them", async () => {
			const data = await run(load, layoutEvent(session('1000002')));

			expect(data.positions).toEqual(catalogue.positions);
		});

		it('gives none when the catalogue cannot be read and no copy is kept', async () => {
			const cms = fakeCms();
			cms.down();
			const data = await run(load, layoutEvent(session('1000002'), library({ cms })));

			expect(data.positions).toEqual([]);
		});

		it('reads the catalogue once for a page request that runs the layout and a page that needs it', async () => {
			const lib = library();
			const params = { code: 'S-GC', id: 'scn-quiet' };
			const event = layoutEvent(
				session('1000002'),
				lib,
				'/courses/S-GC/scenarios/scn-quiet',
				params
			);

			// SvelteKit runs the layout's and the page's server loads side by side, with one `locals`.
			await Promise.all([run(load, event), run(scenarioLoad, event)]);

			expect(lib.cms.asked(CATALOGUE)).toBe(1);
		});

		it('reads it once with a page that reads the whole catalogue itself', async () => {
			const lib = library();
			const event = layoutEvent(session('1000002'), lib, '/tasks/task-ground', {
				id: 'task-ground'
			});

			await Promise.all([run(load, event), run(taskLoad, event)]);

			expect(lib.cms.asked(CATALOGUE)).toBe(1);
		});
	});
});
