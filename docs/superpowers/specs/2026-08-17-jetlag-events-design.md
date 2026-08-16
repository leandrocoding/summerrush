# Jetlag Events in Europe — Design Specification

**Date:** 2026-08-17  
**Status:** Approved for implementation planning  
**Repository:** `JLEuropa/summerrush`

## 1. Problem and outcome

The current site is a SvelteKit/Cloudflare event listing branded as Summer Rush. Event metadata lives in one central JSON file and event detail prose lives in separate Markdown files. That is workable for manual editing, but it is a poor contract for a future Discord command that must create and edit events through GitHub pull requests.

The new site will be branded **Jetlag Events in Europe**. It will remain a Git-built static site. All published content will be reviewed and merged through GitHub. A future Discord bot, implemented in a separate repository, will create or update event PRs against this repository using the content contract defined here.

The first implementation covers the public website, migration of current content, and the machine-readable contract required by the future bot. It does not implement the Discord bot.

## 2. Decisions and scope

### Decisions

- Use one canonical Markdown file per event, with YAML front matter and an optional Markdown body.
- Use the immutable event filename as the event ID and URL segment.
- Keep the existing shared Jet Lag server list. Events reference a server by `hostServerId`; they do not duplicate organizer data.
- Use English-only content initially.
- A merged event is public. Upcoming/archive visibility is derived from dates, not from a publication field.
- Support date ranges and optional local start/end times with an IANA timezone.
- Accept external HTTPS media/map URLs only for automated fields. The bot does not upload files.
- Preserve the existing events, event prose, and local image assets during migration.
- Show upcoming events first and retain a past-event archive.
- Use trusted Discord roles for future command authorization.
- Allow at most one open bot PR per event.
- Keep human review and merge as the publication gate.

### In scope

- Rebrand all public copy and metadata from Summer Rush to Jetlag Events in Europe.
- Replace the central event index with per-event content files.
- Add build-time front-matter validation.
- Migrate existing event records and detail Markdown.
- Render upcoming events, past events, server information, and stable detail pages.
- Configure a fully prerendered build suitable for Cloudflare Pages previews.
- Document the future Discord-to-GitHub add/edit contract.

### Out of scope

- Discord bot implementation or deployment.
- A runtime CMS, database, admin UI, or public authentication.
- Automatic PR merging, event deletion, or branch force-pushing.
- File uploads from Discord.
- Calendar-grid views, filtering, map-overview pages, or multilingual fields.

## 3. Repository architecture

The content boundary will be explicit:

```text
src/lib/content/
  site.json
  servers.json
  event.schema.json
  load-events.ts
  events/
    <event-id>.md
```

`site.json` contains the public site title, tagline, description, navigation labels, and notes. It replaces the Summer Rush site object and does not contain event records.

`servers.json` contains the existing server records, including stable IDs, names, regions, icons, and invite URLs. It is a shared directory for the site and future bot; it is not an event-specific organizer database.

`event.schema.json` documents and validates the parsed front matter. `schemaVersion: 1` is required in every event file. `load-events.ts` scans the event Markdown modules, validates metadata, joins each event to `servers.json`, and returns the catalog consumed by the routes.

There is no committed generated event index. The loader creates the index during the build, eliminating a shared JSON merge-conflict hotspot. Event files are independently reviewable and independently editable by developers on non-main branches.

The existing SvelteKit route structure remains conceptually stable:

- `/` renders the event catalog and server directory.
- `/events/<event-id>` renders an event detail page.
- unknown event IDs return 404.

## 4. Event file contract

The filename is the immutable event ID. It must be a lowercase URL-safe slug matching the existing event IDs and the future bot’s generated IDs. The ID is intentionally not repeated in front matter.

New bot-generated IDs use this rule:

1. slugify the city to lowercase ASCII words separated by hyphens;
2. append `-YYYY-MM-DD` using `startDate`;
3. if that ID already exists in `main` or an open bot PR, append the smallest available numeric suffix (`-2`, `-3`, ...).

Migrated IDs are retained even if their historical slug was generated from a title rather than the city. Once a file exists, its ID never changes when the title, city, or dates change.

### Example

```yaml
---
schemaVersion: 1
title: H+S Amsterdam
startDate: 2027-04-18
endDate: 2027-04-18
startTime: "10:00"
endTime: "18:00"
timezone: Europe/Amsterdam
city: Amsterdam
country: Netherlands
hostServerId: benelux
status: signup-open
discordEventId: "123456789012345678"
signupUrl: https://example.com/signup
imageUrl: https://cdn.example.com/amsterdam.webp
imageAlt: Amsterdam skyline
mapEmbedUrl: https://www.google.com/maps/d/embed?mid=example
mapTitle: Game map
---

Optional event details written in Markdown.

## Meeting point

The reviewer can expand this body directly in the PR.
```

### Required front matter

| Field | Contract |
| --- | --- |
| `schemaVersion` | Integer; currently `1`. |
| `title` | Non-empty display title. |
| `startDate` | ISO calendar date, `YYYY-MM-DD`. |
| `endDate` | ISO calendar date; equal to or later than `startDate`. |
| `city` | Non-empty display location. |
| `country` | Non-empty display country or region. |
| `hostServerId` | Must match an ID in `servers.json`. |
| `status` | One of `planning`, `confirmed`, `signup-open`, `full`, or `cancelled`. |

`status` is a public registration/event state. It is not a publication state. A merged file is public.

### Optional front matter

| Field | Contract |
| --- | --- |
| `startTime` | Local `HH:mm` value. |
| `endTime` | Local `HH:mm` value. |
| `timezone` | IANA timezone, required when either time is present. |
| `discordEventId` | Discord event identifier as a string. |
| `signupUrl` | Absolute `https://` URL; takes precedence over generated Discord links. |
| `imageUrl` | Absolute `https://` URL. |
| `imageAlt` | Required when `imageUrl` is present. |
| `mapEmbedUrl` | Absolute `https://` URL for an embeddable map. |
| `mapTitle` | Accessible map heading/title. |

If `signupUrl` is absent and both `discordEventId` and the assigned server’s invite exist, the loader may preserve the current deep-link behavior by appending the event identifier to the server invite URL. `dateLabel` is removed; date display is derived from the ISO fields.

The Markdown body is optional. It may contain headings, paragraphs, lists, links, and images needed by migrated editorial content. The page heading comes from `title`, so an H1 is not required in the body. Unknown front-matter keys are rejected to keep the bot contract deterministic.

The validator rejects malformed dates, reversed ranges, invalid times/timezones, invalid status values, unknown server IDs, duplicate IDs, invalid URLs, missing image alt text, and schema versions the site does not support. It reports the file and field in the build error.

## 5. Public website behavior

### Home page

The home page uses the Jetlag Events in Europe site configuration and has this order:

1. site header and navigation;
2. short hero/introduction;
3. summary counts;
4. upcoming event list;
5. collapsible past-event archive;
6. shared Discord server directory;
7. footer notes.

Upcoming events are sorted by `startDate`, then title. Past events are sorted newest first. An event is past when its `endDate` is before the current date. Cancelled events remain visible with a cancelled state rather than silently disappearing.

Each event row displays the date/range, title, city/country, server icon/name, status, a stable detail link, and a signup/Discord link when available. Every event has a detail link even when its Markdown body is empty because the metadata is sufficient to render a valid page.

The initial site does not add a calendar grid, filtering, map overview, or search. The existing server directory remains public and uses the same shared records and invite links.

### Detail page

`/events/<event-id>` displays:

- event title and date/range;
- optional local time and timezone;
- city and country;
- status;
- assigned server and icon;
- signup/Discord action when available;
- optional external image;
- optional Markdown body;
- optional map embed.

Missing optional values remove only their corresponding sections. The page has a unique title and description, semantic heading structure, keyboard-visible focus, accessible image/map labels, and responsive layouts. External links use safe target/rel attributes. Map embeds are constrained by the deployment Content Security Policy.

### Visual direction

Use a restrained European event bulletin/travel-dispatch visual language: warm paper-toned background, strong black typography, rule lines, one signal accent for statuses and actions, oversized editorial headings, compact information rows, generous whitespace, and stacked responsive layouts. Avoid Summer Rush copy, dashboard cards, gradients, and generic SaaS styling.

The event list and detail page preserve the current site’s practical information density while improving the brand and ensuring all metadata-only events remain usable.

## 6. Static deployment

The site should use SvelteKit’s static adapter with prerendering enabled for the home page and every event detail route. The current Cloudflare Workers-oriented `wrangler.jsonc` configuration is replaced or adapted for a Cloudflare Pages static deployment.

The Cloudflare Pages project is connected to the website Git repository:

- pushes to the production branch build and deploy production;
- pushes to other branches create preview deployments;
- pull requests receive a unique preview URL and repository status check;
- merge to `main` is the production publication action.

The generated catalog includes every event. Upcoming/archive classification is recalculated in the browser so a long-lived deployment can move an event into the archive without a content commit. The prerendered initial HTML may reflect the build date until hydration updates the classification; a scheduled rebuild is not part of the first implementation.

## 7. Future Discord-to-GitHub contract

The bot is a separate project. It consumes the website repository’s `event.schema.json` and `servers.json` rather than duplicating undocumented fields.

### Authorization

`/event add` and `/event edit` are available only in configured guilds and to configured trusted Discord roles. Authorization is checked both when opening the interaction and when submitting it. The website has no runtime admin endpoint.

### Add command

The command performs these steps:

1. Check guild/role authorization.
2. Open a modal containing the five textual basics: title, start date, end date, city, and country.
3. Present an ephemeral selection step for `hostServerId` from `servers.json` and `status` from the schema enum.
4. Normalize whitespace, dates, and text; generate the immutable ID.
5. Validate all values against the pinned website schema and server list.
6. Check `main` and open bot PRs for the candidate ID.
7. Create branch `bot/event/add/<id>` from the current default branch.
8. Commit `src/lib/content/events/<id>.md` with valid front matter and an empty body.
9. Open one PR against `main`.
10. Reply with the PR URL.

The initial Discord flow does not collect prose, images, maps, optional times, or custom URLs. A reviewer/developer can add those fields directly in the PR. The schema supports them for future advanced interactions.

Discord’s modal component limit is the reason the server and status values are collected in the follow-up selection step instead of adding more text inputs.

### Edit command

`/event edit <id>` offers event IDs through autocomplete and pre-fills the current metadata. It updates only front matter and preserves the Markdown body. It never renames the file when city or dates change.

There is at most one open bot PR per event:

- an add request for an event with an existing open bot PR returns that PR;
- an edit request updates the existing bot branch/PR when it is compatible;
- a reviewer-introduced incompatible change stops the bot and links the PR for manual resolution;
- the bot never force-pushes or overwrites unrelated Markdown edits.

### GitHub integration

Use a GitHub App installed only on the website repository. Minimum repository permissions:

- Contents: read/write;
- Pull requests: read/write;
- Metadata: read.

The bot needs no repository administration, Actions write access, deployment write access, or long-lived personal access token. The bot creates branches and file commits through the GitHub API, then opens the pull request. `main` remains protected and cannot be written by the bot.

PR titles use `Add event: <title> (<id>)` or `Update event: <title> (<id>)`. The body records the operation, event ID, file path, schema version, Discord requester, source guild, and submitted values. The bot returns the PR immediately; an optional later webhook can post the Cloudflare preview URL after deployment status is available.

### Failure behavior

- Invalid modal input produces field-level ephemeral errors and no GitHub mutation.
- Existing event IDs or open PRs are handled idempotently rather than duplicated.
- GitHub failures return a retryable error and retain operation identifiers sufficient to resume.
- Cloudflare build failures remain visible as PR checks; the bot never bypasses them.
- Branch divergence is reported for manual resolution.
- No bot operation accepts an arbitrary repository path, branch base, or raw file content from the user.

## 8. Migration and verification acceptance

Migration must convert every current event record into an event file, retain its stable URL ID, carry over server assignment/status/Discord identifier/map data, and preserve existing Markdown details and local static image assets. `dateLabel` and other central-index-only presentation fields are removed.

The website implementation is accepted when:

1. all current events and event detail content are present after migration;
2. the loader produces the correct upcoming and past sets from migrated dates;
3. a valid new event file appears in the list and its stable detail route;
4. invalid event fixtures fail the build with file-and-field diagnostics;
5. editing front matter preserves the Markdown body and route;
6. missing optional fields remove only their related UI sections;
7. the static build emits the home page and every event page;
8. the Cloudflare-connected branch/PR produces a preview deployment;
9. no Summer Rush branding or stale central event keys remain;
10. public pages remain keyboard-accessible, responsive, and readable;
11. generated signup links preserve current server/event behavior where applicable.

The website implementation and the future bot implementation remain separate plans. This document is the shared interface between them.

## References

- [SvelteKit adapter-static](https://svelte.dev/docs/kit/adapter-static)
- [SvelteKit prerendering](https://svelte.dev/docs/kit/configuration#prerender)
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [Discord modal components](https://discord.com/developers/docs/components/using-modal-components)
- [GitHub REST repository contents](https://docs.github.com/en/rest/repos/contents)
