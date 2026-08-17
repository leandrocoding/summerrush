import { afterEach, beforeAll, describe, expect, mock, test } from 'bun:test';
import type { Component } from 'svelte';

import { partitionEvents, type EventRecord, type Server, type Site } from './catalog';
import { browserToday, detailMeta, eventEntries, findEvent, optionalSections } from './page-data';

const SERVER: Server = {
	id: 'europa',
	name: 'Jet Lag Europa',
	region: 'Europe-wide',
	icon: 'JLE',
	invite: 'https://discord.gg/europa-invite'
};

const SITE: Site = {
	title: 'Jetlag Events in Europe',
	tagline: 'Community-run Jet Lag games across Europe',
	description: 'Find upcoming games, event details, and the Discord communities hosting them.',
	primaryAction: { label: 'Events' },
	secondaryAction: { label: 'Servers' },
	notes: ['Join the corresponding community server for event details and signups.']
};

function eventRecord(overrides: Partial<EventRecord> = {}): EventRecord {
	return {
		schemaVersion: 1,
		title: 'Event',
		startDate: '2027-04-18',
		endDate: '2027-04-18',
		city: 'City',
		country: 'Country',
		hostServerId: 'europa',
		status: 'confirmed',
		id: 'event',
		filePath: './events/event.md',
		signupUrl: '',
		server: SERVER,
		hasMarkdownBody: false,
		...overrides
	};
}

describe('eventEntries', () => {
	test('returns every catalog ID in catalog order', () => {
		const events = [
			eventRecord({ id: 'alpha' }),
			eventRecord({ id: 'beta' }),
			eventRecord({ id: 'gamma' })
		];

		expect(eventEntries(events)).toEqual(['alpha', 'beta', 'gamma']);
	});
});

describe('findEvent', () => {
	test('returns the matching event by ID', () => {
		const known = eventRecord({ id: 'known' });

		expect(findEvent([known], 'known')).toBe(known);
	});

	test('returns undefined for an unknown ID', () => {
		expect(findEvent([eventRecord({ id: 'known' })], 'unknown')).toBeUndefined();
	});
});

describe('detailMeta', () => {
	test('builds a deterministic title and description for a multi-day event', () => {
		const event = eventRecord({
			id: 'amsterdam',
			title: 'H+S Amsterdam',
			city: 'Amsterdam',
			country: 'Netherlands',
			startDate: '2027-04-18',
			endDate: '2027-04-19'
		});

		expect(detailMeta(event, SITE)).toEqual({
			title: 'H+S Amsterdam | Jetlag Events in Europe',
			description: 'H+S Amsterdam in Amsterdam, Netherlands on 18.04.2027 \u2013 19.04.2027.'
		});
	});

	test('uses a single date for a single-day event', () => {
		const event = eventRecord({
			id: 'milan',
			title: 'Milan Meetup',
			city: 'Milan',
			country: 'Italy'
		});

		expect(detailMeta(event, SITE).description).toBe('Milan Meetup in Milan, Italy on 18.04.2027.');
	});
});

describe('optionalSections', () => {
	test('flags every section absent for a metadata-only event', () => {
		expect(optionalSections(eventRecord())).toEqual({
			signup: false,
			image: false,
			hasMarkdownBody: false,
			map: false
		});
	});

	test('flags signup, image, body, and map sections when present', () => {
		expect(
			optionalSections(
				eventRecord({
					signupUrl: 'https://example.com/signup',
					imageUrl: 'https://example.com/image.webp',
					hasMarkdownBody: true,
					mapEmbedUrl: 'https://www.google.com/maps/d/embed?mid=abc'
				})
			)
		).toEqual({ signup: true, image: true, hasMarkdownBody: true, map: true });
	});
});

describe('browserToday', () => {
	test('formats a controlled local calendar date as YYYY-MM-DD', () => {
		expect(browserToday(new Date(2026, 7, 17))).toBe('2026-08-17');
	});

	test('formats a UTC instant in a fixed timezone', () => {
		expect(browserToday(new Date('2026-08-18T01:30:00Z'), 'America/New_York')).toBe('2026-08-17');
		expect(browserToday(new Date('2026-08-18T01:30:00Z'), 'Asia/Kathmandu')).toBe('2026-08-18');
	});

	test('defaults to the current date when no argument is provided', () => {
		expect(browserToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe('partitionEvents', () => {
	test('moves an event from upcoming to archive across two visitor dates', () => {
		const events = [eventRecord({ id: 'moving', startDate: '2027-04-18', endDate: '2027-04-18' })];

		const before = partitionEvents(events, '2027-04-18');
		expect(before.upcoming.map((event) => event.id)).toEqual(['moving']);
		expect(before.archive).toHaveLength(0);

		const after = partitionEvents(events, '2027-04-19');
		expect(after.upcoming).toHaveLength(0);
		expect(after.archive.map((event) => event.id)).toEqual(['moving']);
	});
});

describe('event detail route data contract', () => {
	const ROUTE_EVENT = eventRecord({
		id: 'paris-2027-04-18',
		title: 'Paris Sprint',
		city: 'Paris',
		country: 'France'
	});
	const CONTENT_COMPONENT = {} as Component;

	type RouteModule = {
		load: (event: { params: { id: string } }) => unknown;
		entries: () => Array<{ id: string }>;
	};

	const errorCalls: Array<[number, string]> = [];
	let route: RouteModule;

	beforeAll(async () => {
		mock.module('@sveltejs/kit', () => ({
			error: (status: number, body: string) => {
				errorCalls.push([status, body]);
				throw new Error(`__svelte_error_${status}__`);
			}
		}));

		mock.module('$lib/content/load-events', () => ({
			site: SITE,
			servers: [SERVER],
			events: [ROUTE_EVENT],
			eventContent: { [ROUTE_EVENT.id]: CONTENT_COMPONENT }
		}));

		// Deferred import is required: a static import would evaluate the route (and its
		// $lib/kit dependencies) before the mocks above are registered.
		route = (await import('../../routes/events/[id]/+page.ts')) as RouteModule;
	});

	afterEach(() => {
		errorCalls.length = 0;
	});

	test('generates one entry per catalog ID', () => {
		expect(route.entries()).toEqual([{ id: 'paris-2027-04-18' }]);
	});

	test('returns event, server, site, and content for a known ID', () => {
		const data = route.load({ params: { id: 'paris-2027-04-18' } });

		expect(data).toEqual({
			event: ROUTE_EVENT,
			server: SERVER,
			site: SITE,
			content: CONTENT_COMPONENT
		});
		expect(errorCalls).toEqual([]);
	});

	test('takes the 404 path for an unknown ID', () => {
		expect(() => route.load({ params: { id: 'unknown' } })).toThrow('__svelte_error_404__');
		expect(errorCalls).toEqual([[404, 'Event not found']]);
	});
});
