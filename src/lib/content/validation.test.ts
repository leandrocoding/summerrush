import { describe, expect, test } from 'bun:test';

import { validateEventFrontMatter } from './validation';

const FILE_PATH = 'src/lib/content/events/amsterdam-2027-04-18.md';
const SERVER_IDS = ['benelux', 'europa', 'uk', 'nordics'];

type FrontMatter = Record<string, unknown>;

function validFrontMatter(): FrontMatter {
	return {
		schemaVersion: 1,
		title: 'H+S Amsterdam',
		startDate: '2027-04-18',
		endDate: '2027-04-18',
		startTime: '10:00',
		endTime: '18:00',
		timezone: 'Europe/Amsterdam',
		city: 'Amsterdam',
		country: 'Netherlands',
		hostServerId: 'benelux',
		status: 'waitlist',
		discordEventId: '123456789012345678',
		signupUrl: 'https://example.com/signup',
		imageUrl: 'https://cdn.example.com/amsterdam.webp',
		imageAlt: 'Amsterdam skyline',
		mapEmbedUrl: 'https://www.google.com/maps/d/embed?mid=example',
		mapTitle: 'Game map',
	};
}

function expectValidationError(metadata: FrontMatter, field: string): void {
	let thrown: unknown;

	try {
		validateEventFrontMatter(metadata, SERVER_IDS, FILE_PATH);
	} catch (error) {
		thrown = error;
	}

	expect(thrown).toBeInstanceOf(Error);
	expect((thrown as Error).message).toContain(FILE_PATH);
	expect((thrown as Error).message).toContain(field);
}

describe('validateEventFrontMatter', () => {
	test('accepts a complete record with quoted ISO dates, local time, waitlist, server, and Google Maps URL', () => {
		const result = validateEventFrontMatter(validFrontMatter(), SERVER_IDS, FILE_PATH);

		expect(result).toMatchObject({
			schemaVersion: 1,
			title: 'H+S Amsterdam',
			startDate: '2027-04-18',
			endDate: '2027-04-18',
			startTime: '10:00',
			endTime: '18:00',
			timezone: 'Europe/Amsterdam',
			hostServerId: 'benelux',
			status: 'waitlist',
			mapEmbedUrl: 'https://www.google.com/maps/d/embed?mid=example',
		});
	});

	test.each([
		['schemaVersion', 'schemaVersion'],
		['title', 'title'],
		['startDate', 'startDate'],
		['endDate', 'endDate'],
		['city', 'city'],
		['country', 'country'],
		['hostServerId', 'hostServerId'],
		['status', 'status'],
	] as const)('rejects missing required field %s', (field, offendingField) => {
		const metadata = validFrontMatter();
		delete metadata[field];

		expectValidationError(metadata, offendingField);
	});

	test.each(['title', 'city', 'country', 'hostServerId'] as const)('rejects an empty required display field %s', (field) => {
		const metadata = validFrontMatter();
		metadata[field] = '';

		expectValidationError(metadata, field);
	});

	test.each([
		['startDate', new Date('2027-04-18')],
		['startDate', 20270418],
		['endDate', new Date('2027-04-18')],
		['endDate', 20270418],
	] as const)('rejects non-string or unquoted date values in %s', (field, value) => {
		const metadata = validFrontMatter();
		metadata[field] = value;

		expectValidationError(metadata, field);
	});

	test('rejects an unsupported schema version', () => {
		const metadata = validFrontMatter();
		metadata.schemaVersion = 2;

		expectValidationError(metadata, 'schemaVersion');
	});

	test('rejects an impossible calendar date', () => {
		const metadata = validFrontMatter();
		metadata.startDate = '2027-02-30';
		metadata.endDate = '2027-03-01';

		expectValidationError(metadata, 'startDate');
	});

	test('rejects a reversed date range', () => {
		const metadata = validFrontMatter();
		metadata.startDate = '2027-04-19';
		metadata.endDate = '2027-04-18';

		expectValidationError(metadata, 'endDate');
	});

	test.each([
		['startTime', '9:00'],
		['startTime', '25:00'],
		['endTime', '9:00'],
		['endTime', '25:00'],
	] as const)('rejects malformed or out-of-range time %s=%s', (field, value) => {
		const metadata = validFrontMatter();
		metadata[field] = value;

		expectValidationError(metadata, field);
	});

	test.each(['startTime', 'endTime', 'timezone'] as const)('rejects a time without its paired %s field', (missingField) => {
		const metadata = validFrontMatter();
		delete metadata[missingField];

		expectValidationError(metadata, missingField);
	});

	test('rejects an invalid IANA timezone', () => {
		const metadata = validFrontMatter();
		metadata.timezone = 'Not/A_Timezone';

		expectValidationError(metadata, 'timezone');
	});

	test.each([
		['18:00', 'endTime'],
		['17:00', 'endDate']
	] as const)('rejects same-day endTime <= startTime (%s)', (endTime, offendingField) => {
		const metadata = validFrontMatter();
		metadata.startTime = '18:00';
		metadata.endTime = endTime;

		expectValidationError(metadata, offendingField);
	});

	test('rejects an overnight time range with an unchanged endDate', () => {
		const metadata = validFrontMatter();
		metadata.startTime = '18:00';
		metadata.endTime = '09:00';

		expectValidationError(metadata, 'endDate');
	});

	test('rejects an unknown host server ID', () => {
		const metadata = validFrontMatter();
		metadata.hostServerId = 'unknown-server';

		expectValidationError(metadata, 'hostServerId');
	});

	test.each(['planning', 'confirmed', 'signup-open', 'full', 'waitlist', 'cancelled'] as const)(
		'accepts status %s',
		(status) => {
			const metadata = validFrontMatter();
			metadata.status = status;

			expect(validateEventFrontMatter(metadata, SERVER_IDS, FILE_PATH)).toMatchObject({ status });
		},
	);

	test('rejects an unknown front-matter key', () => {
		const metadata = validFrontMatter();
		metadata.unknownField = 'not allowed';

		expectValidationError(metadata, 'unknownField');
	});

	test.each([
		['startTime', 1000],
		['endTime', 1800],
		['timezone', 42],
		['discordEventId', 123456789012345678n],
		['signupUrl', ['https://example.com/signup']],
		['imageUrl', { url: 'https://cdn.example.com/image.webp' }],
		['imageAlt', ['Amsterdam skyline']],
		['mapEmbedUrl', true],
		['mapTitle', 7],
	] as const)('rejects an optional field with the wrong type: %s', (field, value) => {
		const metadata = validFrontMatter();
		metadata[field] = value;

		expectValidationError(metadata, field);
	});

	test.each([
		['signupUrl', 'http://example.com/signup'],
		['imageUrl', 'http://cdn.example.com/image.webp'],
	] as const)('rejects a non-HTTPS %s', (field, value) => {
		const metadata = validFrontMatter();
		metadata[field] = value;

		expectValidationError(metadata, field);
	});


	test('rejects a map URL outside the Google Maps allowlist', () => {
		const metadata = validFrontMatter();
		metadata.mapEmbedUrl = 'https://maps.example.com/maps/d/embed?mid=example';

		expectValidationError(metadata, 'mapEmbedUrl');
	});

	test('rejects an image without imageAlt', () => {
		const metadata = validFrontMatter();
		delete metadata.imageAlt;

		expectValidationError(metadata, 'imageAlt');
	});
});
