import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { colorSchemeHandle } from '@indy-center/centerline-svelte/hooks';
import { getSessionContext, resolveIdentityUrl } from '$lib/server/identity';
import { loginUrl } from '$lib/identity-links';
import { cacheApiStore, createCms, memoryStore, type Cms } from '$lib/server/cms';
import { createTeaching } from '$lib/server/teaching';

/**
 * Loads the session once per request, then gates. Every page needs a session: there is no
 * public page, so a reader with none is sent to identity and brought back to the page they
 * asked for.
 *
 * The gate lives here rather than in a +layout.server.ts on purpose: a layout's server load
 * does not re-run on navigation beneath it, form actions run before any load, and +server.ts
 * endpoints never run one. A layout gate covers the first view and then quietly stops.
 * (training-tools, decisions/0004-gate-in-handle-not-layout.md)
 */
const libraryHandle: Handle = async ({ event, resolve }) => {
	// The dev preview (README "Local development"). `import.meta.env.DEV` is false in the Worker
	// build, so this branch and the module it imports are left out of it.
	if (import.meta.env.DEV && process.env.PREVIEW === '1') {
		const { previewLocals } = await import('$lib/testing/preview');
		Object.assign(event.locals, previewLocals(event));
		return resolve(event);
	}

	event.locals.session = await getSessionContext(event);

	if (!event.locals.session) {
		// event.url.href is absolute; identity 400s on a bare path.
		redirect(302, loginUrl(resolveIdentityUrl(event.platform), event.url.href));
	}

	event.locals.cms = cmsFor(event.platform);
	// Per request, so training-tools is asked at most once per request, and only by a page that
	// has teacher notes to decide on.
	event.locals.teaching = createTeaching(event.platform?.env.TRAINING);
	return resolve(event);
};

// Pages send no Cache-Control of their own, and they carry a reader's time zone (Centerline's
// time-zone page asks for `private`) and their teacher notes, so they stay out of shared caches.
const privatePages: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control', 'private');
	return response;
};

// The colour scheme comes first, so every page is drawn in the reader's scheme: dark until they
// choose.
export const handle: Handle = sequence(
	colorSchemeHandle({ fallback: 'dark' }) as Handle,
	privatePages,
	libraryHandle
);

/** Kept copies for `vite dev`, which may have no Cache API. Never used on Cloudflare. */
const devCopies = memoryStore();

function cmsFor(platform: App.Platform | undefined): Cms {
	const env = platform?.env;
	if (!env?.LIBRARY_API_TOKEN) {
		console.warn('[indy-library] LIBRARY_API_TOKEN is not set; the CMS will refuse every read');
	}
	const cache = platform?.caches?.default;
	return createCms({
		baseUrl: env?.CMS_URL ?? 'https://cms.flyindycenter.com',
		token: env?.LIBRARY_API_TOKEN,
		fetch: (input, init) => fetch(input, init),
		store: cache ? cacheApiStore(cache) : devCopies
	});
}
