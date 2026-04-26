# Plan: Google Play release

Project-setup gaps that have to be closed before uploading an AAB, plus the Play Console-side tasks that don't touch the repo. Order is roughly "must-do before you can build a signed AAB" → "polish" → "console paperwork."

## Project setup (this repo)

### 1. App icon
- [ ] Replace placeholder (`@android:drawable/sym_def_app_icon`) with a real adaptive icon.
- [ ] Generate via Android Studio → **File → New → Image Asset → Launcher Icons (Adaptive and Legacy)**. Drop foreground art (transparent PNG, ideally vector) + a background color/drawable; it writes all densities + `mipmap-anydpi-v26/ic_launcher.xml`.
- [ ] Also produce a **512×512 hi-res icon** (separate file, uploaded later via Play Console — not bundled in the APK).
- [ ] Update `AndroidManifest.xml`: `android:icon="@mipmap/ic_launcher"` (and optionally `android:roundIcon`).

### 2. Release signing
- [ ] Generate an upload keystore (kept **out** of the repo):
      `keytool -genkey -v -keystore upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
- [ ] Store its password + path in `local.properties` or env vars (do NOT commit).
- [ ] Add `signingConfigs.release { ... }` in `app/build.gradle.kts` reading those values, then wire `signingConfig = signingConfigs.getByName("release")` into the `release` build type.
- [ ] **Recommendation**: enroll in **Play App Signing** (Console → Setup → App integrity). You ship the AAB signed with the upload key; Google re-signs with a managed app-signing key. This is the modern default and protects you if you lose the upload key.

### 3. Build-type-specific URL + cleartext
- [ ] Split `CLOCK_URL` per build type so dev keeps using the emulator URL and release uses HTTPS:
      ```kotlin
      buildTypes {
          debug {
              buildConfigField("String", "CLOCK_URL", "\"http://10.0.2.2:3000/current\"")
          }
          release {
              buildConfigField("String", "CLOCK_URL", "\"https://your-proxy/current\"")
              isMinifyEnabled = true
              isShrinkResources = true
              proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
              signingConfig = signingConfigs.getByName("release")
          }
      }
      ```
- [ ] Remove `android:usesCleartextTraffic="true"` from `AndroidManifest.xml` (or restrict it via a debug-only `network_security_config.xml`).
- [ ] Sanity-test: `./gradlew assembleRelease` and verify the resulting APK actually fetches the production URL.

### 4. Minify + shrink for release
- Covered by the snippet above. The empty `proguard-rules.pro` already exists.
- [ ] After enabling minify, run a release build on a real device once and confirm the widget still works — minify can sometimes strip something WorkManager / reflection relies on.

### 5. AAB, not APK
- [ ] `./gradlew bundleRelease` produces `app/build/outputs/bundle/release/app-release.aab`. That's what Play wants. No code change beyond signing being wired up.

### 6. Minimal launchable Activity (recommended)
- [ ] A widget-only APK shows a launcher icon that does nothing when tapped — Play reviewers and users sometimes flag this as broken.
- [ ] Add a one-screen `MainActivity` (TextView: "Drag the widget onto your home screen", + credits, + maybe a link to settings). ~30 lines of Kotlin + a layout XML.
- [ ] Register it in the manifest with the `MAIN`/`LAUNCHER` intent filter so the launcher icon resolves.

### 7. `targetSdk` bump
- [ ] Currently `targetSdk = 34`. Play requires apps to target the latest stable API (currently API 35; API 36 likely required during 2026).
- [ ] Bump and re-test, especially the runtime receiver registration (Android 14+ tightened export-flag requirements).

## Play Console (no repo changes)

### 8. Closed testing requirement (personal accounts)
- [ ] Since 2023, a **new personal developer account** must run a closed test with **12+ opted-in testers for 14+ consecutive days** before promoting to production. Plan around this.
- [ ] Not required for organization accounts.

### 9. Store listing
- [ ] App name, short description (80 char), full description (4000 char).
- [ ] **Screenshots**: 2–8 phone screenshots — for a widget app, those should show the widget on a home screen, ideally at different times of day so the dynamic background sells the concept.
- [ ] **Feature graphic**: 1024 × 500 PNG/JPG.
- [ ] **Hi-res icon**: 512 × 512 (from step 1).
- [ ] Optional: promo video (YouTube link).
- [ ] Category: probably **Personalization** (widgets) or **Tools**.

### 10. Data safety form
- [ ] App fetches a URL but collects no user data — still has to be declared. Mark "Data collected" → No (or only the minimum needed for the network request itself, depending on how strict you read the form).
- [ ] Mention the network/internet usage explicitly.

### 11. Privacy policy
- [ ] Required even for "no data collected" apps. Host a URL (a one-paragraph page on your domain works) and paste it into the Console.

### 12. Content rating
- [ ] Fill out the rating questionnaire. Almost certainly resolves to "Everyone" / IARC equivalent for a clock widget.

### 13. Pricing & distribution
- [ ] Free vs paid, country availability, ads declaration (you have none).

## Items I can help with

- Build-type-split `CLOCK_URL` + minify config in `app/build.gradle.kts` (small).
- `MainActivity` + layout for the launchable-screen recommendation (small).
- `network_security_config.xml` if you want cleartext only in debug.
- Drafting a privacy policy text you can host wherever.

## Items you'll handle yourself

- Icon design + Image Asset Studio run.
- Keystore generation and password storage.
- Play Console signup, closed-testing test group, store-listing copy & assets.
- Privacy policy hosting (pick a URL).
