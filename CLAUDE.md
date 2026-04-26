# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Each subproject has its own CLAUDE.md with its commands and internals — those auto-load when you touch files in that directory:

- `web/CLAUDE.md` — clock internals (timer loops, coordinate system, sky color model)
- `renderer/CLAUDE.md` — Node/Playwright screenshot server
- `proxy/CLAUDE.md` — PHP cache/proxy
- `android/CLAUDE.md` — Kotlin AppWidget

This root file covers only what spans multiple subprojects.

## Repository layout

Five sibling projects, one data flow:

```
web/  →  renderer/  →  proxy/  →  android/, ios/
clock     Node/Playwright   PHP cache at      home-screen
source    screenshot server /time/current     widgets
```

The split exists because the widgets must not hit the renderer directly: the proxy collapses many widget requests into at most one upstream fetch per minute and shields the renderer from public traffic. `ios/` is a placeholder, not implemented.

## Per-minute caching invariant (cross-cutting)

Three layers each independently rate-limit to one render per calendar minute, all using the same `floor(mtime / 60_000) === floor(now / 60_000)` check. If you change the cadence, change it in all three places that enforce it:

- `renderer/server.js` `isFreshForCurrentMinute()` — re-renders the PNG at most once per wall-clock minute, with an `inflight` promise to coalesce concurrent `/current` requests.
- `proxy/index.php` `fresh_for_current_minute()` — same logic on disk; on upstream failure, falls through to serving the stale cache rather than 5xx-ing.
- `Cache-Control: public, max-age=60` is set by both renderer and proxy.

## Playwright/Docker version pin (cross-cutting)

`renderer/package.json` pins Playwright to an exact version, and `renderer/Dockerfile` uses the matching `mcr.microsoft.com/playwright:v<version>-noble` base image. Bumping one requires bumping the other — mismatched versions break the Docker build.

## Conventions

- Tab indentation across the whole repo (Kotlin, JS, PHP, HTML, CSS). Match the surrounding file.
- Asset attribution: tilesets derive from Denzi's CC-BY-SA "Sun and Moon" / "bard" sets (see `web/README.md`). Preserve attribution when modifying assets.
