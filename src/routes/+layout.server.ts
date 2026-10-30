import { readTimeZone } from '@indy-center/centerline-svelte/server';
import type { HeaderMember } from '@indy-center/centerline-svelte';
import type { User } from '@indy-center/identity';
import { resolveIdentityUrl } from '$lib/server/identity';
import { cataloguePositions } from '$lib/server/reader';
import { displayName } from '$lib/user';
import type { LayoutServerLoad } from './$types';

/**
 * The header's member: name, CID and VATSIM's controller and pilot ratings by their short codes,
 * each rating left out when identity has none. Only these four go to the browser, not
 * identity's whole user.
 */
function member(user: User): HeaderMember {
	const vatsim = user.vatsimData?.vatsim;
	const rating = vatsim?.rating?.short;
	const pilotRating = vatsim?.pilotrating?.short;
	return {
		name: displayName(user),
		cid: user.cid,
		...(rating ? { rating } : {}),
		...(pilotRating ? { pilotRating } : {})
	};
}

/**
 * Header data and the page's positions. Nothing here gates anything: `handle` does that, and a
 * layout load is the wrong place for it.
 */
export const load = (async ({ locals, platform, cookies }) => {
	const user = locals.session?.user;
	return {
		member: user ? member(user) : undefined,
		// The header links out to identity's /login and /logout, so the browser needs to know where it is.
		identityUrl: resolveIdentityUrl(platform),
		// No `profile`: identity holds no time zone yet (identity time-zone 01).
		timeZone: readTimeZone(cookies),
		// For Centerline's `Position` (its positions lookup): only the catalogue's positions, never
		// the whole catalogue, which stays on the server. The library's own CMS read, so a page that
		// needs the catalogue too shares it.
		positions: await cataloguePositions(locals)
	};
}) satisfies LayoutServerLoad;
