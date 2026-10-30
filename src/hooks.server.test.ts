import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
// @ts-expect-error SvelteKit ships no types for its internal server module.
import { with_request_store } from '@sveltejs/kit/internal/server';
import { handle as chainedHandle } from './hooks.server';
import { session } from '$lib/testing/readers';
import { AUTHOR_CID } from '$lib/testing/fixtures';

beforeEach(() => {
	// A shell that exported PREVIEW must not change what these tests see.
	vi.stubEnv('PREVIEW', '');
});

afterEach(() => {
	vi.unstubAllEnvs();
});

/**
 * `handle` is a `sequence`, which SvelteKit runs inside a request store; run it in one with
 * tracing off, as the server does by default.
 */
const handle: typeof chainedHandle = (input) => {
	const event = Object.assign(input.event, {
		tracing: { enabled: false, root: {}, current: {} }
	});
	const state = {
		tracing: { record_span: ({ fn }: { fn: (span: object) => unknown }) => fn({}) }
	};
	return with_request_store({ event, state } as never, () => chainedHandle({ ...input, event }));
};

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

describe('handle, colour scheme and caching', () => {
	/** Renders `<html>` through whatever `transformPageChunk` the hooks chained onto `resolve`. */
	async function render(cookie?: string) {
		const { event } = requestTo('https://library.flyindycenter.com/', {
			cookie: 'token',
			signsIn: true
		});
		(event.cookies as { get: (name: string) => string | undefined }).get = (name) =>
			name === 'fic_session' ? 'token' : name === 'indy-color-scheme' ? cookie : undefined;
		let html = '';
		const response = await handle({
			event,
			resolve: async (_event, opts) => {
				html = opts?.transformPageChunk
					? ((await opts.transformPageChunk({
							html: '<!doctype html><html lang="en"><head></head></html>',
							done: true
						})) as string)
					: '';
				return new Response(html);
			}
		});
		return { html, response };
	}

	it('renders data-theme="light" for a reader whose cookie says light', async () => {
		expect((await render('light')).html).toContain('<html data-theme="light"');
	});

	it('renders data-theme="dark" for a reader with no cookie', async () => {
		expect((await render()).html).toContain('<html data-theme="dark"');
	});

	it('keeps pages out of shared caches', async () => {
		expect((await render()).response.headers.get('Cache-Control')).toBe('private');
	});
});

/** A request in the dev preview: no identity at all, and a cookie jar `handle` may write to. */
function previewRequestTo(href: string, jar: Record<string, string> = {}) {
	const set = vi.fn((name: string, value: string, _options: Record<string, unknown>) => {
		jar[name] = value;
	});
	const event = {
		url: new URL(href),
		cookies: { get: (name: string) => jar[name], set },
		platform: { env: {} },
		locals: {}
	} as unknown as RequestEvent;
	return { event, set, jar };
}

const ok = () => vi.fn(async () => new Response('ok'));

describe('handle, with PREVIEW=1', () => {
	beforeEach(() => {
		vi.stubEnv('PREVIEW', '1');
	});

	it('still sends a reader with no session to identity outside `vite dev`', async () => {
		vi.stubEnv('DEV', false);
		const { event } = requestTo('https://library.flyindycenter.com/?as=admin');
		const resolve = vi.fn();

		await expect(handle({ event, resolve })).rejects.toMatchObject({ status: 302 });
		expect(resolve).not.toHaveBeenCalled();
	});

	describe('under `vite dev`', () => {
		beforeEach(() => {
			vi.stubEnv('DEV', true);
		});

		it('gives ?as=admin a Training Admin session, and remembers the pick in a cookie', async () => {
			const { event, set } = previewRequestTo('http://localhost:5173/?as=admin');
			const resolve = ok();

			await handle({ event, resolve });

			expect(resolve).toHaveBeenCalled();
			expect(event.locals.session?.roles).toContain('training:admin');
			expect(set).toHaveBeenCalledWith(
				'library_preview_as',
				'admin',
				expect.objectContaining({ path: '/' })
			);
			// A session cookie: it lasts the browser session.
			const options = set.mock.calls[0][2];
			expect(options.maxAge).toBeUndefined();
			expect(options.expires).toBeUndefined();
		});

		it('keeps the reader the cookie remembers, on a page without ?as=', async () => {
			const { event, set } = previewRequestTo('http://localhost:5173/courses/S-GC', {
				library_preview_as: 'author'
			});

			await handle({ event, resolve: ok() });

			expect(event.locals.session?.user.cid).toBe(AUTHOR_CID);
			expect(set).not.toHaveBeenCalled();
		});

		it('is the student with neither ?as= nor the cookie', async () => {
			const { event } = previewRequestTo('http://localhost:5173/');

			await handle({ event, resolve: ok() });

			expect(event.locals.session?.roles).toEqual([]);
			expect(await event.locals.teaching.coursesTaught(event.locals.session!.user.cid)).toEqual([]);
		});

		it('falls back to the student on an unknown ?as=, naming the readers there are', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const { event, jar } = previewRequestTo('http://localhost:5173/?as=nobody');

			await handle({ event, resolve: ok() });

			expect(event.locals.session?.roles).toEqual([]);
			expect(jar.library_preview_as).toBe('student');
			expect(warn).toHaveBeenCalledWith(expect.stringContaining('student, teacher, author, admin'));
			warn.mockRestore();
		});

		it('gives the teacher S-GC to teach, and the CMS the fixtures', async () => {
			const { event } = previewRequestTo('http://localhost:5173/?as=teacher');

			await handle({ event, resolve: ok() });

			const cid = event.locals.session!.user.cid;
			expect(await event.locals.teaching.coursesTaught(cid)).toEqual(['S-GC']);
			const { courses } = await event.locals.cms.courseList();
			expect(courses.map((c) => c.code)).toEqual(['S-GC', 'A-LC', 'X-NEW']);
		});

		it('gives ?as=rated VATSIM controller and pilot ratings', async () => {
			const { event } = previewRequestTo('http://localhost:5173/?as=rated');

			await handle({ event, resolve: ok() });

			const vatsim = event.locals.session!.user.vatsimData?.vatsim;
			expect(vatsim?.rating?.short).toBe('C1');
			expect(vatsim?.pilotrating?.short).toBe('PPL');
		});

		it('adds the preview-only cases to what the CMS serves', async () => {
			const { event } = previewRequestTo('http://localhost:5173/');

			await handle({ event, resolve: ok() });

			const cases = await event.locals.cms.courseVersion('P-CASES', 'current');
			expect(cases!.modules[0].lessonPlans[0].bodyHtml).toContain('<img');
			const { frameworks, competencies } = await event.locals.cms.catalogue();
			const empty = frameworks.find((f) => f.id === 'fw-preview-empty')!;
			expect(competencies.filter((c) => c.frameworkId === empty.id)).toEqual([]);
			expect(competencies.filter((c) => c.frameworkId === 'fw-preview-deep')).toHaveLength(3);
		});
	});

	it('is imported by no test and by nothing but the preview, so the Worker build omits it', () => {
		const sources = import.meta.glob<string>('/src/**/*.{ts,svelte}', {
			query: '?raw',
			eager: true,
			import: 'default'
		});
		const importers = Object.entries(sources)
			.filter(([, source]) => /from\s+['"][^'"]*preview-fixtures['"]/.test(source))
			.map(([path]) => path);
		expect(importers).toEqual(['/src/lib/testing/preview.ts']);
	});
});
