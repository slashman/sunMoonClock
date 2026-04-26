# sunMoonClock

A visual clock showing the sun and moon across the sky, in four flavors. Live web demo: https://slashie.net/time

This repository holds four sibling projects:

## [`web/`](./web) — the original web-embeddable clock

Vanilla HTML/JS/CSS, no build step. Renders the live animated clock and is the canonical implementation. Embedded at https://slashie.net/time and screenshotted by `renderer/` for use by the mobile widgets.

## [`renderer/`](./renderer) — Node.js screenshot generator (planned)

Cron'd Node script that uses Playwright (or similar) to capture https://slashie.net/time and publish the result at https://slashie.net/time/current as a PNG. Source of truth for the image both mobile widgets fetch.

## [`ios/`](./ios) — iOS home-screen widget (planned)

Fetches https://slashie.net/time/current and displays it.

## [`android/`](./android) — Android home-screen widget (planned)

Fetches https://slashie.net/time/current and displays it.

## Credits

Tilesets derive from Denzi's CC-BY-SA "Sun and Moon" and "bard" sets — see [`web/README.md`](./web/README.md) for sources and attribution.
