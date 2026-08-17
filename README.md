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

To deploy the built directory manually, run:

```sh
wrangler pages deploy build --project-name jetlag-events-in-europe
```

`wrangler.jsonc` pins the Cloudflare Pages output directory, and
`static/_headers` restricts map-embed frames to Google Maps origins.
