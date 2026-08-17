<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { partitionEvents, type EventRecord } from '$lib/content/catalog';
	import { browserToday } from '$lib/content/page-data';
	import { formatDateRange, statusLabel } from '$lib/content/event-utils';
	import { serverIconFor } from '$lib/server-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const site = $derived(data.site);
	const servers = $derived(data.servers);
	const events = $derived(data.events);

	let visitorToday = $state<string | undefined>(undefined);
	const today = $derived(visitorToday ?? data.buildToday);
	const partition = $derived(partitionEvents(events, today));
	const uniqueCountries = $derived(uniqueCountryCount(events));

	onMount(() => {
		visitorToday = browserToday();
	});

	function uniqueCountryCount(events: EventRecord[]): number {
		const countries = new Set<string>();
		for (const event of events) {
			for (const part of event.country.split(/,\s*|\s+and\s+/i)) {
				const country = part.trim();
				if (country) countries.add(country);
			}
		}
		return countries.size;
	}

	function locationFor(event: EventRecord): string {
		return event.city === event.country ? event.city : `${event.city}, ${event.country}`;
	}

	function eventPathFor(event: EventRecord): string {
		return resolve(`/events/${event.id}`);
	}
</script>

<svelte:head>
	<title>{site.title}</title>
	<meta name="description" content={site.description} />
</svelte:head>

<main>
	<header class="site-header">
		<a class="brand" href={resolve('/')}>{site.title}</a>
		<nav aria-label="Main navigation">
			<a href={resolve('/#events')}>Events</a>
			<a href={resolve('/#servers')}>Servers</a>
		</nav>
	</header>

	<section class="hero" aria-labelledby="hero-title">
		<p class="eyebrow">European community bulletin</p>
		<h1 id="hero-title">{site.title}</h1>
		<p class="tagline">{site.tagline}</p>
		<p class="intro">{site.description}</p>
		<div class="actions">
			<a class="button primary" href={resolve('/#events')}>{site.primaryAction.label}</a>
			<a class="button" href={resolve('/#servers')}>{site.secondaryAction.label}</a>
		</div>
	</section>

	<section class="summary" aria-label="Catalog summary">
		<div>
			<strong>{partition.upcoming.length}</strong>
			<span>upcoming events</span>
		</div>
		<div>
			<strong>{uniqueCountries}</strong>
			<span>countries</span>
		</div>
		<div>
			<strong>{servers.length}</strong>
			<span>servers</span>
		</div>
	</section>

	<section class="section" id="events" aria-labelledby="events-title">
		<div class="section-header">
			<p class="eyebrow">Schedule</p>
			<h2 id="events-title">Upcoming events</h2>
		</div>

		<div class="event-list">
			{#each partition.upcoming as event (event.id)}
				{@render eventRow(event)}
			{:else}
				<p class="empty-state">No upcoming events right now.</p>
			{/each}
		</div>

		{#if partition.archive.length}
			<details class="archive">
				<summary>
					<span>Past events</span>
					<strong>{partition.archive.length}</strong>
				</summary>

				<div class="event-list">
					{#each partition.archive as event (event.id)}
						{@render eventRow(event, true)}
					{/each}
				</div>
			</details>
		{/if}
	</section>

	<section class="section" id="servers" aria-labelledby="servers-title">
		<div class="section-header">
			<p class="eyebrow">Communities</p>
			<h2 id="servers-title">Discord servers</h2>
		</div>

		<div class="server-list">
			{#each servers as server (server.id)}
				<article class="server-row">
					<img class="server-icon" src={serverIconFor(server.icon)} alt="" />
					<div class="server-main">
						<h3>{server.name}</h3>
						<p>{server.region}</p>
					</div>
					<div class="join-block">
						{#if server.invite}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a class="join-button" href={server.invite} target="_blank" rel="noreferrer"
								>Join server <span aria-hidden="true">↗</span></a
							>
						{:else}
							<span class="join-button disabled">Join server</span>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	</section>

	<footer>
		{#each site.notes as note (note)}
			<p>{note}</p>
		{/each}
	</footer>
</main>

{#snippet eventRow(event: EventRecord, isArchived = false)}
	<article class="event-row" class:archived={isArchived}>
		<div class="date">
			<span>{formatDateRange(event.startDate, event.endDate)}</span>
			<small>{isArchived ? 'Completed' : statusLabel(event.status)}</small>
		</div>

		<img class="server-icon" src={serverIconFor(event.server.icon)} alt="" />

		<div class="event-main">
			<h3><a href={eventPathFor(event)}>{event.title}</a></h3>
			<p>{locationFor(event)}</p>
		</div>

		<div class="organizer">
			<span>Organizer</span>
			<strong>{event.server.name}</strong>
		</div>

		<div class="event-action">
			<a class="info-button" href={eventPathFor(event)}
				>{isArchived ? 'View event' : 'More info'}</a
			>
			{#if !isArchived && event.signupUrl}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="event-button" href={event.signupUrl} target="_blank" rel="noreferrer"
					>Sign up <span aria-hidden="true">↗</span></a
				>
			{/if}
		</div>
	</article>
{/snippet}

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
		--font-sans:
			'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
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
	nav a:hover {
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}

	.hero {
		max-width: 820px;
		padding: 80px 0 64px;
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
	h3,
	p {
		margin-top: 0;
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-display);
		font-weight: 700;
		letter-spacing: -0.015em;
	}

	h1 {
		margin-bottom: 22px;
		font-size: clamp(3.1rem, 9vw, 6.9rem);
		line-height: 0.92;
	}

	h2 {
		margin-bottom: 0;
		font-size: clamp(1.9rem, 4vw, 3.1rem);
		line-height: 0.98;
	}

	h3 {
		margin-bottom: 5px;
		font-family: var(--font-display);
		font-size: 1.22rem;
		line-height: 1.15;
	}

	.tagline {
		margin-bottom: 12px;
		font-family: var(--font-display);
		font-size: clamp(1.35rem, 2.6vw, 1.9rem);
		font-weight: 600;
		line-height: 1.2;
	}

	.intro {
		max-width: 620px;
		margin-bottom: 26px;
		color: var(--ink-soft);
		font-family: var(--font-sans);
		line-height: 1.65;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		border: 1px solid var(--rule);
		border-radius: 2px;
		padding: 0 18px;
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		text-decoration: none;
	}

	.button:hover {
		text-decoration: none;
	}

	.button.primary {
		background: var(--ink);
		color: var(--paper);
	}

	.button:not(.primary):hover {
		background: var(--paper-soft);
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid var(--rule);
		border-bottom: 1px solid var(--rule);
	}

	.summary div {
		padding: 20px 0;
	}

	.summary div + div {
		padding-left: 28px;
		border-left: 1px solid var(--rule-soft);
	}

	.summary strong,
	.summary span {
		display: block;
	}

	.summary strong {
		margin-bottom: 5px;
		font-family: var(--font-display);
		font-size: 2.2rem;
		font-weight: 700;
		line-height: 1;
	}

	.summary span {
		color: var(--ink-faint);
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.section {
		padding-top: 72px;
	}

	.section-header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 22px;
	}

	.section-header .eyebrow {
		margin-bottom: 8px;
	}

	.event-list,
	.server-list {
		display: grid;
		border-top: 1px solid var(--rule);
	}

	.archive {
		margin-top: 28px;
		border-top: 1px solid var(--rule);
	}

	.archive summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: 56px;
		cursor: pointer;
		color: var(--ink-soft);
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		list-style: none;
	}

	.archive summary::-webkit-details-marker {
		display: none;
	}

	.archive summary strong {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 30px;
		height: 30px;
		border: 1px solid var(--rule);
		border-radius: 999px;
		color: var(--ink);
		font-size: 0.82rem;
		letter-spacing: 0;
	}

	.archive .event-list {
		border-top: 0;
	}

	.event-row,
	.server-row {
		display: grid;
		align-items: center;
		gap: 20px;
		border-bottom: 1px solid var(--rule-soft);
		padding: 18px 0;
	}

	.event-row {
		grid-template-columns: 128px 42px minmax(180px, 1fr) minmax(160px, 0.8fr) 300px;
	}

	.event-row.archived {
		color: var(--ink-soft);
	}

	.server-row {
		grid-template-columns: 42px minmax(200px, 1fr) minmax(200px, auto);
	}

	.date {
		display: grid;
		gap: 7px;
	}

	.date span {
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.date small {
		width: fit-content;
		border: 1px solid var(--accent);
		border-radius: 2px;
		padding: 3px 7px;
		color: var(--accent);
		font-family: var(--font-sans);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.server-icon {
		width: 42px;
		height: 42px;
		border-radius: 6px;
		object-fit: contain;
		background: transparent;
	}

	.event-main p,
	.server-main p {
		margin-bottom: 0;
		color: var(--ink-faint);
		font-family: var(--font-sans);
		line-height: 1.45;
	}

	.event-main a {
		text-decoration: none;
	}

	.event-main a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
	}

	.organizer {
		display: grid;
		gap: 4px;
	}

	.organizer span {
		color: var(--ink-faint);
		font-family: var(--font-sans);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.organizer strong {
		font-family: var(--font-sans);
		font-size: 0.92rem;
		font-weight: 600;
	}

	.join-block {
		display: grid;
		justify-items: end;
	}

	.event-action {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 8px;
	}

	.event-button,
	.info-button,
	.join-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		width: 142px;
		border-radius: 2px;
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-decoration: none;
		gap: 6px;
	}

	.info-button {
		border: 1px solid var(--rule);
		padding: 0 12px;
		background: transparent;
		color: var(--ink);
	}

	.info-button:hover {
		background: var(--paper-soft);
	}

	.event-button,
	.join-button {
		border: 1px solid var(--accent);
		padding: 0 12px;
		background: var(--accent);
		color: var(--accent-ink);
	}

	.event-button:hover,
	.join-button:hover {
		filter: brightness(0.94);
	}

	.join-button {
		width: 100%;
		min-width: 168px;
	}

	.join-button.disabled {
		cursor: not-allowed;
		border-color: var(--rule-soft);
		background: var(--paper-soft);
		color: var(--ink-faint);
		opacity: 0.7;
	}

	.empty-state {
		border-bottom: 1px solid var(--rule-soft);
		margin-bottom: 0;
		padding: 20px 0;
		color: var(--ink-faint);
		font-family: var(--font-sans);
	}

	footer {
		border-top: 1px solid var(--rule);
		margin-top: 72px;
		padding-top: 20px;
		color: var(--ink-faint);
		font-family: var(--font-sans);
		font-size: 0.88rem;
		line-height: 1.6;
	}

	footer p {
		margin-bottom: 0;
	}

	@media (max-width: 940px) {
		.event-row {
			grid-template-columns: 108px 42px minmax(160px, 1fr) minmax(140px, 0.8fr) 156px;
		}
	}

	@media (max-width: 760px) {
		main {
			width: min(100% - 24px, 640px);
		}

		.hero {
			padding: 52px 0 44px;
		}

		.summary,
		.event-row,
		.server-row {
			grid-template-columns: 1fr;
		}

		.summary div + div {
			padding-left: 0;
			border-top: 1px solid var(--rule-soft);
			border-left: 0;
		}

		.event-row,
		.server-row {
			align-items: start;
			gap: 12px;
			padding: 20px 0;
		}

		.event-row {
			grid-template-columns: 42px 1fr;
		}

		.event-row .date {
			grid-column: 2;
		}

		.event-row .server-icon {
			grid-column: 1;
			grid-row: 1 / span 2;
			margin-top: 2px;
		}

		.event-row .event-main,
		.event-row .organizer,
		.event-row .event-action {
			grid-column: 1 / -1;
		}

		.event-row .event-action {
			justify-content: start;
			width: 100%;
		}

		.join-block {
			justify-items: start;
			width: 100%;
		}

		.event-button,
		.info-button,
		.join-button {
			width: 100%;
		}

		.server-icon {
			width: 48px;
			height: 48px;
		}
	}

	@media (max-width: 520px) {
		.site-header {
			display: grid;
			gap: 12px;
		}

		.actions,
		.button {
			width: 100%;
		}

		.section-header {
			display: grid;
			align-items: start;
		}
	}
</style>
