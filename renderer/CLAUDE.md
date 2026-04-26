# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Node ESM HTTP server that runs Playwright/Chromium and screenshots the `web/` clock to a transparent PNG. Deployed as a Docker service (Render).

## Commands

```
npm install                                                # local dev; in prod the Docker base image provides Chromium
SMC_URL=http://localhost:8000 npm start                    # HTTP server on :3000, GET /current
SMC_URL=http://localhost:8000 npm run render -- out.png    # one-shot screenshot to file
```

Env: `PORT` (default 3000), `SMC_URL` (default `http://localhost:8000`), `SMC_OUTPUT` (default `current.png`).

## Internals

- ESM (`"type": "module"` in `package.json`) — use `import`, not `require`.
- A single Chromium instance is kept alive across requests via `browserPromise` in `render.js`. Never call `chromium.launch()` per request.
- `server.js` coalesces concurrent `/current` requests through an `inflight` promise so only one render runs at a time.
- The screenshot waits for `#clockAnchor` to exist and all its `<img>` children to be `complete && naturalWidth > 0` before capturing — otherwise tiles can render half-loaded.

The per-minute freshness check and the Playwright/Docker version-pin rule are cross-cutting and live in the root `CLAUDE.md`.
