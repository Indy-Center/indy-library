import type { IdentityBinding, SessionContext } from '@indy-center/identity';

declare global {
	/**
	 * Secrets. `wrangler types` only sees the `vars` block and a local `.dev.vars`, so a secret is
	 * invisible to it on a clean checkout. Declaring it here keeps `pnpm check` honest.
	 */
	interface Env {
		/**
		 * The CMS's server credential for the courseware documents, sent as
		 * `Authorization: Bearer <token>`. Set with `wrangler secret put LIBRARY_API_TOKEN`.
		 * Without it every read from the CMS fails, and only copies already kept are served.
		 */
		LIBRARY_API_TOKEN?: string;
	}

	namespace App {
		interface Locals {
			/** Never null past `handle`: every page needs a session. */
			session: SessionContext | null;
		}

		interface Platform {
			// `wrangler types` only knows IDENTITY as a bare Fetcher, so it is replaced with its
			// RPC shape. Optional, because `vite dev` may run without it.
			env: Omit<Cloudflare.Env, 'IDENTITY'> & {
				IDENTITY?: IdentityBinding;
			};
		}
	}
}

export {};
