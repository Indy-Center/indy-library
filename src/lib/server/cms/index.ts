import type { Catalogue, CourseList, CourseVersionDocument } from './types';

/**
 * Everything the library reads from the CMS, and the only place that talks to it.
 *
 * Each document is kept for a few minutes (`FRESH_MS`) so pages are quick and the CMS is not
 * asked on every request. When the CMS cannot be reached, answers with an error, or takes too
 * long, the last good copy is served instead for as long as `KEEP_MS`, so a CMS outage does not
 * stop a teacher mid-session. Only with no copy at all does a read fail, with
 * `CmsUnavailableError`.
 *
 * The documents include teacher notes and course authors. They are kept server-side only; the
 * page loads decide what each reader is sent.
 */
export type Cms = {
	/** Every course, with its current and draft version numbers. */
	courseList(): Promise<CourseList>;
	/**
	 * One whole course version, or null when the course has none of that kind. Ask for a draft
	 * only for a reader who may see it: drafts are fetched for nobody else.
	 */
	courseVersion(code: string, which: 'current' | 'draft'): Promise<CourseVersionDocument | null>;
	/** The task tree, frameworks, competencies and sources. */
	catalogue(): Promise<Catalogue>;
};

/** A document as it was fetched, and when. `body` is null for a document the CMS said is absent. */
export type KeptCopy = { fetchedAt: number; body: unknown };

/** Where copies are kept. The Workers Cache API in production, a Map in tests. */
export type CopyStore = {
	get(key: string): Promise<KeptCopy | undefined>;
	put(key: string, copy: KeptCopy): Promise<void>;
};

export class CmsUnavailableError extends Error {
	constructor(path: string, cause: unknown) {
		super(`The CMS could not be read for ${path}, and no copy is kept`, { cause });
		this.name = 'CmsUnavailableError';
	}
}

/** How long a copy is served without asking the CMS: published edits show within this. */
export const FRESH_MS = 5 * 60_000;
/**
 * The same for drafts, shorter so an author checking their draft sees their edit soon. Drafts
 * are read by few people, so this costs the CMS little.
 */
export const DRAFT_FRESH_MS = 60_000;
/** How long the last good copy is served while the CMS is failing. */
export const KEEP_MS = 7 * 24 * 60 * 60_000;
/** How long one request to the CMS may take before the kept copy is served instead. */
export const CMS_TIMEOUT_MS = 5_000;

export type CmsOptions = {
	/** The CMS's origin, e.g. `https://cms.flyindycenter.com`. */
	baseUrl: string;
	/** `LIBRARY_API_TOKEN`, sent as a bearer token. */
	token: string | undefined;
	fetch: typeof fetch;
	store: CopyStore;
	now?: () => number;
	timeoutMs?: number;
};

export function createCms(options: CmsOptions): Cms {
	const { baseUrl, token, store } = options;
	const now = options.now ?? Date.now;
	const timeoutMs = options.timeoutMs ?? CMS_TIMEOUT_MS;

	async function read(
		path: string,
		freshMs: number,
		absentIsNull: boolean
	): Promise<unknown | null> {
		const kept = await store.get(path).catch((err) => {
			console.error('[indy-library] reading a kept copy failed', path, err);
			return undefined;
		});
		const age = kept ? now() - kept.fetchedAt : Infinity;
		if (kept && age < freshMs) return kept.body;

		try {
			const response = await options.fetch(new URL(path, baseUrl), {
				headers: { Accept: 'application/json', Authorization: `Bearer ${token ?? ''}` },
				signal: AbortSignal.timeout(timeoutMs)
			});
			let body: unknown;
			if (response.status === 404 && absentIsNull) body = null;
			else if (!response.ok) throw new Error(`The CMS answered ${response.status}`);
			else body = await response.json();

			await store.put(path, { fetchedAt: now(), body }).catch((err) => {
				console.error('[indy-library] keeping a copy failed', path, err);
			});
			return body;
		} catch (err) {
			if (kept && age < KEEP_MS) {
				console.warn('[indy-library] CMS read failed; serving the kept copy', path, err);
				return kept.body;
			}
			throw new CmsUnavailableError(path, err);
		}
	}

	return {
		async courseList() {
			return (await read('/api/courseware/courses', FRESH_MS, false)) as CourseList;
		},
		async courseVersion(code, which) {
			const path = `/api/courseware/courses/${encodeURIComponent(code)}/${which}`;
			const freshMs = which === 'draft' ? DRAFT_FRESH_MS : FRESH_MS;
			return (await read(path, freshMs, true)) as CourseVersionDocument | null;
		},
		async catalogue() {
			return (await read('/api/courseware/catalogue', FRESH_MS, false)) as Catalogue;
		}
	};
}

/** Copies kept in memory: for tests, and for `vite dev` when there is no Cache API. */
export function memoryStore(): CopyStore {
	const copies = new Map<string, KeptCopy>();
	return {
		async get(key) {
			return copies.get(key);
		},
		async put(key, copy) {
			copies.set(key, copy);
		}
	};
}

/**
 * The host the kept copies are filed under in the Cache API. Invented on purpose: no request
 * from outside can ever be for this host, so nothing kept here (teacher notes included) can be
 * served to a browser from Cloudflare's cache.
 */
const CACHE_HOST = 'https://indy-library-copies.internal';

/**
 * Copies kept in the Workers Cache API, so every isolate in a data centre shares them. The
 * entry lives for `KEEP_MS`; whether it is fresh is decided from its own `fetchedAt`, not by the
 * cache, which is what lets a stale copy be served when the CMS fails.
 */
export function cacheApiStore(cache: Cache): CopyStore {
	return {
		async get(key) {
			const response = await cache.match(CACHE_HOST + key);
			return response ? ((await response.json()) as KeptCopy) : undefined;
		},
		async put(key, copy) {
			await cache.put(
				CACHE_HOST + key,
				new Response(JSON.stringify(copy), {
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': `max-age=${KEEP_MS / 1000}`
					}
				})
			);
		}
	};
}
