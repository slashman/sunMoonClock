# sunMoonClock

A visual clock showing the sun and moon across the sky, in five flavors. Live web demo: https://slashie.net/time

This repository holds five sibling projects. The data flow:

```
web/  →  renderer/  →  proxy/  →  ios/, android/
clock    Node screenshot   PHP cache at      home-screen
source   server (private)  /time/current     widgets
```

## [`web/`](./web) — the original web-embeddable clock

Vanilla HTML/JS/CSS, no build step. Renders the live animated clock and is the canonical implementation. Deploy as static files behind any web server.

## [`renderer/`](./renderer) — Node.js screenshot server

Playwright-backed HTTP server. `GET /current` returns a transparent PNG of the clock, lazily re-rendering at most once per calendar minute. Runs privately; not exposed directly to widgets. Configure the upstream clock URL via `SMC_URL`.

## [`proxy/`](./proxy) — PHP reverse-proxy + cache

Single `index.php` you drop onto the same shared host that serves the web clock. Fetches from the renderer once per minute, caches to disk, and serves stale cache on upstream failure. This is the public URL the widgets hit; configure the upstream renderer URL at the top of the file.

## [`ios/`](./ios) — iOS home-screen widget (planned)

Fetches the proxy URL and displays it.

## [`android/`](./android) — Android home-screen widget (planned)

Fetches the proxy URL and displays it.

## Credits

Tilesets derive from Denzi's CC-BY-SA "Sun and Moon" and "bard" sets — see [`web/README.md`](./web/README.md) for sources and attribution.
