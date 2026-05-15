<script lang="ts">
	import { resolve } from '$app/paths';
	import jlbIcon from '$lib/assets/JLB.png';
	import jldIcon from '$lib/assets/JLD.png';
	import jleIcon from '$lib/assets/JLE.png';
	import jlnIcon from '$lib/assets/JLN.png';
	import jlsIcon from '$lib/assets/JLS.png';
	import type { Component } from 'svelte';
	import type { PageData } from './$types';

	const eventContentModules = import.meta.glob<{ default: Component }>(
		['/src/lib/events/*.md', '!/src/lib/events/README.md'],
		{ eager: true }
	);

	let { data }: { data: PageData } = $props();

	const event = $derived(data.event);
	const eventUrl = $derived(data.eventUrl);
	const organizer = $derived(data.organizer);
	const site = $derived(data.site);
	const EventContent = $derived(
		eventContentModules[`/src/lib/events/${event.id}.md`]?.default
	);
	const icons = {
		JLB: jlbIcon,
		JLD: jldIcon,
		JLE: jleIcon,
		JLN: jlnIcon,
		JLS: jlsIcon
	};

	function dateLabel() {
		return event.dateLabel || 'Date TBA';
	}

	function locationLabel() {
		return [event.city, event.country].filter(Boolean).join(' - ') || 'Location TBA';
	}

	function organizerIcon() {
		if (!organizer) return jleIcon;
		return icons[organizer.icon as keyof typeof icons] ?? jleIcon;
	}
</script>

<svelte:head>
	<title>{event.title} | {site.title}</title>
	<meta
		name="description"
		content={event.description || `${event.title} details for ${site.title}.`}
	/>
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
			<p class="eyebrow">{dateLabel()}</p>
			<h1 id="event-title">{event.title}</h1>
			<p class="location">{locationLabel()}</p>
		</div>

		<div class="status-block">
			<span>{event.status}</span>
			{#if eventUrl}
				<a class="event-button" href={eventUrl} target="_blank" rel="noreferrer"
					>Open in Discord <span aria-hidden="true">↗</span></a
				>
			{:else}
				<span class="event-button disabled">Open in Discord <span aria-hidden="true">↗</span></span>
			{/if}
		</div>
	</section>

	<section class="meta-grid" aria-label="Event summary">
		<div>
			<span>Date</span>
			<strong>{dateLabel()}</strong>
		</div>
		<div>
			<span>Location</span>
			<strong>{locationLabel()}</strong>
		</div>
		<div class="organizer">
			<span>Organizer</span>
			<strong>
				{#if organizer}
					<img class="server-icon" src={organizerIcon()} alt="" />
					{organizer.name}
				{:else}
					TBA
				{/if}
			</strong>
		</div>
	</section>

	{#if event.image}
		<img class="event-image" src={event.image} alt={event.imageAlt || event.title} />
	{/if}

	<section class="content" aria-label="Event information">
		{#if EventContent}
			<div class="markdown-content">
				<EventContent />
			</div>
		{:else}
			{#if event.description}
				<p class="lead">{event.description}</p>
			{/if}

			{#if event.details?.length}
				<div class="detail-text">
					{#each event.details as detail}
						<p>{detail}</p>
					{/each}
				</div>
			{/if}

			{#if event.links?.length}
				<div class="links">
					<h2>Links</h2>
					{#each event.links as link}
						<a class="link-row" href={link.url}>{link.label}</a>
					{/each}
				</div>
			{/if}
		{/if}
	</section>

	{#if event.mapEmbedUrl}
		<section class="map-section" aria-labelledby="map-title">
			<h2 id="map-title">{event.mapTitle || 'Map'}</h2>
			<div class="map-frame">
				<iframe
					src={event.mapEmbedUrl}
					title={event.mapTitle || `${event.title} map`}
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
				></iframe>
			</div>
		</section>
	{/if}
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
		padding-bottom: 56px;
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
	.back-link,
	.event-button,
	.link-row {
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

	.back-link {
		display: inline-flex;
		margin-top: 24px;
		color: #55524c;
	}

	.back-link:hover,
	nav a:hover,
	.link-row:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.event-hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(180px, auto);
		align-items: end;
		gap: 32px;
		padding: 46px 0 34px;
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
	p {
		margin-top: 0;
	}

	h1 {
		max-width: 780px;
		margin-bottom: 14px;
		font-size: clamp(2.7rem, 8vw, 6.5rem);
		line-height: 0.92;
		letter-spacing: 0;
	}

	h2 {
		margin-bottom: 12px;
		font-size: 1rem;
		line-height: 1.25;
	}

	.location {
		margin-bottom: 0;
		color: #55524c;
		font-size: clamp(1.1rem, 2vw, 1.45rem);
		font-weight: 750;
		line-height: 1.35;
	}

	.status-block {
		display: grid;
		justify-items: end;
		gap: 12px;
	}

	.status-block > span:first-child {
		width: fit-content;
		border: 1px solid #ded9cf;
		border-radius: 999px;
		padding: 5px 9px;
		color: #a34525;
		font-size: 0.82rem;
		font-weight: 800;
	}

	.event-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 42px;
		width: 180px;
		border: 1px solid #5865f2;
		border-radius: 6px;
		padding: 0 14px;
		background: #5865f2;
		color: white;
		gap: 6px;
		font-weight: 800;
		text-decoration: none;
	}

	.event-button.disabled {
		cursor: not-allowed;
		opacity: 0.42;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid #ded9cf;
		border-bottom: 1px solid #ded9cf;
	}

	.meta-grid > div {
		padding: 18px 0;
	}

	.meta-grid > div + div {
		padding-left: 24px;
		border-left: 1px solid #ded9cf;
	}

	.meta-grid span,
	.meta-grid strong {
		display: block;
	}

	.meta-grid span {
		margin-bottom: 6px;
		color: #69645d;
		font-size: 0.78rem;
		font-weight: 750;
		text-transform: uppercase;
	}

	.meta-grid strong {
		font-size: 1rem;
		line-height: 1.35;
	}

	.organizer strong {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.server-icon {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		object-fit: contain;
		background: transparent;
	}

	.event-image {
		display: block;
		width: 100%;
		max-height: 520px;
		margin-top: 34px;
		border-radius: 8px;
		object-fit: cover;
	}

	.content {
		max-width: 760px;
		padding-top: 34px;
	}

	.lead {
		margin-bottom: 22px;
		font-size: 1.2rem;
		font-weight: 650;
		line-height: 1.55;
	}

	.detail-text p {
		margin-bottom: 16px;
		color: #3d3934;
		line-height: 1.7;
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
		margin-bottom: 18px;
		font-size: clamp(2rem, 5vw, 3.25rem);
		line-height: 1;
		letter-spacing: 0;
	}

	.markdown-content :global(h2) {
		margin: 30px 0 12px;
		font-size: 1.45rem;
		line-height: 1.2;
	}

	.markdown-content :global(h3) {
		margin: 24px 0 10px;
		font-size: 1.1rem;
		line-height: 1.25;
	}

	.markdown-content :global(p),
	.markdown-content :global(li) {
		color: #3d3934;
		line-height: 1.7;
	}

	.markdown-content :global(p),
	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin-bottom: 16px;
	}

	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		padding-left: 1.25rem;
	}

	.markdown-content :global(a) {
		font-weight: 700;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}

	.markdown-content :global(img) {
		display: block;
		width: 100%;
		max-height: 520px;
		border-radius: 8px;
		object-fit: cover;
	}

	.links {
		display: grid;
		gap: 10px;
		margin-top: 30px;
	}

	.link-row {
		display: inline-flex;
		width: fit-content;
		min-height: 38px;
		align-items: center;
		border: 1px solid #171717;
		border-radius: 6px;
		padding: 0 12px;
	}

	.map-section {
		padding-top: 44px;
	}

	.map-section h2 {
		margin-bottom: 14px;
		font-size: clamp(1.5rem, 3vw, 2.3rem);
		line-height: 1.05;
	}

	.map-frame {
		overflow: hidden;
		width: 100%;
		aspect-ratio: 4 / 3;
		border: 1px solid #ded9cf;
		border-radius: 8px;
		background: #ebe6dc;
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

		.event-hero,
		.meta-grid {
			grid-template-columns: 1fr;
		}

		.event-hero {
			align-items: start;
			gap: 18px;
			padding-top: 36px;
		}

		.status-block {
			justify-items: start;
			width: 100%;
		}

		.event-button {
			width: 100%;
		}

		.meta-grid > div + div {
			padding-left: 0;
			border-top: 1px solid #ded9cf;
			border-left: 0;
		}
	}

	@media (max-width: 520px) {
		.site-header {
			display: grid;
		}
	}
</style>
