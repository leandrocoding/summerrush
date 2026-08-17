import { describe, expect, test } from 'bun:test';

import {
	deriveSignupUrl,
	formatDateRange,
	isPastEvent,
	sortArchive,
	sortUpcoming,
	statusLabel
} from './event-utils';

describe('isPastEvent', () => {
	test('an event ending today is not past', () => {
		expect(isPastEvent({ endDate: '2027-04-18' }, '2027-04-18')).toBe(false);
	});

	test('an event ending the previous day is past', () => {
		expect(isPastEvent({ endDate: '2027-04-18' }, '2027-04-19')).toBe(true);
	});

	test('an event ending after today is not past', () => {
		expect(isPastEvent({ endDate: '2027-04-20' }, '2027-04-19')).toBe(false);
	});
});

describe('sortUpcoming', () => {
	test('sorts by startDate ascending, then title ascending', () => {
		const events = [
			{ id: 'zulu', title: 'Zulu', startDate: '2027-05-01', endDate: '2027-05-02' },
			{ id: 'alpha', title: 'Alpha', startDate: '2027-04-18', endDate: '2027-04-18' },
			{ id: 'beta', title: 'Beta', startDate: '2027-04-18', endDate: '2027-04-19' }
		];

		expect(sortUpcoming(events).map((event) => event.id)).toEqual(['alpha', 'beta', 'zulu']);
	});

	test('does not mutate the input array', () => {
		const events = [
			{ title: 'Zulu', startDate: '2027-05-01', endDate: '2027-05-02' },
			{ title: 'Alpha', startDate: '2027-04-18', endDate: '2027-04-18' }
		];
		const original = [...events];

		sortUpcoming(events);

		expect(events).toEqual(original);
	});
});

describe('sortArchive', () => {
	test('sorts by endDate descending, then startDate descending, then title ascending', () => {
		const events = [
			{ id: 'a', title: 'Alpha', startDate: '2027-05-30', endDate: '2027-06-01' },
			{ id: 'b', title: 'Beta', startDate: '2027-05-30', endDate: '2027-06-01' },
			{ id: 'c', title: 'Alpha', startDate: '2027-06-01', endDate: '2027-06-01' },
			{ id: 'd', title: 'Alpha', startDate: '2027-05-01', endDate: '2027-07-01' }
		];

		expect(sortArchive(events).map((event) => event.id)).toEqual(['d', 'c', 'a', 'b']);
	});
});

describe('statusLabel', () => {
	test('returns the exact display label for each status', () => {
		expect(statusLabel('planning')).toBe('Planning');
		expect(statusLabel('confirmed')).toBe('Confirmed');
		expect(statusLabel('signup-open')).toBe('Signup Open');
		expect(statusLabel('full')).toBe('Full');
		expect(statusLabel('waitlist')).toBe('Full / Wait list');
		expect(statusLabel('cancelled')).toBe('Cancelled');
	});
});

describe('formatDateRange', () => {
	test('formats a single-day event as one date', () => {
		expect(formatDateRange('2027-04-18', '2027-04-18')).toBe('18.04.2027');
	});

	test('formats a multi-day range without shifting the dates', () => {
		expect(formatDateRange('2027-07-17', '2027-07-19')).toBe('17.07.2027 \u2013 19.07.2027');
	});

	test('preserves leading zeros in day and month components', () => {
		expect(formatDateRange('2027-01-05', '2027-01-05')).toBe('05.01.2027');
	});
});

describe('deriveSignupUrl', () => {
	test('prefers an explicit signupUrl', () => {
		const url = deriveSignupUrl(
			{ signupUrl: 'https://example.com/signup', discordEventId: '123456789' },
			{ invite: 'https://discord.gg/abc' }
		);

		expect(url).toBe('https://example.com/signup');
	});

	test('builds a Discord deep link from the server invite and discord event id', () => {
		const url = deriveSignupUrl(
			{ discordEventId: '123456789' },
			{ invite: 'https://discord.gg/abc' }
		);

		expect(url).toBe('https://discord.gg/abc?event=123456789');
	});

	test('returns an empty string when signup data is missing', () => {
		expect(deriveSignupUrl({}, undefined)).toBe('');
		expect(deriveSignupUrl({}, { invite: 'https://discord.gg/abc' })).toBe('');
	});

	test('returns an empty string when the event id exists but the server invite is missing', () => {
		expect(deriveSignupUrl({ discordEventId: '123456789' }, undefined)).toBe('');
	});
});
