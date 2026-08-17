# Jetlag Events in Europe Implementation Plan

> **For agentic workers:** REQUIRED: Use `superpowers:subagent-driven-development` (if subagents are available) or `superpowers:executing-plans` to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Summer Rush JSON/Markdown content system with a validated per-event content catalog, rebrand the static SvelteKit site as Jetlag Events in Europe, and make the repository ready for future Discord-generated event PRs.

**Architecture:** Store one event per Markdown file under `src/lib/content/events/`, with quoted YAML front matter validated against a committed JSON Schema and TypeScript rules. A typed content loader scans the mdsvex modules, joins events to the shared server catalog, and feeds the home/detail routes. Prerender the catalog with SvelteKit’s static adapter and deploy the generated `build/` directory through Cloudflare Pages Git integration; the future Discord bot is documented but not implemented here.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, mdsvex, Vite, Bun test, SvelteKit adapter-static, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-08-17-jetlag-events-design.md`

---

## File map

| File                                  | Responsibility                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/lib/content/site.json`           | Jetlag Events in Europe site copy and navigation labels.                                                             |
| `src/lib/content/servers.json`        | Existing shared Jet Lag server records.                                                                              |
| `src/lib/content/event.schema.json`   | Machine-readable front-matter contract for the site and future bot.                                                  |
| `src/lib/content/validation.ts`       | Pure validation and normalization for parsed front matter.                                                           |
| `src/lib/content/event-utils.ts`      | Pure date/status/link/sort helpers.                                                                                  |
| `src/lib/content/catalog.ts`          | Pure injectable catalog construction, ID checks, server joins, link derivation, and date-parameterized partitioning. |
| `src/lib/content/load-events.ts`      | Vite/mdsvex glob adapter that passes modules into `catalog.ts`.                                                      |
| `src/lib/content/catalog.test.ts`     | Loader-boundary tests with injected modules and server fixtures.                                                     |
| `src/lib/content/page-data.ts`        | Pure route/view-model helpers for entries, lookup, metadata, and optional sections.                                  |
| `src/lib/content/page-data.test.ts`   | Route and detail-page view-model behavior tests.                                                                     |
| `src/app.d.ts`                        | Type declaration for mdsvex `metadata` exports.                                                                      |
| `src/routes/+layout.ts`               | Shared `prerender = true` route setting.                                                                             |
| `src/routes/+page.server.ts`          | Server-only serialized build-date load.                                                                              |
| `src/routes/+page.ts`                 | Home-page data load.                                                                                                 |
| `src/routes/+page.svelte`             | Public catalog, archive, server directory, and rebranded visual layout.                                              |
| `src/routes/events/[id]/+page.ts`     | Detail-page lookup, generated entries, and 404 behavior.                                                             |
| `src/routes/events/[id]/+page.svelte` | Event detail presentation and Markdown component rendering.                                                          |
| `src/routes/+layout.svelte`           | Favicon and global shell; remove obsolete language-toggle styles.                                                    |
| `svelte.config.js`                    | mdsvex plus static adapter/prerender configuration.                                                                  |
| `package.json`                        | Static adapter dependency, package name, and Bun test script.                                                        |
| `wrangler.jsonc`                      | Exact Cloudflare Pages build configuration.                                                                          |
| `static/_headers`                     | Cloudflare Pages CSP restricting map frames.                                                                         |
| `README.md`                           | Content authoring and Cloudflare Pages deployment instructions.                                                      |
| `scripts/migrate-events.ts`           | Temporary deterministic migration utility; remove after migration verification.                                      |
| `scripts/verify-events-migration.ts`  | Temporary source/output comparison and generated-file validation utility; remove after migration verification.       |
| `src/lib/data/summer-rush.json`       | Delete after its records and servers are migrated.                                                                   |
| `src/lib/events/*.md`                 | Move into `src/lib/content/events/`, transforming bilingual/branding/media content.                                  |
| `static/events/*`                     | Retain existing local assets; no automated upload path is added.                                                     |

The plan does not modify or create a Discord bot repository.

---

## Chunk 1: Content contract and pure domain code

### Task 1: Add the test runner and write failing validation tests

**Files:**

- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `bun.lock`
- Create: `src/lib/content/validation.test.ts`

- [ ] **Step 1: Add the Bun test script and types**

Add `"test": "bun test"` to `package.json`. Run `bun add --dev bun-types` and add `"bun-types"` alongside `"node"` in the compiler `types` list in `tsconfig.json` so `bun:test` imports type-check under `svelte-check`. Do not add a third-party assertion library; use `bun:test`.

- [ ] **Step 2: Write failing validation tests**

Create tests for `validateEventFrontMatter` covering:

- a complete valid record with quoted dates, optional local times/timezone, `waitlist`, server ID, and allowed Google Maps URL;
- missing required fields and empty `title`, `city`, `country`, or `hostServerId`;
- unquoted/non-string dates and unsupported `schemaVersion`;
- impossible calendar dates such as `2027-02-30`;
- reversed date range;
- malformed/out-of-range times such as `9:00` and `25:00`;
- a time without its paired time/timezone;
- an invalid IANA timezone;
- same-day `endTime <= startTime`;
- overnight time with unchanged `endDate`;
- an unknown `hostServerId`;
- each allowed status, including `waitlist` and `cancelled`;
- an unknown front-matter key and wrong optional-field types;
- non-HTTPS signup/image URLs;
- a map URL outside the Google Maps allowlist;
- an image without `imageAlt`;
- an assertion that every thrown validation error includes the source file path and offending field name.

Pass the server fixture IDs explicitly to the validator so the pure function does not read the filesystem.

- [ ] **Step 3: Run the focused test and verify failure**

Run:

```bash
bun test src/lib/content/validation.test.ts
```

Expected: FAIL because `validation.ts` and `validateEventFrontMatter` do not exist yet.

- [ ] **Step 4: Keep the red tests local until the implementation is green**

Do not commit a deliberately failing test suite. Task 2 commits the test, schema, and implementation together after the focused tests and type-check pass.

### Task 2: Implement the schema and validation boundary

**Files:**

- Create: `src/lib/content/event.schema.json`
- Create: `src/lib/content/validation.ts`
- Modify: `src/lib/content/validation.test.ts`

- [ ] **Step 1: Define the JSON Schema**

Use JSON Schema 2020-12 with `additionalProperties: false`. Set `schemaVersion` to integer `1` with `const: 1`. Require `schemaVersion`, `title`, `startDate`, `endDate`, `city`, `country`, `hostServerId`, and `status`; give required display strings `minLength: 1`. Use the exact status enum `planning`, `confirmed`, `signup-open`, `full`, `waitlist`, `cancelled`. Encode quoted ISO dates as non-empty string patterns, optional `HH:mm` times as string patterns, and optional HTTPS URL fields as URI strings. Document the Google Maps path allowlist in the schema description and enforce it in TypeScript.

- [ ] **Step 2: Implement pure validation**

Export typed front-matter types and `validateEventFrontMatter(raw, serverIds, filePath)`. The function must:

- reject non-object metadata and unknown keys;
- require `schemaVersion === 1`, non-empty required display strings, and string dates;
- validate calendar values without timezone conversion;
- require `endDate >= startDate`;
- validate `HH:mm` ranges and require `startTime`, `endTime`, and `timezone` as a complete group when any is present;
- validate IANA zones with `Intl.DateTimeFormat`;
- reject same-day `endTime <= startTime` and require a later `endDate` for overnight events;
- validate server IDs, statuses, HTTPS URLs, image alt text, and Google Maps URL paths;
- return a normalized typed record or throw an error containing the file path and field name.

Do not use the current central JSON type as the validator source. The JSON Schema and this runtime validator are the shared contract.

- [ ] **Step 3: Run the focused tests**

Run:

```bash
bun test src/lib/content/validation.test.ts
```

Expected: PASS for all valid/invalid contract cases.

- [ ] **Step 4: Run TypeScript checking**

Run:

```bash
bun run check
```

Expected: PASS with Bun typings, the new validator, and schema types.

- [ ] **Step 5: Commit the contract implementation**

```bash
git add package.json tsconfig.json bun.lock src/lib/content/event.schema.json src/lib/content/validation.ts src/lib/content/validation.test.ts
git commit -m "feat: validate event content files"
```

### Task 3: Add date, status, and signup-link domain helpers with tests

**Files:**

- Create: `src/lib/content/event-utils.ts`
- Create: `src/lib/content/event-utils.test.ts`

- [ ] **Step 1: Write failing helper tests**

Test pure helpers for:

- `isPastEvent({ endDate: '2027-04-18' }, '2027-04-18') === false` and the previous day returning `true`;
- upcoming sorting by `startDate` ascending, then title ascending;
- archive sorting by `endDate` descending, then `startDate` descending, then title ascending;
- exact labels: `planning` → `Planning`, `confirmed` → `Confirmed`, `signup-open` → `Signup Open`, `full` → `Full`, `waitlist` → `Full / Wait list`, and `cancelled` → `Cancelled`;
- `formatDateRange('2027-04-18', '2027-04-18') === '18.04.2027'`;
- `formatDateRange('2027-07-17', '2027-07-19') === '17.07.2027 – 19.07.2027'`, with no timezone-induced day shift;
- explicit `signupUrl` taking precedence;
- exact fallback behavior using `new URL(server.invite)` and `searchParams.set('event', discordEventId)`;
- empty/missing signup data returning no URL.

- [ ] **Step 2: Run the focused test and verify failure**

```bash
bun test src/lib/content/event-utils.test.ts
```

Expected: FAIL because `event-utils.ts` does not exist.

- [ ] **Step 3: Implement the minimal helpers**

Keep date comparison string-based for ISO dates. Format date components directly into `DD.MM.YYYY` strings rather than constructing local `Date` objects. Accept `today` as an argument in `isPastEvent` so tests never depend on wall-clock time. Keep link generation independent of SvelteKit route code.

- [ ] **Step 4: Run the focused tests and type-check**

```bash
bun test src/lib/content/event-utils.test.ts
bun test
bun run check
```

Expected: PASS for the helper tests, the complete Chunk 1 suite, and static typing.

- [ ] **Step 5: Commit the domain helpers**

```bash
git add src/lib/content/event-utils.ts src/lib/content/event-utils.test.ts
git commit -m "feat: add event catalog domain helpers"
```

---

## Chunk 2: Content migration and loader

### Task 4: Create site/server content and mdsvex module typing

**Files:**

- Create: `src/lib/content/site.json`
- Create: `src/lib/content/servers.json`
- Modify: `src/app.d.ts`

- [ ] **Step 1: Create the rebranded site configuration**

Use these initial values, keeping labels English-only:

```json
{
	"title": "Jetlag Events in Europe",
	"tagline": "Community-run Jet Lag games and events across Europe",
	"description": "Find upcoming games, event details, and the Discord communities hosting them.",
	"primaryAction": { "label": "Events" },
	"secondaryAction": { "label": "Servers" },
	"notes": ["Join the corresponding community server for event details and signups."]
}
```

- [ ] **Step 2: Extract the existing server array**

Copy the current six server records exactly into `src/lib/content/servers.json`. Preserve IDs, names, regions, icon keys, and invite URLs. Do not add event-specific organizer fields.

- [ ] **Step 3: Declare mdsvex metadata exports**

Extend `src/app.d.ts` with a `*.md` module declaration exporting a default Svelte component and `metadata: Record<string, unknown>`. Keep the existing `App` namespace declaration intact.

- [ ] **Step 4: Check the content files**

Run:

```bash
bun run check
```

Expected: PASS with JSON imports and mdsvex metadata declarations.

- [ ] **Step 5: Commit content foundations**

```bash
git add src/lib/content/site.json src/lib/content/servers.json src/app.d.ts
git commit -m "feat: add Jetlag site and server content"
```

### Task 5: Write and run the deterministic content migration

**Files:**

- Create: `scripts/migrate-events.ts`
- Create: `scripts/verify-events-migration.ts`
- Create: `src/lib/content/events/*.md`
- Modify: `package.json`
- Modify: `bun.lock`
- Read then delete: `src/lib/data/summer-rush.json`
- Move then delete originals: `src/lib/events/*.md`
- Modify generated Markdown bodies under `src/lib/content/events/`
- Retain: `static/events/*`

- [ ] **Step 1: Implement the temporary migration utility**

The Bun script must read the current JSON and current Markdown files, explicitly ignore `src/lib/events/README.md`, and emit one event file per JSON event. It must fail for any orphan event Markdown file whose basename is not a JSON event ID. For each record:

- emit `schemaVersion: 1` as the first front-matter field;
- retain the existing ID as the filename;
- emit quoted `startDate` and `endDate` values;
- map `Signup Open` to `signup-open`, `Confirmed` to `confirmed`, `Planning` to `planning`, and `Full / Wait list` to `waitlist`;
- map `eventId` to a quoted `discordEventId` string only when non-empty;
- map a non-empty `eventLinkOverride` to `signupUrl`;
- copy non-empty map metadata to `mapEmbedUrl`/`mapTitle`;
- preserve `hostServerId`, title, city, and dates;
- set `belgium-2026-08-01.country` to `Belgium`;
- set `bens-playground-2026-08-22.country` to `Netherlands, Germany, France and Switzerland`;
- set `switzerland-2026-09-05.country` to `Switzerland`;
- remove `dateLabel` from generated front matter;
- allow an empty body only for `budapest-2026-07-11`, `graz-2026-07-25`, `paris-2026-08-15`, `milan-2026-08-29`, and `switzerland-2026-09-05`; fail for a missing body on every other event;
- extract only the English body from the two bilingual files, removing radio inputs, language labels, `.lang-en` wrappers, and `.lang-de` blocks;
- replace the exact Utrecht sentence `We are kicking of the Summer Rush event in Utrecht, the Netherlands!` with `We are kicking off a Jetlag event in Utrecht, the Netherlands!`;
- replace the exact Ben's Playground sentence `Be part of **the largest event of Summer Rush!!**` with `Be part of **the largest Jetlag event in Europe!!**`;
- rewrite raw `github.com/leandrocoding/summerrush/raw/main/static/events/...` media URLs to `/events/<filename>`;
- preserve reviewed raw HTML, relative local image references, external image references, headings, lists, and links in the retained English bodies;
- emit a non-empty body for every other event with a source Markdown file.

The script must call `validateEventFrontMatter` on every emitted metadata object before writing. It must fail rather than silently inventing values for an unknown event ID, missing source Markdown outside the allowlist, unknown status, missing server ID, or unsupported legacy field.

Export the deterministic `transformLegacyEvent(record, sourceBody)` function from the migration utility and reuse it from the verifier. Guard the script runner with `import.meta.main` so importing the transform does not write files.

- [ ] **Step 2: Run the migration into the new directory**

```bash
bun add --dev front-matter
bun scripts/migrate-events.ts
```

Expected: one generated Markdown file for every record in the current JSON, with a summary of generated IDs and explicit transformations.

- [ ] **Step 3: Verify generated files against the source catalog**

Implement `scripts/verify-events-migration.ts` to parse each generated Markdown file with `front-matter`, validate every parsed metadata object through `validateEventFrontMatter`, compare the exact source/output ID sets, reject stale extra files, and compare every field against `transformLegacyEvent` output: title, quoted dates, mapped country, city, `hostServerId`, mapped status, `discordEventId`, `signupUrl`, map metadata, `schemaVersion`, and the exact retained/transformed English Markdown body. It must also assert the named English-only, branding, repository-URL, and local-media invariants. Run:

```bash
bun scripts/verify-events-migration.ts
```

Expected: PASS with the exact source/output event count and no invariant failures. This verification must run before deleting the old JSON and Markdown sources.

Review the two bilingual output files and the three blank-country output files manually as well. Confirm that no German blocks, language-switch controls, old repository URLs, or visible Summer Rush wording remain, and that the Snaketag map resolves to `/events/Snaketag_Oberrhein_Map.png`.

- [ ] **Step 4: Check the generated catalog**

```bash
bun run check
bun test src/lib/content/validation.test.ts
```

Expected: PASS; all generated front matter satisfies the validator contract.

- [ ] **Step 5: Move the source files and remove the old index**

After migration verification passes, remove both temporary scripts, delete `src/lib/data/summer-rush.json`, and delete the original `src/lib/events/*.md` copies. Keep generated files under `src/lib/content/events/` and keep `static/events/*`. Run `bun remove front-matter` because no retained site code uses the temporary migration parser.

- [ ] **Step 6: Commit the migration**

```bash
git add -A -- src/lib/content/events src/lib/data src/lib/events static/events package.json bun.lock
git commit -m "feat: migrate events to validated content files"
```

### Task 6: Implement the typed content loader

**Files:**

- Create: `src/lib/content/catalog.ts`
- Create: `src/lib/content/catalog.test.ts`
- Create: `src/lib/content/load-events.ts`
- Modify: `src/lib/content/validation.ts` if loader-specific types are needed
- Modify: `src/lib/content/event-utils.ts` only for catalog-level types

- [ ] **Step 1: Write failing catalog-boundary tests**

Inject module records containing file paths, parsed metadata, compiled components, and raw Markdown source, plus server/site fixtures, into a pure `buildCatalog` function. Test valid catalog construction, malformed metadata diagnostics, lowercase URL-safe filename validation, duplicate ID rejection, unknown server rejection, signup-link derivation, content-map keys, explicit `hasMarkdownBody` true/false values, and date-parameterized `partitionEvents(events, today)` behavior. Assert that `endDate === today` remains upcoming.

- [ ] **Step 2: Implement the pure catalog builder**

Implement `catalog.ts` with `buildCatalog` and `partitionEvents`. Derive each event ID from the file basename, reject any ID that does not match `^[a-z0-9]+(?:-[a-z0-9]+)*$`, reject duplicate IDs before inserting into maps, validate metadata with the shared validator, join server records, derive signup links with the tested helper, and set `hasMarkdownBody` from the trimmed raw source after front matter. Keep all date views parameterized; do not precompute upcoming/archive arrays at module load.

- [ ] **Step 3: Add the Vite/mdsvex glob adapter**

Implement `load-events.ts` with one eager mdsvex glob for compiled modules and a second eager raw glob such as `import.meta.glob('./events/*.md', { eager: true, query: '?raw', import: 'default' })`. Pair both maps by normalized file path, pass compiled metadata/components plus raw source into `buildCatalog`, and export the validated site, servers, events (including `hasMarkdownBody`), event-content map, and `partitionEvents` for routes.

- [ ] **Step 4: Run the loader-boundary tests and type-check**

```bash
bun test src/lib/content/catalog.test.ts
bun test
bun run check
```

Expected: PASS for injected catalog behavior, all pure tests, and the Vite/mdsvex loader types against the migrated content.

- [ ] **Step 5: Commit the loader**

```bash
git add src/lib/content/catalog.ts src/lib/content/catalog.test.ts src/lib/content/load-events.ts src/lib/content/validation.ts src/lib/content/event-utils.ts
git commit -m "feat: load validated event catalog"
```

---

## Chunk 3: Route integration, static build, and public UI

### Task 7: Configure static SvelteKit output and route data

**Files:**

- Modify: `package.json`
- Modify: `svelte.config.js`
- Create: `src/routes/+layout.ts`
- Create: `src/lib/content/page-data.ts`
- Create: `src/lib/content/page-data.test.ts`
- Create: `src/routes/+page.server.ts`
- Create: `src/routes/+page.ts`
- Modify: `src/routes/events/[id]/+page.ts`
- Replace: `wrangler.jsonc`
- Create: `static/_headers`
- Modify: `README.md`

- [ ] **Step 1: Write failing route/view-model tests**

Test `page-data.ts` helpers for exact catalog IDs returned by `eventEntries`, known/unknown event lookup behavior, deterministic per-event `<title>`/description strings, and optional-section flags for absent/present signup, image, `hasMarkdownBody`, and map data. Test `partitionEvents` with two controlled visitor dates so an event moves from upcoming to archive without rebuilding. Test the route data contract with a fixture event and assert that an unknown ID takes the 404 error path.

- [ ] **Step 2: Implement route/view-model helpers and loaders**

Implement `page-data.ts` with `eventEntries`, `findEvent`, `detailMeta`, `optionalSections`, and a browser-local `browserToday()` formatter. Create server-only `src/routes/+page.server.ts` returning the serialized `buildToday` from the prerender build date. Create universal `src/routes/+page.ts` that consumes the server data and returns site/server/catalog data while preserving `buildToday` without recomputing it. Update `src/routes/events/[id]/+page.ts` to use the helpers, return validated event/server/site/content data, generate entries from all catalog IDs, and call `error(404, 'Event not found')` for unknown IDs.

- [ ] **Step 3: Switch to adapter-static and enable prerendering**

Run `bun remove @sveltejs/adapter-cloudflare` and `bun add --dev @sveltejs/adapter-static`. Set the package name to `jetlag-events-europe`. Configure `adapter()` in `svelte.config.js` and create `src/routes/+layout.ts` exporting `const prerender = true`. The dynamic event route’s `entries()` must return every catalog ID.

- [ ] **Step 4: Configure the exact Cloudflare Pages output and CSP**

Replace `wrangler.jsonc` with exactly:

```json
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "jetlag-events-in-europe",
	"compatibility_date": "2026-08-17",
	"pages_build_output_dir": "./build"
}
```

Create `static/_headers` with:

```text
/*
  Content-Security-Policy: frame-src 'self' https://www.google.com https://maps.google.com
```

Keep Wrangler as a development dependency for Pages commands. Document `bun run build`, output directory `build`, production branch `main`, preview branches/PRs, and `wrangler pages deploy build --project-name jetlag-events-in-europe` in `README.md`.

- [ ] **Step 5: Install dependencies and run route/view-model tests**

```bash
bun install
bun test src/lib/content/page-data.test.ts
```

Expected: the static adapter is installed and the route/view-model tests pass. Do not run the full `bun run check` yet because the existing Svelte pages still import the old central JSON until Task 8.

- [ ] **Step 6: Commit static routing**

```bash
git add package.json bun.lock svelte.config.js src/routes/+layout.ts src/lib/content/page-data.ts src/lib/content/page-data.test.ts src/routes/+page.server.ts src/routes/+page.ts src/routes/events/[id]/+page.ts wrangler.jsonc static/_headers README.md
git commit -m "feat: configure static Cloudflare Pages routes"
```

### Task 8: Rebuild the home page and detail page around the catalog

**Files:**

- Modify: `src/routes/+page.svelte`
- Modify: `src/routes/events/[id]/+page.svelte`
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Replace home-page data access and hydration date**

Consume `PageData` from `+page.ts`; remove `summerRush` imports, `SummerRushEvent` types, central-index-only fields, and the “has Markdown file” conditional. Every event gets an active detail link. Initialize a Svelte 5 `$state` date from serialized `data.buildToday`, render `partitionEvents(events, today)`, and use `onMount` to replace it with the visitor’s browser-local `YYYY-MM-DD` value. This reactive update must move events between upcoming/archive without a rebuild; it must not call `new Date()` separately in competing render branches. Use `event-utils.ts` for sorting, status labels, date ranges, and signup URLs.

- [ ] **Step 2: Implement the catalog states**

Render the Jetlag site hero, summary counts derived from the catalog (upcoming count, unique countries, and server count), upcoming list, collapsible past archive, shared server directory, and footer notes. Show city/country, server icon/name, status, detail link, and signup action. Render cancelled events with their cancelled state. Keep the archive order and empty-state behavior from the spec.

- [ ] **Step 3: Replace detail-page data access and metadata**

Consume the validated event, its `hasMarkdownBody` flag, and its mdsvex component. Render title, date/range, optional local times/timezone, location, status, server, signup action, optional external image, Markdown body only when `hasMarkdownBody` is true, and optional map embed. Use the derived map title when `mapTitle` is absent. Set `<title>` to `${event.title} | ${site.title}` and the meta description to `${event.title} in ${event.city}, ${event.country} on ${formatDateRange(event.startDate, event.endDate)}.`. Do not render legacy description/details/link fallback fields.

- [ ] **Step 4: Remove obsolete language-toggle shell styles**

Delete the global radio/label language-switch CSS from `+layout.svelte`. The migration removes language-switch markup, and the launch is English-only. Keep the favicon and child rendering.

- [ ] **Step 5: Apply the approved visual direction**

Retain the current information-dense row layout, but rebrand it as a European event bulletin: warm paper background, black typography, rule lines, one signal accent, large editorial headings, generous whitespace, and mobile stacked rows. Use a serif display stack (`Iowan Old Style`, `Palatino Linotype`, `Palatino`, `Georgia`) and a restrained sans fallback for metadata. Remove Summer Rush wording and stale season labels. Preserve visible focus, semantic headings, contrast, alt text, safe external links, and responsive behavior.

- [ ] **Step 6: Run static checks and assert generated routes**

```bash
bun run check
bun run build
bun -e 'import { readdirSync, existsSync } from "node:fs"; if (!existsSync("build/index.html")) throw new Error("Missing build/index.html"); const ids = readdirSync("src/lib/content/events").filter((name) => name.endsWith(".md")).map((name) => name.slice(0, -3)); const missing = ids.filter((id) => !existsSync(`build/events/${id}.html`)); if (missing.length) throw new Error(`Missing static routes: ${missing.join(", ")}`);'
```

Expected: the checks pass, the build emits `build/index.html`, and every migrated `/events/<id>` page has a corresponding `build/events/<id>.html` without central JSON imports or prerender errors.

- [ ] **Step 7: Commit the public UI**

```bash
git add src/routes/+page.svelte src/routes/events/[id]/+page.svelte src/routes/+layout.svelte
git commit -m "feat: launch Jetlag Events in Europe catalog"
```

---

## Chunk 4: Verification, deployment smoke test, and handoff

### Task 9: Verify behavior against the approved contract

**Files:**

- Modify only the affected implementation/content files if verification exposes a defect.

- [ ] **Step 1: Run the complete test suite**

```bash
bun test
```

Expected: PASS for validation, event utilities, catalog construction, route/view-model metadata, 404 lookup, optional sections, and controlled-date partitioning.

- [ ] **Step 2: Run project checks**

```bash
bun run check
bun run lint
bun run build
```

Expected: all commands PASS; `build/` contains the static home page and every event detail route.

- [ ] **Step 3: Smoke-test the generated static artifact**

Start the built-site preview with the project process manager:

```text
bun run preview --host 127.0.0.1
```

Open the preview URL in a browser; do not use `bun run dev` for this verification.

Open the local URL in a browser and verify:

- Jetlag Events in Europe branding appears on home and detail pages;
- upcoming events are sorted correctly and past events are in the collapsed archive;
- waitlist/cancelled statuses render correctly;
- every migrated event has a detail page;
- metadata-only events render without broken empty sections;
- server links and generated Discord links open correctly;
- Snaketag’s migrated local map asset loads;
- a bilingual page contains English content only;
- desktop and narrow/mobile layouts remain usable;
- keyboard focus and semantic navigation are visible.

Exercise at least one event detail route from the built preview, not only the Vite development fallback.

- [ ] **Step 4: Verify no stale content references or missing migrated IDs**

Use repository search tooling to assert that these patterns have no matches: `summer-rush.json`, `src/lib/events`, `dateLabel`, `eventLinkOverride`, `summerRush`, `SummerRushEvent`, visible `Summer Rush`, and raw `github.com/leandrocoding/summerrush`. Confirm the old central index and source Markdown files are gone. Compare the current event-file ID set against the legacy JSON ID set from the migration-parent commit SHA recorded when Task 5 committed; require exact equality rather than relying only on the current files.

- [ ] **Step 5: Finalize and commit any verification fixes**

If checks reveal defects, fix the smallest affected implementation/content unit and rerun the relevant focused check, then rerun `bun test`, `bun run check`, `bun run lint`, and `bun run build`. Review `git diff --check` and `git status --short`. Stage only the exact reviewed paths changed by verification, using one explicit `git add -A -- path/to/file` command per path; never use `git add .`. If no fixes are needed, make no verification commit. If fixes are needed, commit the final verified state with `git commit -m "chore: verify Jetlag events static release"`.

- [ ] **Step 6: Verify Cloudflare Pages for the final commit**

Push the exact final commit to the non-main branch and open/update its PR. In the connected Cloudflare Pages project, use build command `bun run build`, output directory `build`, production branch `main`, and preview deployments for non-production branches/pull requests. Wait for that commit’s successful build status and unique preview URL. Repeat the preview check whenever the commit changes; merge only after the final preview succeeds.

- [ ] **Step 7: Record the verification handoff**

Record the tested commit SHA, complete command results, built preview URL, at least one tested event route, desktop/mobile browser results, keyboard/accessibility checks, and the Cloudflare status/preview URL. State explicitly that the static website is complete while the Discord bot remains a separate future implementation that consumes the committed schema/server/PR contract.

The future Discord bot should use `event.schema.json`, `servers.json`, the ID/fingerprint rules, and the PR workflow in the approved design spec; it is not part of this commit.
