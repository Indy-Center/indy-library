import type { SessionContext } from '@indy-center/identity';
import { createCms, memoryStore } from '$lib/server/cms';
import { createTeaching, type TeachingBinding } from '$lib/server/teaching';
import { catalogue, courseList, sgcCurrent, sgcDraft, alcCurrent, xnewDraft } from './fixtures';

export const CMS_URL = 'https://cms.example.test';
export const TOKEN = 'test-token';

/** The CMS's documents by path, as the fake CMS serves them. */
export function cmsDocuments(): Record<string, unknown> {
	return {
		'/api/courseware/courses': courseList,
		'/api/courseware/courses/S-GC/current': sgcCurrent,
		'/api/courseware/courses/S-GC/draft': sgcDraft,
		'/api/courseware/courses/A-LC/current': alcCurrent,
		'/api/courseware/courses/X-NEW/draft': xnewDraft,
		'/api/courseware/catalogue': catalogue
	};
}

/**
 * A stand-in for the CMS's HTTP API: serves `documents` by path, 404s anything else, and
 * records every request. `down()` makes every request fail, as an outage would.
 */
export function fakeCms(documents = cmsDocuments()) {
	const requests: string[] = [];
	const authorizations: (string | null)[] = [];
	let isDown = false;

	const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(String(input));
		requests.push(url.pathname);
		authorizations.push(new Headers(init?.headers).get('Authorization'));
		if (isDown) throw new TypeError('fetch failed');
		if (!(url.pathname in documents)) return new Response('Not found', { status: 404 });
		return Response.json(documents[url.pathname]);
	}) as typeof globalThis.fetch;

	return {
		fetch,
		documents,
		requests,
		authorizations,
		down() {
			isDown = true;
		},
		/** How many times `path` was asked for. */
		asked(path: string) {
			return requests.filter((r) => r === path).length;
		}
	};
}

/**
 * A stand-in for training-tools' `Teaching` entrypoint: answers from `taught` by CID (nothing
 * for anyone else), or always throws, or never answers. Records every CID asked about.
 */
export function fakeTraining(taught: Record<string, string[]> | 'throws' | 'hangs' = {}) {
	const asked: string[] = [];
	const binding: TeachingBinding = {
		async coursesTaught(cid) {
			asked.push(cid);
			if (taught === 'throws') throw new Error('training-tools is down');
			if (taught === 'hangs') return new Promise<string[]>(() => {});
			return taught[cid] ?? [];
		}
	};
	return { binding, asked };
}

/** How long tests let training-tools take before giving up on it. */
export const TEST_TEACHING_TIMEOUT_MS = 20;

/**
 * One running library: a fake CMS, the kept copies (shared across requests, as the Cache API
 * is), and a clock tests can move. `event()` builds what one request's page load receives.
 */
export function library(
	opts: { cms?: ReturnType<typeof fakeCms>; training?: ReturnType<typeof fakeTraining> } = {}
) {
	const cms = opts.cms ?? fakeCms();
	const training = opts.training ?? fakeTraining();
	const store = memoryStore();
	const clock = { now: Date.parse('2026-10-14T12:00:00Z') };

	return {
		cms,
		training,
		store,
		clock,
		event(reader: SessionContext | null, href: string, params: Record<string, string> = {}) {
			return {
				url: new URL(href, 'https://library.flyindycenter.com'),
				params,
				locals: {
					session: reader,
					cms: createCms({
						baseUrl: CMS_URL,
						token: TOKEN,
						fetch: cms.fetch,
						store,
						now: () => clock.now
					}),
					teaching: createTeaching(training.binding, TEST_TEACHING_TIMEOUT_MS)
				}
			};
		}
	};
}

/** Calls a page's server load with a hand-built event. */
export function run<L extends (event: never) => unknown>(load: L, event: unknown): ReturnType<L> {
	return load(event as Parameters<L>[0]) as ReturnType<L>;
}
