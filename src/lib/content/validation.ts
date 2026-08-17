export const EVENT_STATUSES = [
	'planning',
	'confirmed',
	'signup-open',
	'full',
	'waitlist',
	'cancelled'
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export type EventFrontMatter = {
	schemaVersion: 1;
	title: string;
	startDate: string;
	endDate: string;
	startTime?: string;
	endTime?: string;
	timezone?: string;
	city: string;
	country: string;
	hostServerId: string;
	status: EventStatus;
	discordEventId?: string;
	signupUrl?: string;
	imageUrl?: string;
	imageAlt?: string;
	mapEmbedUrl?: string;
	mapTitle?: string;
};

const DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u;
const TIME_PATTERN = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/u;
const GOOGLE_MAP_URL_PATTERN =
	/^https:\/\/(?!.*(?:\.\.|%2[eE]))(?:www\.google\.com\/maps\/[^?#\s]*|maps\.google\.com\/[^?#\s]*)(?:[?#][^\s]*)?$/u;
const ALLOWED_FIELDS: Record<string, true> = {
	schemaVersion: true,
	title: true,
	startDate: true,
	endDate: true,
	startTime: true,
	endTime: true,
	timezone: true,
	city: true,
	country: true,
	hostServerId: true,
	status: true,
	discordEventId: true,
	signupUrl: true,
	imageUrl: true,
	imageAlt: true,
	mapEmbedUrl: true,
	mapTitle: true
};
const REQUIRED_FIELDS = [
	'schemaVersion',
	'title',
	'startDate',
	'endDate',
	'city',
	'country',
	'hostServerId',
	'status'
] as const;
const TIME_FIELDS = ['startTime', 'endTime', 'timezone'] as const;

type RawFrontMatter = Record<string, unknown>;

function hasOwn(record: RawFrontMatter, field: string): boolean {
	return Object.prototype.hasOwnProperty.call(record, field);
}

function fail(filePath: string, field: string, reason: string): never {
	throw new Error(`${filePath}: invalid ${field}: ${reason}`);
}

function requiredString(record: RawFrontMatter, field: string, filePath: string): string {
	const value = record[field];
	if (typeof value !== 'string' || value.length === 0) {
		fail(filePath, field, 'must be a non-empty string');
	}
	return value;
}

function optionalString(record: RawFrontMatter, field: string, filePath: string, nonEmpty = false): string | undefined {
	if (!hasOwn(record, field)) return undefined;

	const value = record[field];
	if (typeof value !== 'string' || (nonEmpty && value.length === 0)) {
		fail(filePath, field, nonEmpty ? 'must be a non-empty string' : 'must be a string');
	}
	return value;
}

function calendarDate(value: string, field: string, filePath: string): void {
	if (!DATE_PATTERN.test(value)) {
		fail(filePath, field, 'must be an ISO calendar date in YYYY-MM-DD form');
	}

	const year = Number(value.slice(0, 4));
	const month = Number(value.slice(5, 7));
	const day = Number(value.slice(8, 10));
	const daysInMonth =
		month === 2
			? isLeapYear(year)
				? 29
				: 28
			: month === 4 || month === 6 || month === 9 || month === 11
				? 30
				: 31;

	if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
		fail(filePath, field, 'must be a real calendar date');
	}
}

function isLeapYear(year: number): boolean {
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function clockMinutes(value: string, field: string, filePath: string): number {
	if (!TIME_PATTERN.test(value)) {
		fail(filePath, field, 'must be a valid 24-hour HH:mm value');
	}
	return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

function validateTimezone(value: string, filePath: string): void {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
	} catch {
		fail(filePath, 'timezone', 'must be a valid IANA timezone');
	}
}

function httpsUrl(value: string, field: string, filePath: string): URL {
	if (/\s/u.test(value)) {
		fail(filePath, field, 'must be an absolute HTTPS URL');
	}

	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		fail(filePath, field, 'must be an absolute HTTPS URL');
	}

	if (parsed.protocol !== 'https:' || parsed.hostname.length === 0) {
		fail(filePath, field, 'must be an absolute HTTPS URL');
	}
	return parsed;
}

function validateMapUrl(value: string, filePath: string): void {
	if (!GOOGLE_MAP_URL_PATTERN.test(value)) {
		fail(
			filePath,
			'mapEmbedUrl',
			'must use a lowercase HTTPS Google Maps URL with https://www.google.com/maps/ or https://maps.google.com/'
		);
	}

	const parsed = httpsUrl(value, 'mapEmbedUrl', filePath);
	const isAllowedOrigin = parsed.port === '' && parsed.username === '' && parsed.password === '';
	const isGoogleMapsPath =
		isAllowedOrigin && parsed.hostname === 'www.google.com' && parsed.pathname.startsWith('/maps/');
	const isGoogleMapsHost =
		isAllowedOrigin && parsed.hostname === 'maps.google.com' && parsed.pathname.startsWith('/');

	if (!isGoogleMapsPath && !isGoogleMapsHost) {
		fail(
			filePath,
			'mapEmbedUrl',
			'must use a lowercase HTTPS Google Maps URL with https://www.google.com/maps/ or https://maps.google.com/'
		);
	}
}

function normalizedOptionalFields(
	record: RawFrontMatter,
	filePath: string
): Pick<
	EventFrontMatter,
	| 'startTime'
	| 'endTime'
	| 'timezone'
	| 'discordEventId'
	| 'signupUrl'
	| 'imageUrl'
	| 'imageAlt'
	| 'mapEmbedUrl'
	| 'mapTitle'
> {
	const startTime = optionalString(record, 'startTime', filePath);
	const endTime = optionalString(record, 'endTime', filePath);
	const timezone = optionalString(record, 'timezone', filePath, true);
	const discordEventId = optionalString(record, 'discordEventId', filePath);
	const signupUrl = optionalString(record, 'signupUrl', filePath);
	const imageUrl = optionalString(record, 'imageUrl', filePath);
	const imageAlt = optionalString(record, 'imageAlt', filePath, true);
	const mapEmbedUrl = optionalString(record, 'mapEmbedUrl', filePath);
	const mapTitle = optionalString(record, 'mapTitle', filePath, true);

	if (signupUrl !== undefined) httpsUrl(signupUrl, 'signupUrl', filePath);
	if (imageUrl !== undefined) httpsUrl(imageUrl, 'imageUrl', filePath);
	if (mapEmbedUrl !== undefined) validateMapUrl(mapEmbedUrl, filePath);

	return {
		...(startTime === undefined ? {} : { startTime }),
		...(endTime === undefined ? {} : { endTime }),
		...(timezone === undefined ? {} : { timezone }),
		...(discordEventId === undefined ? {} : { discordEventId }),
		...(signupUrl === undefined ? {} : { signupUrl }),
		...(imageUrl === undefined ? {} : { imageUrl }),
		...(imageAlt === undefined ? {} : { imageAlt }),
		...(mapEmbedUrl === undefined ? {} : { mapEmbedUrl }),
		...(mapTitle === undefined ? {} : { mapTitle })
	};
}

export function validateEventFrontMatter(
	raw: unknown,
	serverIds: readonly string[],
	filePath: string
): EventFrontMatter {
	if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
		fail(filePath, 'metadata', 'must be an object');
	}
	const record = raw as RawFrontMatter;

	for (const field of Object.keys(record)) {
		if (!Object.prototype.hasOwnProperty.call(ALLOWED_FIELDS, field)) {
			fail(filePath, field, 'is not a recognized front-matter field');
		}
	}

	for (const field of REQUIRED_FIELDS) {
		if (!hasOwn(record, field)) fail(filePath, field, 'is required');
	}

	if (record.schemaVersion !== 1) {
		fail(filePath, 'schemaVersion', 'must be the integer 1');
	}

	const title = requiredString(record, 'title', filePath);
	const startDate = requiredString(record, 'startDate', filePath);
	const endDate = requiredString(record, 'endDate', filePath);
	const city = requiredString(record, 'city', filePath);
	const country = requiredString(record, 'country', filePath);
	const hostServerId = requiredString(record, 'hostServerId', filePath);
	const statusValue = requiredString(record, 'status', filePath);

	calendarDate(startDate, 'startDate', filePath);
	calendarDate(endDate, 'endDate', filePath);
	if (endDate < startDate) {
		fail(filePath, 'endDate', 'must be on or after startDate');
	}

	if (!serverIds.includes(hostServerId)) {
		fail(filePath, 'hostServerId', `must match a known server ID`);
	}

	if (!EVENT_STATUSES.includes(statusValue as EventStatus)) {
		fail(filePath, 'status', 'must be one of the supported event statuses');
	}

	const optional = normalizedOptionalFields(record, filePath);
	const hasAnyTime = TIME_FIELDS.some((field) => hasOwn(record, field));
	if (hasAnyTime) {
		for (const field of TIME_FIELDS) {
			if (!hasOwn(record, field)) fail(filePath, field, 'is required when event times are provided');
		}

		const startTime = optional.startTime;
		const endTime = optional.endTime;
		const timezone = optional.timezone;
		if (startTime === undefined) fail(filePath, 'startTime', 'is required when event times are provided');
		if (endTime === undefined) fail(filePath, 'endTime', 'is required when event times are provided');
		if (timezone === undefined) fail(filePath, 'timezone', 'is required when event times are provided');

		const startMinutes = clockMinutes(startTime, 'startTime', filePath);
		const endMinutes = clockMinutes(endTime, 'endTime', filePath);
		validateTimezone(timezone, filePath);
		if (startDate === endDate && endMinutes < startMinutes) {
			fail(filePath, 'endDate', 'must be later than startDate for an overnight event');
		}
		if (startDate === endDate && endMinutes === startMinutes) {
			fail(filePath, 'endTime', 'must be later than startTime for a same-day event');
		}
	}

	if (optional.imageUrl !== undefined && optional.imageAlt === undefined) {
		fail(filePath, 'imageAlt', 'is required when imageUrl is provided');
	}

	return {
		schemaVersion: 1,
		title,
		startDate,
		endDate,
		...optional,
		city,
		country,
		hostServerId,
		status: statusValue as EventStatus
	};
}
