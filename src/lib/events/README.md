# Event Markdown

Create one Markdown file per event using the event ID as the filename:

```text
src/lib/events/utrecht-2026-05-25.md
src/lib/events/brno-2026-05-30.md
```

The event detail page automatically renders the matching file at `/events/<event-id>`.

## Example Content

```md
![Zürich Panorama](zh-panorama.jpg)

Join us on Saturday, June 27, 2026 for a Hide + Seek game across Zürich and the surrounding canton. The game uses the dense ZVV public transport network, so expect quick connections, tactical station choices, and plenty of chances to move between urban, lakeside, and hillside areas.

### Getting There

* **Meeting point:** We will meet at Zürich Hauptbahnhof (HB), the city's main station and the best-connected point for local and long-distance arrivals.
* **Flights:** Zürich Airport (ZRH) is about 10 minutes from the city center by train. EuroAirport Basel-Mulhouse-Freiburg (BSL) can also work as a budget option, with onward rail connections to Zürich.
* **Trains:** Zürich HB has direct international and intercity connections, including ICE, TGV, Railjet, and frequent Swiss long-distance trains.
* **Transit tickets:** The game runs on the ZVV network. Depending on when you arrive and how long you stay, consider a ZVV 9 Uhr Pass, a 24-hour ZVV ticket, or a Swiss day pass.

### Game Info & Map

* **Format:** Standard Hide + Seek rules with a medium metric setup.
* **Playable area:** The map covers train stations inside the canton Zürich.
* **Hiding radius:** 500 m around the chosen station.
* **Map:** Checkout the embedded map below, or open the full version [here](https://www.google.com/maps/d/u/1/edit?mid=12jDeazKnODw0iv2N9h6sh5StSKgUgYA&usp=sharing).

### About Zürich

Zürich is compact, walkable, and very transit-heavy, which makes it a strong setting for Hide + Seek. The city mixes dense central stations with quieter suburbs, lakefront routes, and elevated viewpoints, so both seekers and hiders should have interesting strategic options.

You do not need to rely on bottled water during the day: Zürich has many public fountains with clean drinking water. Bring a bottle, comfortable shoes, and enough phone battery for navigation, communication, and checking connections.
```

Put embedded images in `static/events/`, then reference them with `/events/<filename>`.

## Map Embeds

Add a Google Maps embed to an event in `src/lib/data/summer-rush.json`:

```json
{
	"mapEmbedUrl": "https://www.google.com/maps/d/u/1/embed?mid=...",
	"mapTitle": "Game map"
}
```

The map appears at the bottom of the event detail page.
