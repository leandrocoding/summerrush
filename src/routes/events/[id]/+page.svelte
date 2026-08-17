<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatDateRange, statusLabel } from '$lib/content/event-utils';
	import { detailMeta } from '$lib/content/page-data';
	import { serverIconFor } from '$lib/server-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const event = $derived(data.event);
	const server = $derived(data.server);
	const site = $derived(data.site);
	const EventContent = $derived(data.content);

	const meta = $derived(detailMeta(event, site));
	const dateRange = $derived(formatDateRange(event.startDate, event.endDate));
	const status = $derived(statusLabel(event.status));
	const serverIcon = $derived(serverIconFor(server.icon));
	const location = $derived(
		event.city === event.country ? event.city : `${event.city}, ${event.country}`
	);
	const hasTimes = $derived(Boolean(event.startTime && event.endTime && event.timezone));
	const mapTitle = $derived(event.mapTitle ?? `${event.title} map`);
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
</svelte:head>

<main>
	<header class="site-header">
		<a class="brand" href={resolve('/')}>{site.title}</a>
		<nav aria-label="Main navigation">
			<a href={resolve('/#events')}>Events</a>
			<a href={resolve('/#servers')}>Servers</a>
		</nav>
	</header>

	<a class="back-link" href={resolve('/#events')}>Back to events</a>

	<section class="event-hero" aria-labelledby="event-title">
		<div>
			<p class="eyebrow">{dateRange}</p>
			<h1 id="event-title">{event.title}</h1>
			<p class="location">{location}</p>
		</div>

		<div class="status-block">
			<span>{status}</span>
			{#if event.signupUrl}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="event-button" href={event.signupUrl} target="_blank" rel="noreferrer"
					>Sign up <span aria-hidden="true">↗</span></a
				>
			{/if}
		</div>
	</section>

	<section class="meta-grid" aria-label="Event summary">
		<div>
			<span>Date</span>
			<strong>{dateRange}</strong>
		</div>
		{#if hasTimes}
			<div>
				<span>Time</span>
				<strong>{event.startTime} – {event.endTime} · {event.timezone}</strong>
			</div>
		{/if}
		<div>
			<span>Location</span>
			<strong>{location}</strong>
		</div>
		<div class="organizer">
			<span>Organizer</span>
			<strong>
				<img class="server-icon" src={serverIcon} alt="" />
				{server.name}
			</strong>
		</div>
	</section>

	{#if event.imageUrl}
		<img class="event-image" src={event.imageUrl} alt={event.imageAlt || event.title} />
	{/if}

	{#if event.hasMarkdownBody}
		<section class="content" aria-label="Event information">
			<div class="markdown-content">
				<EventContent />
			</div>
		</section>
	{/if}

	{#if event.mapEmbedUrl}
		<section class="map-section" aria-labelledby="map-title">
			<h2 id="map-title">{mapTitle}</h2>
			<div class="map-frame">
				<iframe
					src={event.mapEmbedUrl}
					title={mapTitle}
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
				></iframe>
			</div>
		</section>
	{/if}
</main>

<style>
	:global(:root) {
		--paper: #f4eee0;
		--paper-soft: #ece4d1;
		--ink: #1a1510;
		--ink-soft: #4c4538;
		--ink-faint: #756b5a;
		--rule: #1a1510;
		--rule-soft: #d8ccb3;
		--accent: #c22e1c;
		--accent-ink: #f4eee0;
		--font-display:
			'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif;
		--font-sans: 'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		margin: 0;
		background: var(--paper);
		color: var(--ink);
		font-family: var(--font-sans);
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	:global(a) {
		color: inherit;
	}

	:global(:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	main {
		width: min(1080px, calc(100% - 40px));
		margin: 0 auto;
		padding-bottom: 64px;
	}

	.site-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 24px;
		padding: 22px 0 18px;
		border-bottom: 3px solid var(--rule);
	}

	.brand {
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		text-decoration: none;
	}

	nav {
		display: flex;
		gap: 22px;
	}

	nav a {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		text-decoration: none;
	}

	.brand:hover,
	nav a:hover,
	.back-link:hover {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}

	.back-link {
		display: inline-flex;
		margin-top: 26px;
		color: var(--ink-soft);
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		text-decoration: none;
	}

	.event-hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(180px, auto);
		align-items: end;
		gap: 32px;
		padding: 48px 0 38px;
	}

	.eyebrow {
		margin: 0 0 14px;
		color: var(--accent);
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	h1,
	h2,
	p {
		margin-top: 0;
	}

	h1,
	h2 {
		font-family: var(--font-display);
		font-weight: 700;
		letter-spacing: -0.015em;
	}

	h1 {
		max-width: 820px;
		margin-bottom: 18px;
		font-size: clamp(2.8rem, 7.5vw, 6.3rem);
		line-height: 0.92;
	}

	h2 {
		margin-bottom: 14px;
		font-size: clamp(1.5rem, 3vw, 2.3rem);
		line-height: 1.02;
	}

	.location {
		margin-bottom: 0;
		color: var(--ink-soft);
		font-family: var(--font-sans);
		font-size: clamp(1.05rem, 2vw, 1.35rem);
		font-weight: 600;
		line-height: 1.4;
	}

	.status-block {
		display: grid;
		justify-items: end;
		gap: 12px;
	}

	.status-block > span:first-child {
		width: fit-content;
		border: 1px solid var(--accent);
		border-radius: 2px;
		padding: 5px 10px;
		color: var(--accent);
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.event-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 46px;
		width: 180px;
		border: 1px solid var(--accent);
		border-radius: 2px;
		padding: 0 16px;
		background: var(--accent);
		color: var(--accent-ink);
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		gap: 6px;
		text-decoration: none;
	}

	.event-button:hover {
		filter: brightness(0.94);
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		border-top: 1px solid var(--rule);
		border-bottom: 1px solid var(--rule);
	}

	.meta-grid > div {
		padding: 20px 0;
	}

	.meta-grid > div + div {
		padding-left: 26px;
		border-left: 1px solid var(--rule-soft);
	}

	.meta-grid span,
	.meta-grid strong {
		display: block;
	}

	.meta-grid span {
		margin-bottom: 7px;
		color: var(--ink-faint);
		font-family: var(--font-sans);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.meta-grid strong {
		font-family: var(--font-sans);
		font-size: 0.98rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.organizer strong {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.server-icon {
		width: 32px;
		height: 32px;
		border-radius: 5px;
		object-fit: contain;
		background: transparent;
	}

	.event-image {
		display: block;
		width: 100%;
		max-height: 520px;
		margin-top: 36px;
		border: 1px solid var(--rule-soft);
		object-fit: cover;
	}

	.content {
		max-width: 760px;
		padding-top: 40px;
	}

	.markdown-content :global(h1),
	.markdown-content :global(h2),
	.markdown-content :global(h3),
	.markdown-content :global(p),
	.markdown-content :global(ul),
	.markdown-content :global(ol),
	.markdown-content :global(figure) {
		margin-top: 0;
	}

	.markdown-content :global(h1) {
		margin-bottom: 20px;
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3.1rem);
		line-height: 1;
	}

	.markdown-content :global(h2) {
		margin: 32px 0 12px;
		font-family: var(--font-display);
		font-size: 1.5rem;
		line-height: 1.15;
	}

	.markdown-content :global(h3) {
		margin: 24px 0 10px;
		font-family: var(--font-display);
		font-size: 1.15rem;
		line-height: 1.2;
	}

	.markdown-content :global(p),
	.markdown-content :global(li) {
		color: var(--ink-soft);
		font-family: var(--font-sans);
		line-height: 1.72;
	}

	.markdown-content :global(p),
	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin-bottom: 16px;
	}

	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		padding-left: 1.3rem;
	}

	.markdown-content :global(a) {
		color: var(--accent);
		font-weight: 600;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}

	.markdown-content :global(img) {
		display: block;
		width: 100%;
		max-height: 520px;
		margin: 8px 0 20px;
		border: 1px solid var(--rule-soft);
		object-fit: cover;
	}

	.map-section {
		padding-top: 48px;
	}

	.map-frame {
		overflow: hidden;
		width: 100%;
		aspect-ratio: 4 / 3;
		border: 1px solid var(--rule);
		background: var(--paper-soft);
	}

	.map-frame iframe {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}

	@media (max-width: 760px) {
		main {
			width: min(100% - 24px, 640px);
		}

		.event-hero {
			grid-template-columns: 1fr;
			align-items: start;
			gap: 20px;
			padding-top: 38px;
		}

		.status-block {
			justify-items: start;
			width: 100%;
		}

		.event-button {
			width: 100%;
		}

		.meta-grid {
			grid-template-columns: 1fr;
		}

		.meta-grid > div + div {
			padding-left: 0;
			border-top: 1px solid var(--rule-soft);
			border-left: 0;
		}
	}

	@media (max-width: 520px) {
		.site-header {
			display: grid;
			gap: 12px;
		}
	}
</style>
