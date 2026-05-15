import { error } from '@sveltejs/kit';
import summerRush from '$lib/data/summer-rush.json';

type SummerRushEvent = (typeof summerRush.events)[number];
type Server = (typeof summerRush.servers)[number];

export type RichEventLink = {
	label: string;
	url: string;
};

export type RichEvent = SummerRushEvent & {
	image?: string;
	imageAlt?: string;
	mapEmbedUrl?: string;
	mapTitle?: string;
	description?: string;
	details?: string[];
	links?: RichEventLink[];
};

function eventUrlFor(event: SummerRushEvent, organizer: Server | undefined) {
	if (event.eventLinkOverride) return event.eventLinkOverride;
	if (!event.eventId || !organizer?.invite) return '';

	const url = new URL(organizer.invite);
	url.searchParams.set('event', event.eventId);
	return url.toString();
}

export function load({ params }) {
	const event = summerRush.events.find((item) => item.id === params.id) as RichEvent | undefined;

	if (!event) {
		error(404, 'Event not found');
	}

	const organizer = summerRush.servers.find((server) => server.id === event.hostServerId);

	return {
		event,
		eventUrl: eventUrlFor(event, organizer),
		organizer,
		site: summerRush.site
	};
}
