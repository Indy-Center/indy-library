import { resolveIdentityUrl } from '$lib/server/identity';
import { displayName } from '$lib/user';
import type { LayoutServerLoad } from './$types';

/**
 * Header data only. Nothing here gates anything: `handle` does that, and a layout load is the
 * wrong place for it. Only the name and CID go to the browser, not identity's whole user.
 */
export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const user = locals.session?.user;
	return {
		reader: user ? { name: displayName(user), cid: user.cid } : null,
		// The header links out to identity's /logout, so the browser needs to know where it is.
		identityUrl: resolveIdentityUrl(platform)
	};
};
