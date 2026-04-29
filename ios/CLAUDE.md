# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

SwiftUI containing app + a WidgetKit extension. The app is a `WKWebView` pointed at `https://slashie.net/tmc`; the widget fetches the proxy URL on a schedule and pushes the PNG into the home-screen widget. iOS 16 deployment target, no third-party deps.

## Commands

```
brew install xcodegen          # one-time
xcodegen generate              # regenerate SunMoonClock.xcodeproj from project.yml
open SunMoonClock.xcodeproj    # then Cmd-R in Xcode
```

The `.xcodeproj` is gitignored — `project.yml` is the source of truth. Re-run `xcodegen generate` after editing `project.yml`, adding/removing source files, or pulling.

## Configuration

The clock URL is baked in at build time via `Config/Shared.xcconfig` (`CLOCK_URL`), surfaced into both Info.plists as `$(CLOCK_URL)`, and read by `Shared/ClockEndpoint.swift`. Change it in the xcconfig, not in code. The double-slash in `https://` is escaped as `https:/$()/...` because `//` starts a comment in xcconfig syntax.

The same value is shared by the app and widget targets — `Shared/` is included in both, so `ClockEndpoint.currentURL()` works identically in either context.

## App icon

Generated from `web/src/sun.png` (96×96 pixel art) by `scripts/build-app-icon.sh`. The script nearest-neighbor-upscales 10× to 960×960, centers it on a 1024×1024 opaque sky-blue canvas (App Store rejects icons with alpha), and writes the result into `App/Assets.xcassets/AppIcon.appiconset/AppIcon.png`. Re-run it whenever the source asset changes.

Modern Xcode supports the single 1024×1024 "Single Size" icon entry, so we don't ship the legacy 20+ icon-size matrix.

## Refresh model

WidgetKit drives refresh; we do not. `Widget/SunMoonClockWidget.swift::ClockTimelineProvider`:

- `getTimeline` fetches `CLOCK_URL?tz=<TimeZone.current.identifier>` via `URLSession`, returns one entry, and asks the system to reload `.after(now + 60s)` on success or `+ 120s` on failure.
- iOS will throttle further than that — WidgetKit budgets timeline reloads system-wide and there is no equivalent of Android's `ACTION_USER_PRESENT` to force a refresh on unlock. Expect minute-accurate updates only when the user is actively interacting with the home screen.
- The proxy is stale-tolerant (serves the last good PNG on upstream failure), so a missed reload degrades gracefully.

The PNG bytes (≈10–30 KB at 480×360) ride on the `TimelineEntry` directly — no shared App Group container needed.

## Widget rendering

`SunMoonClockWidget` advertises only `.systemMedium` because the renderer's 480×360 (4:3) output fits that family with the least letterboxing. Adding `.systemSmall` would require a square render variant from the renderer (e.g. `?size=square`) — out of scope for now.

`Image(uiImage:).interpolation(.none)` keeps the pixel art crisp when the widget scales the PNG to the cell. The iOS 17+ `.containerBackground` requirement is handled via `containerBackgroundCompat` — falls back to `.background()` on iOS 16.

## Cross-project invariants

The widget is a thin client over the proxy/renderer; the per-minute, per-tz caching protocol lives in the root `CLAUDE.md`. The tz is sent as a URL-encoded `?tz=` query param, matching exactly what `android/` sends. If the wire format changes, fix it here, in `android/`, in `proxy/`, and in `renderer/`.

Tab indentation across the rest of the repo applies to Swift here too — but YAML (`project.yml`) is space-indented because the YAML spec disallows tabs.
