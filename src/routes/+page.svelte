<script lang="ts">
	import { resolve } from '$app/paths';
	import summerRush from '$lib/data/summer-rush.json';
	import { serverIconFor } from '$lib/server-icons';

	type SummerRushEvent = (typeof summerRush.events)[number];
	type Server = (typeof summerRush.servers)[number];

	const eventContentModules = import.meta.glob('/src/lib/events/*.md', { eager: true });
	const { site, events, servers, notes } = summerRush;

	function dateLabel(event: SummerRushEvent) {
		return event.dateLabel || 'Date TBA';
	}

	function organizerFor(event: SummerRushEvent) {
		return servers.find((server) => server.id === event.hostServerId);
	}

	function iconFor(server: Server) {
		return serverIconFor(server.icon);
	}

	function locationFor(event: SummerRushEvent) {
		return [event.city, event.country].filter(Boolean).join(' - ');
	}

	function eventUrlFor(event: SummerRushEvent, organizer: Server | undefined) {
		if (event.eventLinkOverride) return event.eventLinkOverride;
		if (!event.eventId || !organizer?.invite) return '';

		const url = new URL(organizer.invite);
		url.searchParams.set('event', event.eventId);
		return url.toString();
	}

	function eventPathFor(event: SummerRushEvent) {
		return resolve(`/events/${event.id}`);
	}

	function hasEventInfo(event: SummerRushEvent) {
		return `/src/lib/events/${event.id}.md` in eventContentModules;
	}
</script>

<svelte:head>
	<title>{site.title} | {site.season}</title>
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
		<p class="eyebrow">{site.season}</p>
		<h1 id="hero-title">{site.title}</h1>
		<p class="tagline">{site.tagline}</p>
		<p class="intro">{site.description}</p>
		<div class="actions">
			<a class="button primary" href={resolve('/#events')}>{site.primaryAction.label}</a>
			<a class="button" href={resolve('/#servers')}>{site.secondaryAction.label}</a>
		</div>
	</section>

	<section class="summary" aria-label="Series summary">
		<div>
			<strong>{events.length}</strong>
			<span>event{events.length === 1 ? '' : 's'}</span>
		</div>
		<div>
			<strong>{servers.length}</strong>
			<span>participating servers</span>
		</div>
		<div>
			<strong>14</strong>
			<span>Countries</span>
		</div>
	</section>

	<section class="section" id="events" aria-labelledby="events-title">
		<div class="section-header">
			<p class="eyebrow">Schedule</p>
			<h2 id="events-title">Events</h2>
		</div>

		<div class="event-list">
			{#each events as event (event.id)}
				{@const organizer = organizerFor(event)}
				{@const eventUrl = eventUrlFor(event, organizer)}
				<article class="event-row">
					<div class="date">
						<span>{dateLabel(event)}</span>
						<small>{event.status}</small>
					</div>

					{#if organizer}
						<img class="server-icon" src={iconFor(organizer)} alt="" />
					{:else}
						<span class="server-icon empty" aria-hidden="true"></span>
					{/if}

					<div class="event-main">
						<h3><a href={eventPathFor(event)}>{event.title}</a></h3>
						<p>{locationFor(event)}</p>
					</div>

					<div class="organizer">
						<span>Organizer</span>
						<strong>{organizer?.name ?? 'TBA'}</strong>
					</div>

					<div class="event-action">
						{#if hasEventInfo(event)}
							<a class="info-button" href={eventPathFor(event)}>More info</a>
						{:else}
							<span class="info-button disabled">More info</span>
						{/if}
						{#if eventUrl}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a class="event-button" href={eventUrl} target="_blank" rel="noreferrer"
								>Open in Discord <span aria-hidden="true">↗</span></a
							>
						{:else}
							<span class="event-button disabled"
								>Open in Discord <span aria-hidden="true">↗</span></span
							>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="section" id="servers" aria-labelledby="servers-title">
		<div class="section-header">
			<p class="eyebrow">Communities</p>
			<h2 id="servers-title">Discord Servers</h2>
		</div>

		<div class="server-list">
			{#each servers as server (server.id)}
				<article class="server-row">
					<img class="server-icon" src={iconFor(server)} alt="" />
					<div>
						<h3>{server.name}</h3>
						<p>{server.region}</p>
					</div>
					<div class="join-block">
						{#if server.invite}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a class="join-button" href={server.invite}>Join server</a>
						{:else}
							<span class="join-button disabled">Join server</span>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	</section>

	<footer>
		{#each notes as note (note)}
			<p>{note}</p>
		{/each}
	</footer>
</main>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		margin: 0;
		background: #faf8f2;
		color: #171717;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	:global(a) {
		color: inherit;
	}

	main {
		width: min(1040px, calc(100% - 32px));
		margin: 0 auto;
		padding-bottom: 48px;
	}

	.site-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		padding: 24px 0;
		border-bottom: 1px solid #ded9cf;
	}

	.brand,
	nav a,
	.button,
	.event-row a,
	.server-row a {
		font-weight: 700;
		text-decoration: none;
	}

	.brand {
		font-size: 1.05rem;
	}

	nav {
		display: flex;
		gap: 18px;
		color: #55524c;
		font-size: 0.95rem;
	}

	.hero {
		max-width: 760px;
		padding: 72px 0 56px;
	}

	.eyebrow {
		margin: 0 0 10px;
		color: #a34525;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h1,
	h2,
	h3,
	p {
		margin-top: 0;
	}

	h1 {
		margin-bottom: 14px;
		font-size: clamp(3.4rem, 10vw, 7.5rem);
		line-height: 0.9;
		letter-spacing: 0;
	}

	h2 {
		margin-bottom: 0;
		font-size: clamp(1.8rem, 4vw, 3rem);
		line-height: 1;
		letter-spacing: 0;
	}

	h3 {
		margin-bottom: 5px;
		font-size: 1rem;
		line-height: 1.25;
	}

	.tagline {
		margin-bottom: 10px;
		font-size: clamp(1.2rem, 2.5vw, 1.7rem);
		font-weight: 750;
		line-height: 1.25;
	}

	.intro {
		max-width: 680px;
		margin-bottom: 22px;
		color: #55524c;
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
		min-height: 40px;
		border: 1px solid #171717;
		border-radius: 6px;
		padding: 0 14px;
	}

	.button.primary {
		background: #171717;
		color: #faf8f2;
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid #ded9cf;
		border-bottom: 1px solid #ded9cf;
	}

	.summary div {
		padding: 18px 0;
	}

	.summary div + div {
		padding-left: 24px;
		border-left: 1px solid #ded9cf;
	}

	.summary strong,
	.summary span {
		display: block;
	}

	.summary strong {
		margin-bottom: 4px;
		font-size: 1.55rem;
		line-height: 1;
	}

	.summary span,
	.event-main p,
	.server-row p,
	.organizer span,
	footer {
		color: #69645d;
	}

	.section {
		padding-top: 56px;
	}

	.section-header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 18px;
	}

	.event-list,
	.server-list {
		display: grid;
		border-top: 1px solid #ded9cf;
	}

	.event-row,
	.server-row {
		display: grid;
		align-items: center;
		gap: 18px;
		border-bottom: 1px solid #ded9cf;
		padding: 16px 0;
	}

	.event-row {
		grid-template-columns: 120px 42px minmax(180px, 1fr) minmax(160px, 0.8fr) 296px;
	}

	.server-row {
		grid-template-columns: 42px minmax(180px, 1fr) minmax(190px, auto);
	}

	.date {
		display: grid;
		gap: 5px;
	}

	.date span {
		font-weight: 800;
	}

	.date small {
		width: fit-content;
		border: 1px solid #ded9cf;
		border-radius: 999px;
		padding: 3px 7px;
		color: #a34525;
		font-size: 0.76rem;
		font-weight: 800;
	}

	.server-icon {
		width: 42px;
		height: 42px;
		border-radius: 8px;
		object-fit: contain;
		background: transparent;
	}

	.server-icon.empty {
		display: block;
		border: 1px dashed #cfc8bc;
		background: transparent;
	}

	.event-main p,
	.server-row p {
		margin-bottom: 0;
		line-height: 1.45;
	}

	.event-main a {
		text-decoration: none;
	}

	.event-main a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.organizer {
		display: grid;
		gap: 3px;
	}

	.organizer span {
		font-size: 0.78rem;
		font-weight: 750;
		text-transform: uppercase;
	}

	.join-block {
		display: grid;
		justify-items: end;
	}

	.event-action {
		display: grid;
		grid-template-columns: repeat(2, 144px);
		justify-content: flex-end;
		gap: 8px;
	}

	.event-button,
	.info-button,
	.join-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 46px;
		width: min(100%, 180px);
		border-radius: 6px;
		background: #171717;
		color: #faf8f2;
		font-size: 1rem;
		font-weight: 850;
		text-decoration: none;
	}

	.event-button {
		min-height: 40px;
		width: 144px;
		border: 1px solid #5865f2;
		padding: 0 12px;
		background: #5865f2;
		color: white;
		gap: 6px;
	}

	.info-button {
		min-height: 40px;
		width: 144px;
		border: 1px solid #171717;
		padding: 0 12px;
		background: transparent;
		color: #171717;
	}

	.event-button.disabled,
	.info-button.disabled,
	.join-button.disabled {
		cursor: not-allowed;
		opacity: 0.42;
	}

	.info-button.disabled {
		border-color: #bdb6aa;
		background: #ebe6dc;
		color: #69645d;
	}

	footer {
		border-top: 1px solid #ded9cf;
		margin-top: 56px;
		padding-top: 18px;
		font-size: 0.95rem;
	}

	footer p {
		margin-bottom: 0;
	}

	@media (max-width: 820px) {
		main {
			width: min(100% - 24px, 640px);
		}

		.hero {
			padding: 48px 0 40px;
		}

		.summary,
		.event-row,
		.server-row {
			grid-template-columns: 1fr;
		}

		.summary div + div {
			padding-left: 0;
			border-top: 1px solid #ded9cf;
			border-left: 0;
		}

		.event-row,
		.server-row {
			align-items: start;
			gap: 10px;
		}

		.join-block {
			justify-items: start;
			width: 100%;
		}

		.event-action {
			grid-template-columns: 1fr;
			justify-content: flex-start;
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
		}

		.actions,
		.button {
			width: 100%;
		}
	}
</style>
