# Event Markdown

Create one Markdown file per event using the event ID as the filename:

```text
src/lib/events/utrecht-2026-05-25.md
src/lib/events/brno-2026-05-30.md
```

The event detail page automatically renders the matching file at `/events/<event-id>`.

## Example Content

```md
# Event Details

We will meet near the main station before starting the game.

![Meeting point map](/events/utrecht-map.jpg)

## Schedule

- 10:00 meetup
- 10:30 rules briefing
- 11:00 game start

## Links

- [Signup](https://example.com)
- [Rules](https://example.com/rules)
```

Put embedded images in `static/events/`, then reference them with `/events/<filename>`.

## Map Embeds

Add a Google Maps embed to an event in `src/lib/data/summer-rush.json`:

```json
{
	"mapEmbedUrl": "https://www.google.com/maps/d/u/1/embed?mid=...",
	"mapTitle": "Brno game map"
}
```

The map appears at the bottom of the event detail page.
