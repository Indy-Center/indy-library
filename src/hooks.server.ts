import { redirect, type Handle } from '@sveltejs/kit';
import { getSessionContext, resolveIdentityUrl } from '$lib/server/identity';
import { loginUrl } from '$lib/identity-links';
import { cacheApiStore, createCms, memoryStore, type Cms } from '$lib/server/cms';

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
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = await getSessionContext(event);

	if (!event.locals.session) {
		// event.url.href is absolute; identity 400s on a bare path.
		redirect(302, loginUrl(resolveIdentityUrl(event.platform), event.url.href));
	}

	event.locals.cms = cmsFor(event.platform);
	return resolve(event);
};

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
