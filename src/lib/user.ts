import type { User } from '@indy-center/identity';

/**
 * Identity's User nests the VATSIM profile and keeps almost every field optional, so the
 * fallback chain lives here rather than in every component that renders a name.
 */
export function displayName(user: User): string {
	const preferred = user.attributes?.preferredName?.trim();
	if (preferred) return preferred;

	const personal = user.vatsimData?.personal;
	const full = personal?.name_full?.trim();
	if (full) return full;

	const parts = [personal?.name_first, personal?.name_last].filter(Boolean).join(' ').trim();
	if (parts) return parts;

	return user.cid;
}
