import type { PageServerLoad } from './$types';

// Computed once at module load, which for the static adapter happens during the
// single prerender pass. It stays frozen for the life of the generated page.
const buildToday = new Date().toISOString().slice(0, 10);

export const load: PageServerLoad = () => {
	return { buildToday };
};
