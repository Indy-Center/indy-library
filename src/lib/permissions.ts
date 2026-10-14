/**
 * The identity roles the library reads. Identity owns who holds them; the library never grants
 * anything. `training:lead` is new and may not exist in identity yet, in which case it simply
 * reads false.
 */
export enum Role {
	/** The Training Admin. */
	ADMIN = 'training:admin',
	/** A lead instructor. */
	LEAD = 'training:lead'
}

/**
 * The Training Admin or a lead instructor: sees every course's teacher notes and every course's
 * draft.
 */
export function isTrainingStaff(roles?: string[] | null): boolean {
	if (!roles) return false;
	return roles.includes(Role.ADMIN) || roles.includes(Role.LEAD);
}
