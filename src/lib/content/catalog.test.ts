import { describe, expect, test } from 'bun:test';
import type { Component } from 'svelte';

import {
	buildCatalog,
	partitionEvents,
	type EventModule,
	type EventRecord,
	type Server,
	type Site
} from './catalog';

const COMPONENT_A = {} as Component;
const COMPONENT_B = {} as Component;

const BENELUX: Server = {
	id: 'benelux',
	name: 'Jet Lag Benelux',
	region: 'Belgium, Netherlands and Luxembourg',
	icon: 'JLB',
	invite: 'https://discord.gg/benelux-invite'
};

const EUROPA: Server = {
	id: 'europa',
	name: 'Jet Lag Europa',
	region: 'Europe-wide',
	icon: 'JLE',
	invite: 'https://discord.gg/europa-invite'
};

const SERVERS = [EUROPA, BENELUX];

const SITE: Site = {
	title: 'Jetlag Events in Europe',
	tagline: 'Community-run Jet Lag games across Europe',
	description: 'Find upcoming games, event details, and the Discord communities hosting them.',
	primaryAction: { label: 'Events' },
	secondaryAction: { label: 'Servers' },
	notes: ['Join the corresponding community server for event details and signups.']
};

type Metadata = Record<string, unknown>;

function validMetadata(overrides: Metadata = {}): Metadata {
	return {
		schemaVersion: 1,
		title: 'H+S Amsterdam',
		startDate: '2027-04-18',
		endDate: '2027-04-18',
		city: 'Amsterdam',
		country: 'Netherlands',
		hostServerId: 'benelux',
		status: 'confirmed',
		...overrides
	};
}

function module(
	filePath: string,
	metadata: Metadata,
	rawSource = '',
	component: Component = COMPONENT_A
): Record<string, EventModule> {
	return { [filePath]: { metadata, component, rawSource } };
}

function eventRecord(overrides: Partial<EventRecord> = {}): EventRecord {
	return {
		schemaVersion: 1,
		title: 'Event',
		startDate: '2027-04-18',
		endDate: '2027-04-18',
		city: 'City',
		country: 'Country',
		hostServerId: 'benelux',
		status: 'confirmed',
		id: 'event',
		filePath: './events/event.md',
		signupUrl: '',
		server: BENELUX,
		hasMarkdownBody: false,
		...overrides
	};
}

describe('buildCatalog', () => {
	test('constructs a catalog from valid modules', () => {
		const rawSource = [
			'---',
			'title: H+S Amsterdam',
			'---',
			'',
			'Join us in Amsterdam.',
			''
		].join('\n');

		const catalog = buildCatalog(
			module('./events/amsterdam-2027-04-18.md', validMetadata(), rawSource),
			SERVERS,
			SITE
		);

		expect(catalog.site).toBe(SITE);
		expect(catalog.servers).toEqual(SERVERS);

		expect(catalog.events).toHaveLength(1);
		const [event] = catalog.events;
		expect(event.id).toBe('amsterdam-2027-04-18');
		expect(event.filePath).toBe('./events/amsterdam-2027-04-18.md');
		expect(event.title).toBe('H+S Amsterdam');
		expect(event.server.id).toBe('benelux');
		expect(event.hasMarkdownBody).toBe(true);
	});

	test('reports malformed metadata with the source path', () => {
		const modules = module(
			'./events/amsterdam-2027-04-18.md',
			validMetadata({ endDate: '2027-04-17' })
		);

		let thrown: unknown;
		try {
			buildCatalog(modules, SERVERS, SITE);
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toContain('./events/amsterdam-2027-04-18.md');
		expect((thrown as Error).message).toContain('endDate');
	});

	test.each([
		'Amsterdam-2027-04-18',
		'amsterdam_2027-04-18',
		'amsterdam--2027-04-18',
		'-amsterdam-2027-04-18',
		'amsterdam-2027-04-18-',
		'amsterdam 2027-04-18',
		'amsterdam.2027-04-18'
	])('rejects a non-URL-safe filename %s', (badId) => {
		const modules = module(`./events/${badId}.md`, validMetadata());

		let thrown: unknown;
		try {
			buildCatalog(modules, SERVERS, SITE);
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toContain(badId);
	});

	test('rejects duplicate event IDs before inserting into maps', () => {
		const modules = {
			...module('./events/amsterdam-2027-04-18.md', validMetadata()),
			...module('./elsewhere/amsterdam-2027-04-18.md', validMetadata({ title: 'Duplicate' }))
		};

		let thrown: unknown;
		try {
			buildCatalog(modules, SERVERS, SITE);
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toContain('amsterdam-2027-04-18');
	});

	test('rejects an unknown host server', () => {
		const modules = module(
			'./events/amsterdam-2027-04-18.md',
			validMetadata({ hostServerId: 'narnia' })
		);

		let thrown: unknown;
		try {
			buildCatalog(modules, SERVERS, SITE);
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toContain('hostServerId');
	});

	test('derives a signup URL from the Discord event id and server invite', () => {
		const catalog = buildCatalog(
			module(
				'./events/amsterdam-2027-04-18.md',
				validMetadata({ discordEventId: '123456789012345678' })
			),
			SERVERS,
			SITE
		);

		expect(catalog.events[0].signupUrl).toBe(
			'https://discord.gg/benelux-invite?event=123456789012345678'
		);
	});

	test('prefers an explicit signupUrl over the derived Discord link', () => {
		const catalog = buildCatalog(
			module(
				'./events/amsterdam-2027-04-18.md',
				validMetadata({
					discordEventId: '123456789012345678',
					signupUrl: 'https://example.com/signup'
				})
			),
			SERVERS,
			SITE
		);

		expect(catalog.events[0].signupUrl).toBe('https://example.com/signup');
	});

	test('leaves signupUrl empty when there is no link and no server invite', () => {
		const noInviteServer: Server = {
			id: 'benelux',
			name: 'Jet Lag Benelux',
			region: 'Belgium, Netherlands and Luxembourg',
			icon: 'JLB'
		};

		const catalog = buildCatalog(
			module('./events/amsterdam-2027-04-18.md', validMetadata()),
			[noInviteServer],
			SITE
		);

		expect(catalog.events[0].signupUrl).toBe('');
	});

	test('keys the content map by event id', () => {
		const catalog = buildCatalog(
			{
				...module('./events/amsterdam-2027-04-18.md', validMetadata(), '', COMPONENT_A),
				...module(
					'./events/brussels-2027-04-19.md',
					validMetadata({
						title: 'Brussels',
						startDate: '2027-04-19',
						endDate: '2027-04-19',
						city: 'Brussels'
					}),
					'',
					COMPONENT_B
				)
			},
			SERVERS,
			SITE
		);

		expect(Object.keys(catalog.eventContent)).toEqual([
			'amsterdam-2027-04-18',
			'brussels-2027-04-19'
		]);
		expect(catalog.eventContent['amsterdam-2027-04-18']).toBe(COMPONENT_A);
		expect(catalog.eventContent['brussels-2027-04-19']).toBe(COMPONENT_B);
	});

	test('honors an explicit filePaths order', () => {
		const modules = {
			...module('./events/zeta-2027-04-18.md', validMetadata({ title: 'Zeta' })),
			...module('./events/alpha-2027-04-18.md', validMetadata({ title: 'Alpha' }))
		};

		const catalog = buildCatalog(modules, SERVERS, SITE, [
			'./events/alpha-2027-04-18.md',
			'./events/zeta-2027-04-18.md'
		]);

		expect(catalog.events.map((event) => event.id)).toEqual([
			'alpha-2027-04-18',
			'zeta-2027-04-18'
		]);
	});

	test('sets hasMarkdownBody true when a body remains after front matter', () => {
		const catalog = buildCatalog(
			module('./events/amsterdam-2027-04-18.md', validMetadata(), '---\ntitle: X\n---\n\nSome body.\n'),
			SERVERS,
			SITE
		);

		expect(catalog.events[0].hasMarkdownBody).toBe(true);
	});

	test('sets hasMarkdownBody false for an empty body', () => {
		const catalog = buildCatalog(
			module('./events/amsterdam-2027-04-18.md', validMetadata(), '---\ntitle: X\n---'),
			SERVERS,
			SITE
		);

		expect(catalog.events[0].hasMarkdownBody).toBe(false);
	});

	test('sets hasMarkdownBody false for a whitespace-only body', () => {
		const catalog = buildCatalog(
			module(
				'./events/amsterdam-2027-04-18.md',
				validMetadata(),
				'---\ntitle: X\n---\n\n  \n\t\n'
			),
			SERVERS,
			SITE
		);

		expect(catalog.events[0].hasMarkdownBody).toBe(false);
	});
});

describe('partitionEvents', () => {
	test('keeps an event ending today in the upcoming partition', () => {
		const events = [
			eventRecord({ id: 'ends-today', startDate: '2027-04-18', endDate: '2027-04-18' }),
			eventRecord({ id: 'past', startDate: '2027-04-10', endDate: '2027-04-17' }),
			eventRecord({ id: 'future', startDate: '2027-04-20', endDate: '2027-04-21' })
		];

		const { upcoming, archive } = partitionEvents(events, '2027-04-18');

		expect(upcoming.map((event) => event.id)).toEqual(['ends-today', 'future']);
		expect(archive.map((event) => event.id)).toEqual(['past']);
	});

	test('keeps an event spanning today in the upcoming partition', () => {
		const events = [
			eventRecord({ id: 'spanning', startDate: '2027-04-17', endDate: '2027-04-19' })
		];

		const { upcoming, archive } = partitionEvents(events, '2027-04-18');

		expect(upcoming.map((event) => event.id)).toEqual(['spanning']);
		expect(archive).toHaveLength(0);
	});

	test('does not mutate the input events', () => {
		const events = [
			eventRecord({ id: 'past', startDate: '2027-04-10', endDate: '2027-04-17' }),
			eventRecord({ id: 'future', startDate: '2027-04-20', endDate: '2027-04-21' })
		];

		partitionEvents(events, '2027-04-18');

		expect(events.map((event) => event.id)).toEqual(['past', 'future']);
	});
});
