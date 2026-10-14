import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { handle } from './hooks.server';
import { session } from '$lib/testing/readers';

function requestTo(href: string, opts: { cookie?: string; signsIn?: boolean } = {}) {
	const identity = {
		getSessionContext: vi.fn(async () => (opts.signsIn ? session('1000002') : null))
	};
	const event = {
		url: new URL(href),
		cookies: { get: (name: string) => (name === 'fic_session' ? opts.cookie : undefined) },
		platform: {
			env: { PUBLIC_IDENTITY_URL: 'https://auth.flyindycenter.com', IDENTITY: identity }
		},
		locals: {}
	} as unknown as RequestEvent;
	return { event, identity };
}

describe('handle', () => {
	it('sends a reader with no session to identity, with an absolute return URL', async () => {
		const href = 'https://library.flyindycenter.com/courses/S-GC/lesson-plans/lp-1?version=draft';
		const { event } = requestTo(href);
		const resolve = vi.fn();

		await expect(handle({ event, resolve })).rejects.toMatchObject({
			status: 302,
			location: `https://auth.flyindycenter.com/login?return_url=${encodeURIComponent(href)}`
		});
		expect(resolve).not.toHaveBeenCalled();
	});

	it('sends a reader whose session identity no longer knows to identity', async () => {
		const { event } = requestTo('https://library.flyindycenter.com/', { cookie: 'expired' });

		await expect(handle({ event, resolve: vi.fn() })).rejects.toMatchObject({ status: 302 });
	});

	it('lets a signed-in reader through, with their session on locals', async () => {
		const { event, identity } = requestTo('https://library.flyindycenter.com/', {
			cookie: 'token',
			signsIn: true
		});
		const resolve = vi.fn(async () => new Response('ok'));

		await handle({ event, resolve });

		expect(identity.getSessionContext).toHaveBeenCalledWith('token');
		expect(resolve).toHaveBeenCalled();
		expect(event.locals.session?.user.cid).toBe('1000002');
		expect(event.locals.cms).toBeDefined();
		expect(event.locals.teaching).toBeDefined();
	});
});
