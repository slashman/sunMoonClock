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

## Per-minute, per-timezone caching invariant (cross-cutting)

The clock must reflect the *user's* local time, not the renderer host's tz. Widgets pass their IANA timezone as `?tz=` (e.g. `?tz=America/New_York`); proxy and renderer both key their caches by tz. No-tz requests fall back to `UTC` so older clients keep working.

Three layers each independently rate-limit to one render per calendar minute *per tz*, all using the same `floor(mtime / 60_000) === floor(now / 60_000)` check. If you change the cadence or the tz wire format, change it in all three places that enforce it:

- `renderer/server.js` `isFreshForCurrentMinute()` — re-renders at most once per wall-clock minute per tz, with a per-tz `inflight` map to coalesce concurrent `/current` requests for the same tz.
- `proxy/index.php` `fresh_for_current_minute()` — same logic on disk; on upstream failure, falls through to serving the stale per-tz cache rather than 5xx-ing.
- `Cache-Control: public, max-age=60` is set by both renderer and proxy.

Both layers validate the `tz` param against the same regex (`^[A-Za-z][A-Za-z0-9+_-]*(/[A-Za-z0-9+_-]+)*$`) before letting it touch a filename or Playwright, and store the per-tz file as `<tz with / replaced by ~>.png` (so `America/New_York` → `America~New_York.png`).

## Playwright/Docker version pin (cross-cutting)

`renderer/package.json` pins Playwright to an exact version, and `renderer/Dockerfile` uses the matching `mcr.microsoft.com/playwright:v<version>-noble` base image. Bumping one requires bumping the other — mismatched versions break the Docker build.

## Conventions

- Tab indentation across the whole repo (Kotlin, JS, PHP, HTML, CSS). Match the surrounding file.
- Asset attribution: tilesets derive from Denzi's CC-BY-SA "Sun and Moon" / "bard" sets (see `web/README.md`). Preserve attribution when modifying assets.
