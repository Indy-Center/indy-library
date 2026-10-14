import type { SessionContext } from '@indy-center/identity';

/**
 * A signed-in reader as identity would describe them. Only the fields the library reads are
 * filled in.
 */
export function session(cid: string, roles: string[] = []): SessionContext {
	return {
		user: {
			id: `user-${cid}`,
			cid,
			email: '',
			isActive: true,
			vatsimData: { personal: { name_full: `Reader ${cid}` } },
			attributes: {},
			createdAt: 0,
			updatedAt: 0
		},
		roles,
		sessionExpiresAt: new Date(0),
		activeSession: null,
		activeFlightPlan: null
	} as unknown as SessionContext;
}
