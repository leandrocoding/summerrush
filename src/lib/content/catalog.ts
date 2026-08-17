import type { Component } from 'svelte';

import { deriveSignupUrl, isPastEvent, sortArchive, sortUpcoming } from './event-utils';
import type { EventFrontMatter } from './validation';
import { validateEventFrontMatter } from './validation';

export type Server = {
	id: string;
	name: string;
	region: string;
	icon: string;
	invite?: string;
};

export type Site = {
	title: string;
	tagline: string;
	description: string;
	primaryAction: { label: string };
	secondaryAction: { label: string };
	notes: string[];
};

export type EventModule = {
	metadata: unknown;
	component: Component;
	rawSource: string;
};

export type EventRecord = EventFrontMatter & {
	id: string;
	filePath: string;
	signupUrl: string;
	server: Server;
	hasMarkdownBody: boolean;
};

export type EventPartition = {
	upcoming: EventRecord[];
	archive: EventRecord[];
};

export type Catalog = {
	site: Site;
	servers: Server[];
	events: EventRecord[];
	eventContent: Record<string, Component>;
};

const EVENT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function eventIdFromPath(filePath: string): string {
	const normalized = filePath.replace(/\\/g, '/');
	const last = normalized.split('/').pop() ?? '';
	const dot = last.lastIndexOf('.');
	return dot === -1 ? last : last.slice(0, dot);
}

function bodyAfterFrontMatter(source: string): string {
	const lines = source.split(/\r\n|\n|\r/u);

	if (lines[0] !== '---') {
		return source;
	}

	for (let i = 1; i < lines.length; i += 1) {
		if (lines[i] === '---') {
			return lines.slice(i + 1).join('\n');
		}
	}

	return source;
}

function hasMarkdownBody(source: string): boolean {
	return bodyAfterFrontMatter(source).trim().length > 0;
}

export function buildCatalog(
	modules: Readonly<Record<string, EventModule>>,
	servers: readonly Server[],
	site: Site,
	filePaths: readonly string[] = Object.keys(modules)
): Catalog {
	const serverById = new Map(servers.map((server) => [server.id, server]));
	const serverIds = servers.map((server) => server.id);

	const events: EventRecord[] = [];
	const eventContent: Record<string, Component> = {};
	const seenIds = new Set<string>();

	for (const filePath of filePaths) {
		const module = modules[filePath];
		if (!module) continue;

		const id = eventIdFromPath(filePath);
		if (!EVENT_ID_PATTERN.test(id)) {
			throw new Error(
				`${filePath}: invalid event id "${id}" (must match ${EVENT_ID_PATTERN.source})`
			);
		}
		if (seenIds.has(id)) {
			throw new Error(`${filePath}: duplicate event id "${id}"`);
		}
		seenIds.add(id);

		const metadata = validateEventFrontMatter(module.metadata, serverIds, filePath);
		const server = serverById.get(metadata.hostServerId);
		if (!server) {
			throw new Error(
				`${filePath}: hostServerId "${metadata.hostServerId}" has no matching server record`
			);
		}

		events.push({
			...metadata,
			id,
			filePath,
			signupUrl: deriveSignupUrl(metadata, server),
			server,
			hasMarkdownBody: hasMarkdownBody(module.rawSource)
		});
		eventContent[id] = module.component;
	}

	return {
		site,
		servers: [...servers],
		events,
		eventContent
	};
}

export function partitionEvents(
	events: readonly EventRecord[],
	today: string
): EventPartition {
	const upcoming: EventRecord[] = [];
	const archive: EventRecord[] = [];

	for (const event of events) {
		(isPastEvent(event, today) ? archive : upcoming).push(event);
	}

	return {
		upcoming: sortUpcoming(upcoming),
		archive: sortArchive(archive)
	};
}
