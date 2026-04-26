# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Node ESM HTTP server that runs Playwright/Chromium and screenshots the `web/` clock to a transparent PNG. Deployed as a Docker service (Render).

## Commands

```
npm install                                                          # local dev; in prod the Docker base image provides Chromium
SMC_URL=http://localhost:8000 npm start                              # HTTP server on :3000
curl -o out.png 'http://localhost:3000/current?tz=America/New_York'  # request a tz-specific render
SMC_URL=http://localhost:8000 SMC_TZ=Asia/Tokyo npm run render -- out.png   # one-shot CLI render
```

Env: `PORT` (default 3000), `SMC_URL` (default `http://localhost:8000`), `SMC_CACHE_DIR` (default `cache`). `SMC_TZ` is only used by the CLI in `render.js`; the server reads tz per-request from `?tz=`.

## Internals

- ESM (`"type": "module"` in `package.json`) — use `import`, not `require`.
- A single Chromium instance is kept alive across requests via `browserPromise` in `render.js`. Never call `chromium.launch()` per request. Each render uses a fresh `BrowserContext` (closed in `finally`) — `timezoneId` is a context-level option in Playwright, so this is also how the per-tz `new Date()` behavior is achieved. Don't try to share a context across renders to save the context-creation cost; you'd lose tz isolation.
- `server.js` keeps a `Map<tz, Promise>` so concurrent `/current?tz=X` requests share one render, while requests for different tzs render in parallel.
- The screenshot waits for `#clockAnchor` to exist and all its `<img>` children to be `complete && naturalWidth > 0` before capturing — otherwise tiles can render half-loaded.
- Render's free tier has an ephemeral filesystem; the cache dir gets recreated on cold start, which means the first request per tz after a cold start takes a full render. This is fine — the per-minute cache amortizes everything after.

The per-minute, per-tz caching invariant and the Playwright/Docker version-pin rule are cross-cutting and live in the root `CLAUDE.md`.
