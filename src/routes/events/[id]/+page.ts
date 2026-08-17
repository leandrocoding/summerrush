import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

import { eventContent, events, site } from '$lib/content/load-events';
import { eventEntries, findEvent } from '$lib/content/page-data';

export const entries: EntryGenerator = () => eventEntries(events).map((id) => ({ id }));

export const load: PageLoad = ({ params }) => {
	const event = findEvent(events, params.id);

	if (!event) {
		error(404, 'Event not found');
	}

	return {
		event,
		server: event.server,
		site,
		content: eventContent[event.id]
	};
};
