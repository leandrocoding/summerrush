import type { EventFrontMatter, EventStatus } from './validation';

export type SortableEvent = Pick<EventFrontMatter, 'startDate' | 'endDate' | 'title'>;

export type SignupLinkEvent = Pick<EventFrontMatter, 'signupUrl' | 'discordEventId'>;

export type SignupLinkServer = { invite?: string };

const EN_DASH = '\u2013';

function compareAscending(left: string, right: string): number {
	if (left < right) return -1;
	if (left > right) return 1;
	return 0;
}

export function isPastEvent(event: Pick<EventFrontMatter, 'endDate'>, today: string): boolean {
	return event.endDate < today;
}

export function sortUpcoming<T extends SortableEvent>(events: readonly T[]): T[] {
	return [...events].sort(
		(a, b) =>
			compareAscending(a.startDate, b.startDate) || compareAscending(a.title, b.title)
	);
}

export function sortArchive<T extends SortableEvent>(events: readonly T[]): T[] {
	return [...events].sort(
		(a, b) =>
			compareAscending(b.endDate, a.endDate) ||
			compareAscending(b.startDate, a.startDate) ||
			compareAscending(a.title, b.title)
	);
}

const STATUS_LABELS: Record<EventStatus, string> = {
	planning: 'Planning',
	confirmed: 'Confirmed',
	'signup-open': 'Signup Open',
	full: 'Full',
	waitlist: 'Full / Wait list',
	cancelled: 'Cancelled'
};

export function statusLabel(status: EventStatus): string {
	return STATUS_LABELS[status];
}

function formatDay(date: string): string {
	const [year, month, day] = date.split('-');
	return `${day}.${month}.${year}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
	if (startDate === endDate) {
		return formatDay(startDate);
	}

	return `${formatDay(startDate)} ${EN_DASH} ${formatDay(endDate)}`;
}

export function deriveSignupUrl(
	event: SignupLinkEvent,
	server: SignupLinkServer | undefined
): string {
	if (event.signupUrl) {
		return event.signupUrl;
	}

	if (event.discordEventId && server?.invite) {
		const url = new URL(server.invite);
		url.searchParams.set('event', event.discordEventId);
		return url.toString();
	}

	return '';
}
