# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Single-file PHP reverse-proxy + per-minute disk cache. Drop `index.php` onto the same shared host that serves `web/`; the directory's public URL becomes the endpoint the widgets hit.

## Deploy

No build, no dependencies beyond curl. Edit the `UPSTREAM_URL` constant at the top of `index.php` and upload. Currently points at `https://smc-renderer.onrender.com/current`.

## Internals

- Per-tz cache files in `cache/` next to the script, written via `write_atomic` (write to `.tmp.<pid>` then rename). The directory is created on first request.
- Reads `?tz=` from the request, validates it against the same regex the renderer uses, and forwards it to the upstream as `?tz=<urlencoded>`. Missing `tz` falls back to `UTC` for backward compat with widgets that predate the per-tz protocol.
- On upstream failure, falls through to serving the stale per-tz cache rather than 5xx-ing. Only returns 503 when no cache file for that tz exists at all (so a brand-new tz on a dead renderer 503s, but a familiar tz keeps serving stale).
- `TIMEOUT_SECONDS = 8`, `CONNECT_TIMEOUT_S = 4` — tuned so the widget's own ~12s read timeout still has headroom if this layer has to wait on the renderer cold-starting.

The per-minute, per-tz caching invariant is the same one enforced by the renderer; see the root `CLAUDE.md`.
