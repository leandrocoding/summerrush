import type { EventRecord, Site } from './catalog';
import { formatDateRange } from './event-utils';

export type EventDetailMeta = {
	title: string;
	description: string;
};

export type OptionalSections = {
	signup: boolean;
	image: boolean;
	hasMarkdownBody: boolean;
	map: boolean;
};

export function eventEntries(events: readonly EventRecord[]): string[] {
	return events.map((event) => event.id);
}

export function findEvent(
	events: readonly EventRecord[],
	id: string
): EventRecord | undefined {
	return events.find((event) => event.id === id);
}

export function detailMeta(event: EventRecord, site: Site): EventDetailMeta {
	return {
		title: `${event.title} | ${site.title}`,
		description: `${event.title} in ${event.city}, ${event.country} on ${formatDateRange(
			event.startDate,
			event.endDate
		)}.`
	};
}

export function optionalSections(event: EventRecord): OptionalSections {
	return {
		signup: Boolean(event.signupUrl),
		image: Boolean(event.imageUrl),
		hasMarkdownBody: event.hasMarkdownBody,
		map: Boolean(event.mapEmbedUrl)
	};
}

export function browserToday(now: Date = new Date(), timeZone?: string): string {
	return new Intl.DateTimeFormat('sv-SE', timeZone ? { timeZone } : undefined).format(now);
}
