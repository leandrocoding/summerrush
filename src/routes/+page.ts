import type { PageLoad } from './$types';

import { events, servers, site } from '$lib/content/load-events';

export const load: PageLoad = ({ data }) => {
	// Spread the server data so `buildToday` is preserved as-is without recomputing it.
	return {
		...data,
		site,
		servers,
		events
	};
};
