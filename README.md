# Jetlag Events in Europe

Community-run Jet Lag games and events across Europe. A static SvelteKit site
built from a validated per-event Markdown catalog and deployed to Cloudflare Pages.

## Developing

Install dependencies and start the development server:

```sh
bun install
bun run dev
```

Open the printed local URL in a browser.

## Content

Each event lives in `src/lib/content/events/<event-id>.md`. The filename is the
immutable event ID and URL segment. Front matter is validated against
`src/lib/content/event.schema.json` at build time. Shared server records live in
`src/lib/content/servers.json` and site copy in `src/lib/content/site.json`.

Run the test suite with:

```sh
bun test
```

## Building

Build a production version of the app:

```sh
bun run build
```

The static adapter writes the prerendered site to the `build/` directory. The
home page and every event detail route are prerendered. Preview it locally with:

```sh
bun run preview
```

## Deploying to Cloudflare Pages

The Cloudflare Pages project is connected to this Git repository:

- the production branch is `main` — pushes to `main` build and deploy production;
- pushes to other branches create preview deployments;
- pull requests receive a unique preview URL and a repository status check.

The Pages build command is `bun run build` and the output directory is `build`.

Do not configure `npx wrangler versions upload` as the Cloudflare deploy
command. That is a Workers version-upload command and expects a Worker entry
point or a Workers `assets` directory; this project is a static Cloudflare
Pages build.

For a Git-connected Pages project, leave the custom deploy command empty.
Cloudflare Pages deploys the output directory after `bun run build` and creates
the branch/pull-request preview automatically. If the hosting setup requires a
manual deploy command instead, use:

```sh
wrangler pages deploy build --project-name jetlag-events-in-europe
```

To deploy the built directory manually, run:

```sh
wrangler pages deploy build --project-name jetlag-events-in-europe
```

`wrangler.jsonc` pins the Cloudflare Pages output directory, and
`static/_headers` restricts map-embed frames to Google Maps origins.
