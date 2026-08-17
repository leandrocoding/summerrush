import type { Component } from 'svelte';

import { buildCatalog, partitionEvents, type EventModule } from './catalog';
import serversData from './servers.json';
import siteData from './site.json';

const compiledModules = import.meta.glob('./events/*.md', { eager: true }) as Record<
	string,
	{ default: Component; metadata: unknown }
>;

const rawModules = import.meta.glob('./events/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

function normalizePath(path: string): string {
	return path.split('?')[0].replace(/\\/g, '/');
}

const rawByPath = new Map<string, string>();
for (const [path, source] of Object.entries(rawModules)) {
	rawByPath.set(normalizePath(path), source);
}

const modules: Record<string, EventModule> = {};
for (const [path, compiled] of Object.entries(compiledModules)) {
	const normalized = normalizePath(path);
	modules[normalized] = {
		metadata: compiled.metadata,
		component: compiled.default,
		rawSource: rawByPath.get(normalized) ?? ''
	};
}

const filePaths = Object.keys(modules).sort();

const catalog = buildCatalog(modules, serversData, siteData, filePaths);

export const site = catalog.site;
export const servers = catalog.servers;
export const events = catalog.events;
export const eventContent = catalog.eventContent;
export { partitionEvents };
