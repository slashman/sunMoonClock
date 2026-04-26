# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running

No build system, no package manager, no tests. Everything in `src/` is served as static files.

To preview locally, serve `src/` over HTTP (image/mask URLs require it — `file://` will not work reliably):

```
python3 -m http.server --directory src 8000
# then open http://localhost:8000/
```

`src/index.html` loads `smc.js` and calls `smc.init('clockAnchor')` against an empty `<div>`.

## Architecture

The whole clock is driven by a single global `window.smc` object in `src/smc.js`. `init()` builds the DOM imperatively (no framework, no templates) by appending `<img>`/`<div>` children to the anchor element and assigning CSS classes from `smc.css`. There is no module system — `smc.js` is a plain script that mutates `window`.

### Three independent timers

`init()` starts three `setInterval` loops, each driving a different visual concern:

- `secondsTick` (1 Hz) — repositions sun/moon, recomputes sky color, swaps background tile, updates star opacity.
- `minstrelFrameTick` (4 Hz) — advances the minstrel sprite animation by shifting `background-position-x` across `minstrel_play.png` (5 frames of 96px).
- `frameTick` (24 Hz) — animates the drifting cloud's `left`/`top`, recycling it to the right edge with a randomized Y when it leaves the left edge.

Each tick reads `new Date()` directly, so there is no shared time/state object — changing the time source means editing `getCurrentHourOfDay` / `getCurrentMinuteOfTheHourOfDay`. The commented `new Date().getSeconds() % 24` line in `getCurrentHourOfDay` is the standard fast-forward toggle for visual debugging.

### Coordinate system and tile layout

Geometry constants at the top of `smc.js` are tightly coupled to the image assets and CSS:

- Container is 384×288 (set in `.smc_container`); the visible scene sits inside a frame whose top-left corner is at `(frameOffsetX=48, frameOffsetY=84)`.
- Sun and moon orbit a circle of `radius = 288/2 = 144` centered on the frame, 180° apart. Angle 0 sits at the right; `sunAngle = 1.5π - hours * (2π/24)` puts noon at the top.
- `backgrounds.png` is a horizontal strip of 18 tiles, each 288px wide; `updateLandscape` selects one with `currentHour % 18`.
- `mask.png` is applied via CSS `mask-image` on the container to give the rectangle its final silhouette — changing container dimensions requires regenerating the mask.

If you change any of these numbers, audit both `smc.js` and `smc.css` together — they encode the same layout twice.

### Sky color model

`skyColor` blends `SUNLIGHT` and `MOONLIGHT` against `EARTH.atmosphereDiffraction` weighted by `getSunStrength(hourOfDay)`. `getSunStrength` is a fitted curve (not a simple sine) that takes an `HHMM` integer (e.g. `1430`), mirrored around noon. `updateSkyColor` constructs that integer from `floor(hour)*100 + minute` before calling in — preserve that format if you refactor.

### Known TODOs in code

- `updateLandscape`: background selection is `hour % 18` and is flagged for improvement (the 18 tiles are not a 1:1 mapping to hours).
- `updateStars`: opacity is stepped (0 / 0.5 / 1); the comment notes the intent to lerp across 7–8am and 6–7pm.

## Assets and attribution

Tilesets (`backgrounds.png`, `minstrel_play.png`, etc.) are derived from Denzi's CC-BY-SA "Sun and Moon" and "bard" sets — see `README.md` for source URLs. Preserve attribution when modifying or replacing assets.
