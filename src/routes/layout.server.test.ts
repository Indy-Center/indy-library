import { describe, expect, it } from 'vitest';
import type { SessionContext } from '@indy-center/identity';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { load } from './+layout.server';

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

function layoutEvent(reader: SessionContext | null) {
	return {
		...library().event(reader, '/'),
		cookies: { get: () => undefined },
		platform: undefined
	};
}

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
});
