# sunMoonClock

A visual clock showing the sun and moon across the sky, in four flavors. Live web demo: https://slashie.net/time

This repository holds four sibling projects:

## [`web/`](./web) — the original web-embeddable clock

Vanilla HTML/JS/CSS, no build step. Renders the live animated clock and is the canonical implementation. Deploy as static files behind any web server.

## [`renderer/`](./renderer) — Node.js screenshot server

Playwright-backed HTTP server. `GET /current` returns a transparent PNG of the clock, lazily re-rendering at most once per calendar minute. Configure the upstream clock URL via `SMC_URL`.

## [`ios/`](./ios) — iOS home-screen widget (planned)

Fetches the renderer URL and displays it.

## [`android/`](./android) — Android home-screen widget (planned)

Fetches the renderer URL and displays it.

## Credits

Tilesets derive from Denzi's CC-BY-SA "Sun and Moon" and "bard" sets — see [`web/README.md`](./web/README.md) for sources and attribution.
