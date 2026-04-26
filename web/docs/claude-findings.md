# Claude Findings

Observations from a code review of `src/smc.js` and `src/smc.css`. Each item is something that could be improved.

## Background tile selection is `hour % 18`

`updateLandscape` (`src/smc.js`) picks one of 18 tiles in `backgrounds.png` with `currentHour % 18`. The code already carries a `// TODO: Improve background selection` comment. Hours 0–17 map 1:1 to tiles and hours 18–23 wrap back to tiles 0–5, which means the late-evening hours reuse early-morning artwork. A deliberate hour→tile table (or a curve that picks tiles based on `getSunStrength`) would make the landscape match the sky.

## Star opacity is stepped, not interpolated

`updateStars` switches between opacity `0`, `0.5`, and `1` at hard hour boundaries (8/18 and 7/19). The in-code comment `// TODO: Lerp opacity from 7 to 8 am and 6 to 7pm` already flags this. A linear interpolation across those windows (or reusing `getSunStrength` / `1 - getSunStrength`) would remove the visible pop at the boundaries.

## Layout constants are duplicated between JS and CSS

The scene geometry is encoded twice: as numeric constants at the top of `smc.js` (`radius`, `frameOffsetX/Y`, `backgroundsTileWidth`, `minstrelTileWidth`) and again as literal pixel values in `smc.css` (container 384×288, backgrounds 288×192 at `top: 48px; left: 48px`, minstrel 96×144 at `top: 81px; left: 144px`, etc.). Changing any dimension requires editing both files in lockstep, and `mask.png` has to be regenerated to match. Candidates for fixing this: drive the layout from CSS custom properties read in JS, or compute the CSS positions from the same constants at init time.

## Three uncoordinated `setInterval` timers

`init()` starts three independent `setInterval` loops (1 Hz, 4 Hz, 24 Hz). They each call `new Date()` and mutate the DOM directly, with no shared frame/time object. Two practical issues:

- The 24 Hz cloud timer keeps firing even when the tab is backgrounded (browsers throttle but don't stop `setInterval`), and on resume the cloud snaps rather than catching up smoothly.
- There is no teardown — `init()` can only be called once, and the intervals leak if the anchor element is removed.

A single `requestAnimationFrame` loop that reads the clock once per frame and dispatches to the per-concern updaters would address both, and would also make the "fast-forward for testing" toggle a one-line change instead of editing `getCurrentHourOfDay`.

## Time source is hardcoded to `new Date()`

`getCurrentHourOfDay` and `getCurrentMinuteOfTheHourOfDay` both read `new Date()` directly, and the testing override is a commented-out line inside `getCurrentHourOfDay`. Injecting a time provider (function passed to `init`, or a property on `smc`) would make it possible to (a) demo the clock at accelerated speed without editing source, (b) drive it from a specific timezone instead of the viewer's local time, and (c) write tests against the visual functions.

## `smc` is a global singleton with no teardown

`window.smc` holds DOM references and timer handles on itself, so `init` is effectively single-instance and there is no `destroy`. Embedding two clocks on one page, or unmounting the clock cleanly, both require refactoring `smc` into a constructor/factory that returns a per-instance object and exposes a teardown that clears the intervals.

## `getSunStrength` clamps with `HHMM` integer arithmetic

`getSunStrength` takes an `HHMM`-style integer (e.g. `1430`), clamps it to `[0, 2359]`, and mirrors around `1200` with `2400 - hour`. This is fine but surprising — the function silently treats `:60`–`:99` as valid inputs because it never decodes the integer back to minutes. Switching the input to a decimal hour (or true minutes-since-midnight) would remove the implicit invariant that callers must construct `floor(hour)*100 + minute` correctly, which `updateSkyColor` does manually today.

## Helpers copied verbatim from an external source

`RGB2Color`, `RGB2Hexa`, and `byte2Hex` carry `// From http://www.krazydad.com/makecolors.php` comments. `RGB2Hexa` is defined but never called. The byte→hex helper can be replaced with `n.toString(16).padStart(2, '0')`, and the unused export should be removed.

## No build pipeline / asset pipeline

There is no minification, bundling, or cache-busting. For an embeddable widget that's reasonable, but consumers embedding `smc.js` get a non-versioned URL and must serve all the PNGs alongside it. A single self-contained build artifact (JS + inlined or sprite-sheeted images) would make embedding a one-line include.
