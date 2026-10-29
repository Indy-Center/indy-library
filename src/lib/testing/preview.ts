import type { RequestEvent } from '@sveltejs/kit';
import type { SessionContext } from '@indy-center/identity';
import { createCms, memoryStore } from '$lib/server/cms';
import { createTeaching } from '$lib/server/teaching';
import { Role } from '$lib/permissions';
import { AUTHOR_CID } from './fixtures';
import { CMS_URL, TOKEN, cmsDocuments, fakeCms, fakeTraining } from './library';
import { session } from './readers';

/**
 * The dev preview (`PREVIEW=1 pnpm dev`): every page served from the test fixtures, as a reader
 * picked with `?as=<name>`, with no identity, CMS or training-tools running.
 *
 * Imported only by `handle`, inside an `import.meta.env.DEV` branch, with a dynamic `import()`,
 * so the Worker build never contains it.
 */

/** Remembers the picked reader for the browser session. */
export const PREVIEW_COOKIE = 'library_preview_as';

type PreviewReader = { cid: string; roles: string[]; teaches: string[] };

/** The readers the preview offers, by the name `?as=` picks them with. */
export const PREVIEW_READERS = {
	/** No roles, teaches nothing. */
	student: { cid: '1000002', roles: [], teaches: [] },
	/** Teaches S-GC, the fixtures' course with teacher notes. */
	teacher: { cid: '1000005', roles: [], teaches: ['S-GC'] },
	/** Listed in S-GC's authors, teaching nothing. */
	author: { cid: AUTHOR_CID, roles: [], teaches: [] },
	/** The Training Admin. */
	admin: { cid: '1000003', roles: [Role.ADMIN], teaches: [] }
} satisfies Record<string, PreviewReader>;

export type PreviewReaderName = keyof typeof PREVIEW_READERS;

const DEFAULT_READER: PreviewReaderName = 'student';

function isReaderName(name: string): name is PreviewReaderName {
	return Object.hasOwn(PREVIEW_READERS, name);
}

/**
 * The reader for this request: `?as=` when given (and remembered in the cookie), else the
 * cookie's, else `student`. An unknown name falls back to `student`, logging the names there are.
 */
function pickReader(event: RequestEvent): PreviewReaderName {
	const asked = event.url.searchParams.get('as') ?? event.cookies.get(PREVIEW_COOKIE);
	let name = DEFAULT_READER;
	if (asked && isReaderName(asked)) {
		name = asked;
	} else if (asked) {
		console.warn(
			`[indy-library] preview: no reader "${asked}"; showing ${DEFAULT_READER}. ` +
				`Readers: ${Object.keys(PREVIEW_READERS).join(', ')}`
		);
	}
	if (event.url.searchParams.has('as')) {
		// No maxAge or expires: a session cookie, gone when the browser closes.
		event.cookies.set(PREVIEW_COOKIE, name, { path: '/', httpOnly: true, sameSite: 'lax' });
	}
	return name;
}

/** What `handle` puts on `locals` in the preview, in place of identity, the CMS and training-tools. */
export function previewLocals(
	event: RequestEvent
): Pick<App.Locals, 'session' | 'cms' | 'teaching'> {
	const reader = PREVIEW_READERS[pickReader(event)];
	const reading: SessionContext = session(reader.cid, reader.roles);
	return {
		session: reading,
		cms: createCms({
			baseUrl: CMS_URL,
			token: TOKEN,
			fetch: fakeCms(cmsDocuments()).fetch,
			store: memoryStore()
		}),
		teaching: createTeaching(fakeTraining({ [reader.cid]: reader.teaches }).binding)
	};
}
