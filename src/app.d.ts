import type { IdentityBinding, SessionContext } from '@indy-center/identity';
import type { Cms } from '$lib/server/cms';
import type { Teaching, TeachingBinding } from '$lib/server/teaching';

declare global {
	namespace Cloudflare {
		/**
		 * Secrets. `wrangler types` only sees the `vars` block and a local `.dev.vars`, so a secret
		 * is invisible to it on a clean checkout. Declaring it here keeps `pnpm check` honest.
		 */
		interface Env {
			/**
			 * The CMS's server credential for the courseware documents, sent as
			 * `Authorization: Bearer <token>`. Set with `wrangler secret put LIBRARY_API_TOKEN`.
			 * Without it every read from the CMS fails, and only copies already kept are served.
			 */
			LIBRARY_API_TOKEN?: string;
		}
	}

	namespace App {
		interface Locals {
			/** Never null past `handle`: every page needs a session. */
			session: SessionContext | null;
			/** The courseware documents, read from the CMS and kept for a few minutes. */
			cms: Cms;
			/** training-tools' answer to "which courses may this person teach?". */
			teaching: Teaching;
		}

		interface Platform {
			// `wrangler types` only knows IDENTITY and TRAINING as bare Fetchers, so they are
			// replaced with their RPC shapes. Optional, because `vite dev` may run without them.
			env: Omit<Cloudflare.Env, 'IDENTITY' | 'TRAINING'> & {
				IDENTITY?: IdentityBinding;
				TRAINING?: TeachingBinding;
			};
			// The adapter declares this against @cloudflare/workers-types, which this project
			// replaces with `wrangler types`; restated here so it type-checks.
			caches?: CacheStorage & { default: Cache };
		}
	}
}

export {};
