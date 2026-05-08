# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Kotlin app + AppWidget. The app is a `WebView` pointed at `https://slashie.net/tmc`; the widget fetches the proxy URL on a schedule and pushes the PNG into the home-screen widget. Tapping the widget launches the app. Single-module Gradle project, no Compose.

## Commands

```
./gradlew assembleDebug      # APK at app/build/outputs/apk/debug/
./gradlew installDebug       # install on connected device/emulator
```

## Configuration

The clock URL is baked in at build time via `buildConfigField "CLOCK_URL"` in `app/build.gradle.kts` (currently `https://slashie.net/time/current`). Change it there, not in code. `BuildConfig.CLOCK_URL` is read by `RefreshWorker`.

## Refresh model

Three independent triggers update the widget. The `updatePeriodMillis` in `res/xml/clock_widget_info.xml` is intentionally redundant with WorkManager and exists only as a fallback — primary refresh is WorkManager + screen-on:

- `ClockWidgetProvider.onEnabled` schedules a `PeriodicWorkRequestBuilder<RefreshWorker>(15, MINUTES)` with `KEEP` policy. **15 minutes is the OS minimum for periodic work** — don't try to set it lower.
- `ClockWidgetProvider.onUpdate` enqueues a one-shot `RefreshWorker` with `REPLACE` policy so a manual host refresh re-fetches immediately.
- `ScreenOnReceiver` listens for `ACTION_USER_PRESENT` (registered in `ClockApp.onCreate` as `RECEIVER_NOT_EXPORTED`) and triggers the same one-shot refresh when the user unlocks. This is the main reason the widget appears "live" — periodic work alone updates only every 15 minutes.

`RefreshWorker` does a blocking `HttpURLConnection` fetch on `Dispatchers.IO`, decodes to a `Bitmap`, and pushes it into the widget via `RemoteViews.setImageViewBitmap`. On failure it returns `Result.retry()` (WorkManager backs off). It does no client-side caching — the proxy is authoritative.

The fetch URL is built per-request as `CLOCK_URL?tz=<TimeZone.getDefault().id>`, so the rendered scene reflects the device's current tz and follows the user across timezones automatically. The proxy and renderer key their caches by this tz; see the root `CLAUDE.md` for the cross-layer protocol.

## Widget tap → app launch

Both `ClockWidgetProvider.onUpdate` and `RefreshWorker.doWork` build a fresh `RemoteViews` and call `updateAppWidget`, which replaces the previous RemoteViews wholesale. That means the click `PendingIntent` must be re-attached on every update, not just at provider boot. `ClockWidgetProvider.applyLaunchIntent` is the single source of truth and is called from both sites; if you add a third path that updates the widget's RemoteViews, call it there too or the tap-to-launch will go dead after the next refresh.

## App (`MainActivity`)

`MainActivity` is a plain `Activity` (no AppCompat) hosting a `WebView`. The page URL is hardcoded in `MainActivity.PAGE_URL` — distinct from `BuildConfig.CLOCK_URL`, which is the widget's PNG endpoint. WebView state is saved/restored across config changes via `saveState`/`restoreState`, and back-press walks the WebView history before exiting.
