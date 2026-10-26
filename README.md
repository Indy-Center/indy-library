# indy-library

Indy Center's courseware library, at
[library.flyindycenter.com](https://library.flyindycenter.com). Anyone signed in
through Indy Center's identity service reads the current version of every
course: its modules, lesson plans, scenarios, and the tasks and competencies
they teach. Teachers of a course also see its teacher notes, and a course's
authors can read its draft before it is published.

The courseware is written by training staff in the CMS (Payload, at
`cms.flyindycenter.com`). This app only reads it; nothing is written here, and
no student data passes through it.

SvelteKit on Cloudflare Workers, with Svelte 5, Tailwind v4 and the same look
and conventions as [training-tools](https://github.com/Indy-Center/training-tools).

## Pages

Every page needs a session; there are no public pages.

| Route                               | Shows                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/`                                 | Every course with a current version, plus drafts the reader may see                                              |
| `/courses/{code}`                   | The current version: modules in order, each with its lesson plans                                                |
| `/courses/{code}/lesson-plans/{id}` | Body, time, code, exam flag, minimum grade, theory items in order, scenarios offered                             |
| `/courses/{code}/scenarios/{id}`    | Airport, position, difficulty, live or sim, practical tasks (required or optional), the lesson plans offering it |
| `/tasks/{id}`                       | Number, name, description, place in the task tree, mapped competencies (inherited too), cited references         |
| `/competencies`                     | A tab per framework edition (`?edition=`), each top-level competency folded over everything beneath it           |
| `/competencies/{id}`                | Text, framework edition, rubric wording, and every task mapped to it                                             |

Add `?version=draft` to any `/courses/...` page to read the course's draft
instead. Pages beneath a draft keep it in their links, and every draft page is
marked as a draft.

## Who sees what

Decided on the server for each request:

| Reader                                                    | Current versions | Teacher notes              | Drafts         |
| --------------------------------------------------------- | ---------------- | -------------------------- | -------------- |
| Anyone signed in                                          | All              | None                       | None           |
| A teacher qualified on a course (training-tools)          | All              | That course's              | None           |
| A course author (CID on the course in the CMS)            | All              | Only if they also teach it | Their courses' |
| Training Admin (`training:admin`), lead (`training:lead`) | All              | Every course's             | Every course's |

Older published versions are never shown.

- **Teacher notes** are stripped in the server load: a reader who may not see
  them gets `null` in their place, so they never reach the browser. Whether a
  teacher may see them comes from training-tools (below), asked only when the
  page has notes to decide on, at most once per request. If it throws or takes
  longer than 1.5 seconds, no notes are shown and the page renders anyway.
- **Drafts** are fetched only for readers who may see them. Who may is decided
  from the CMS's course list (which carries each course's authors) before the
  draft is asked for. Anyone else gets a 404, as if there were no draft.
- Roles come from identity. `training:lead` may not exist in identity yet; until
  it does, only `training:admin` counts.

## Signing in

Exactly as training-tools does it. Identity's `fic_session` cookie is set on
`.flyindycenter.com`; `handle` in `src/hooks.server.ts` reads it and calls
`IDENTITY.getSessionContext(token)` over the service binding. Identity is not an
OAuth provider, and there is no HTTP fallback: off this Cloudflare account or
off `*.flyindycenter.com`, sign-in cannot work.

A reader with no session is redirected to identity's `/login` with the absolute
URL they asked for (`event.url.href`), and comes back to it. The gate is in
`handle`, never in a layout load, which would stop protecting pages on client
navigation.

## Reading the CMS

All reads go through `src/lib/server/cms/index.ts`, which asks the CMS for three
documents with `Authorization: Bearer $LIBRARY_API_TOKEN`:

| Path                                         | What                                                         |
| -------------------------------------------- | ------------------------------------------------------------ |
| `GET /api/courseware/courses`                | Every course, its authors, current and draft version numbers |
| `GET /api/courseware/courses/{code}/current` | One whole course version (a 404 means there is none)         |
| `GET /api/courseware/courses/{code}/draft`   | The same for the draft                                       |
| `GET /api/courseware/catalogue`              | The task tree, frameworks, competencies, sources             |

Their shapes are the contract in `src/lib/server/cms/types.ts`, copied from the
payload repo's `src/courseware/document.ts`. When the CMS changes the contract,
copy it again and change the test fixtures with it.

Each document is kept in the Workers Cache API (shared by every isolate in a
data centre; no KV or D1 to provision):

- **Fresh for 5 minutes** (drafts 1 minute): served without asking the CMS. A
  published edit shows in the library within that window.
- **Kept for 7 days**: when the CMS fails, answers with an error, or takes over
  5 seconds, the last good copy is served instead, so a CMS outage does not stop
  a teacher mid-session.
- With no copy at all and the CMS down, the page is a 503.

Copies are filed under an invented host (`indy-library-copies.internal`) so no
request from outside can ever be served one from Cloudflare's cache. They hold
teacher notes, which is why they never leave the server.

## Bindings, vars and secrets

All in `wrangler.jsonc`:

| Name                  | Kind            | What                                                                                         |
| --------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `IDENTITY`            | Service binding | The `identity` Worker: sessions and roles                                                    |
| `TRAINING`            | Service binding | `training-tools`, entrypoint `Teaching`: `coursesTaught(cid)`, the courses a CID may teach   |
| `PUBLIC_IDENTITY_URL` | Var             | `https://auth.flyindycenter.com`, for the login and logout links                             |
| `CMS_URL`             | Var             | `https://cms.flyindycenter.com`                                                              |
| `LIBRARY_API_TOKEN`   | **Secret**      | The CMS's server credential for the documents above. `wrangler secret put LIBRARY_API_TOKEN` |

Without `TRAINING`, nobody but the Training Admin and leads sees teacher notes.
Without `LIBRARY_API_TOKEN`, the CMS refuses every read and only copies already
kept are served.

## Local development

Requires Node 22 or later and pnpm. For sign-in, run identity alongside on port
8787 with `COOKIE_DOMAIN=localhost`, as training-tools' README describes.

```bash
pnpm install
cp .dev.vars.example .dev.vars   # identity on localhost:8787, CMS_URL and the token
pnpm dev                         # http://localhost:5173
```

`vite dev` joins Wrangler's dev registry, so `IDENTITY` resolves against a local
identity and `TRAINING` against a local training-tools (`pnpm preview` there)
when they are running. Without identity every page redirects to sign-in;
without training-tools only Training Admin and leads see teacher notes. When
there is no Cache API in dev, copies are kept in memory instead.

`.dev.vars` is read at startup only; restart after editing it.

## Checks and tests

```bash
pnpm format:check && pnpm build && pnpm check && pnpm test
```

`build` comes before `check`, as in training-tools. CI runs exactly these on
every pull request (`.github/workflows/ci.yml`). Each push to `main` runs them
again and, if they pass, deploys the Worker
(`.github/workflows/build-and-deploy.yml`).

Tests run each page's server load (and `handle`, for the redirect) with a
session or none, a fake CMS serving fixtures shaped exactly like the contract
(`src/lib/testing/fixtures.ts`), and a fake training-tools. They assert what
each kind of reader is sent. The fixtures' content is made up: this repository
is public, so never put real courseware or VATUSA's wording in a test.

## Not yet set up

1. The maintainer still has to set the `LIBRARY_API_TOKEN` secret on the
   `indy-library` Worker, matching the credential the CMS expects.
2. The `TRAINING` binding goes live once training-tools ships its `Teaching`
   entrypoint (branch `lesson-plan`). Until then the call fails, and no teacher
   notes are shown except to the Training Admin and leads.
