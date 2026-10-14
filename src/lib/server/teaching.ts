/**
 * training-tools' answer to "which courses may this person teach?", over the `TRAINING` service
 * binding to its `Teaching` entrypoint. It decides whose teacher notes are shown.
 */

/** What training-tools' `Teaching` entrypoint offers. */
export type TeachingBinding = {
	/** The course codes the CID holds a current teacher qualification on, at any level. */
	coursesTaught(cid: string): Promise<string[]>;
};

export type Teaching = {
	/**
	 * The course codes the CID may teach, or null when training-tools did not answer: the binding
	 * is missing, the call threw, or it took longer than the timeout. Asked at most once per CID
	 * per request.
	 */
	coursesTaught(cid: string): Promise<string[] | null>;
};

/**
 * How long a page waits for training-tools before showing no teacher notes. Short, because a
 * page waits on it; a slow answer costs a teacher their notes for one page view, not the page.
 */
export const TEACHING_TIMEOUT_MS = 1_500;

export function createTeaching(
	binding: TeachingBinding | undefined,
	timeoutMs = TEACHING_TIMEOUT_MS
): Teaching {
	const answers = new Map<string, Promise<string[] | null>>();

	async function ask(cid: string): Promise<string[] | null> {
		if (!binding) {
			console.warn('[indy-library] TRAINING binding unavailable; showing no teacher notes');
			return null;
		}
		let timer: ReturnType<typeof setTimeout> | undefined;
		const timeout = new Promise<null>((resolve) => {
			timer = setTimeout(() => resolve(null), timeoutMs);
		});
		try {
			const answer = await Promise.race([binding.coursesTaught(cid), timeout]);
			if (answer === null) console.warn('[indy-library] training-tools timed out');
			return Array.isArray(answer) ? answer : null;
		} catch (err) {
			console.error('[indy-library] training-tools coursesTaught threw', err);
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	return {
		coursesTaught(cid) {
			let answer = answers.get(cid);
			if (!answer) {
				answer = ask(cid);
				answers.set(cid, answer);
			}
			return answer;
		}
	};
}
