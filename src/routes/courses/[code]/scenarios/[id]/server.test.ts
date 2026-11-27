import { describe, expect, it } from 'vitest';
import { library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { GET } from './+server';

/** What `GET` redirects to: SvelteKit's `redirect` throws a `Redirect`. */
async function redirectOf(href: string, params: { code: string; id: string }) {
	const lib = library();
	try {
		await run(GET, lib.event(session('1000002'), href, params));
	} catch (thrown) {
		return { thrown, lib };
	}
	throw new Error('did not redirect');
}

describe('/courses/[code]/scenarios/[id]', () => {
	it('redirects to the course page', async () => {
		const { thrown } = await redirectOf('/courses/S-GC/scenarios/scn-quiet', {
			code: 'S-GC',
			id: 'scn-quiet'
		});

		expect(thrown).toMatchObject({ status: 308, location: '/courses/S-GC' });
	});

	it('keeps the draft, and drops any other query', async () => {
		const { thrown } = await redirectOf('/courses/S-GC/scenarios/scn-quiet?version=draft&x=1', {
			code: 'S-GC',
			id: 'scn-quiet'
		});

		expect(thrown).toMatchObject({ status: 308, location: '/courses/S-GC?version=draft' });
	});

	it('redirects a scenario the course does not have, asking the CMS nothing', async () => {
		const { thrown, lib } = await redirectOf('/courses/S-GC/scenarios/scn-none', {
			code: 'S-GC',
			id: 'scn-none'
		});

		expect(thrown).toMatchObject({ status: 308, location: '/courses/S-GC' });
		expect(lib.cms.requests).toEqual([]);
	});
});
