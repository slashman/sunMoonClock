# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Single-file PHP reverse-proxy + per-minute disk cache. Drop `index.php` onto the same shared host that serves `web/`; the directory's public URL becomes the endpoint the widgets hit.

## Deploy

No build, no dependencies beyond curl. Edit the `UPSTREAM_URL` constant at the top of `index.php` and upload. Currently points at `https://smc-renderer.onrender.com/current`.

## Internals

- Caches to `current.png` next to the script via `write_atomic` (write to `.tmp.<pid>` then rename).
- On upstream failure, falls through to serving the stale cache rather than 5xx-ing. Only returns 503 when no cache file exists at all.
- `TIMEOUT_SECONDS = 8`, `CONNECT_TIMEOUT_S = 4` — tuned so the widget's own ~12s read timeout still has headroom if this layer has to wait on the renderer cold-starting.

The per-minute freshness check is the same invariant enforced by the renderer; see the root `CLAUDE.md`.
