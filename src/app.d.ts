import type { IdentityBinding, SessionContext } from '@indy-center/identity';
import type { Cms } from '$lib/server/cms';

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
		}

		interface Platform {
			// `wrangler types` only knows IDENTITY as a bare Fetcher, so it is replaced with its
			// RPC shape. Optional, because `vite dev` may run without it.
			env: Omit<Cloudflare.Env, 'IDENTITY'> & {
				IDENTITY?: IdentityBinding;
			};
			// The adapter declares this against @cloudflare/workers-types, which this project
			// replaces with `wrangler types`; restated here so it type-checks.
			caches?: CacheStorage & { default: Cache };
		}
	}
}

export {};
