# ASCENSION//CYBER — v10.0.0 (web)

Themed version of my other app. Offline fitness RPG.  Workouts are Gates, habits are quests, the body levels up.
All data stays on the device (localStorage). No account, no server.

## Install (iOS)

1. Open the Pages URL in **Safari**.
2. Share → **Add to Home Screen** → Add.
3. Launch from the home screen icon. Runs full screen, no browser bar, works offline after first load.

## Changes vs. the original  (v8.4.10)

**Core**
- New 3D WebGL scene replaces the 2D background: wireframe body inside a spinning week ring.
- Ring = the current week (7 day sectors). Trained days light up and connect to the muscles worked.
- Rank halo around the ring: one sixth fills per rank, full at Monarch.
- Each tab is a camera preset. One scene, no reloads; the camera blends between views.
- Gate pages zoom the body to the muscle being trained.
- Auto quality tiers (resolution/fps/effects), step down on slow devices.

**Interface**
- Full restyle: dark HUD, see-through glass panels, hairline borders, one signal colour.
- Status HUD around the body: level card, attribute callouts on body anchors, HP-driven heartbeat line, skill orbit.
- ATTR / RECOVERY toggle: swaps callouts for muscle recovery tags.
- Swipe left/right to change tabs. Disabled during Gates, runs, pacer tests and open windows.
- Run tracker redrawn: the ring is the track, three runners with lap counter.
- Data tab: animated charts, System Log.
- Popups dock above the body so it stays visible; CRT scan on open.
- Level-up takeover screen.
- Boot terminal on launch.

**Rest timer**
- Docked bar replaced by a floating, draggable bubble. Tap to expand, drag onto ✕ to end.
- Alarm volume follows the volume slider (OFF = silent).

**Sound**
- New UI sound set (move, back, cancel, close, notice, scan, beep, window, select, panel, settings, ok, pick).
- All UI sounds and the rest alarm use the volume slider.

**Settings**
- New panels: System Core (scene quality, body sway, anchors, fps cap, dim, reduce motion) and Data & Display (week start, number format, replay intro).
- Typefaces: JetBrains Mono (default), Share Tech Mono, Orbitron, system, Noto Serif.

**Removed**
- Idle panel sweep animation.

## Theme

- **Background:** near-black void `#08080a`. Panels are translucent black glass with a slight blur.
- **Signal colour:** one accent marks meaning only (titles, active state, progress, your data). Default is crimson `#ec4c5e`. Also available: cyan, violet, orange, yellow, green, navy.
- **Neutrals:** greys from `#0c0c0e` to `#ececee`. Status colours: HP green `#4fd3a0`, MP blue `#6a96f0`, warn `#f0b54a`, bad `#f05a72`.
- **Type:** JetBrains Mono for everything. Big numbers (level, timers, set fields) use DSEG7, a 7-segment digital font.
- **Shape:** square panels, 1px borders, small corner brackets on windows. Controls over the scene are 56px round buttons.
- **Motion:** only on input or System events (tab change, popup, level-up). Ring spin and field drift are the only idle motion. HUD motion can be turned off.

## Files

| File | Purpose |
|---|---|
| `index.html` | the app (CSS, JS, fonts, sounds, icons inlined) |
| `sw.js` | offline cache. Bump `VERSION` on every deploy. |
| `manifest.webmanifest` | install metadata |
| `icons/` | app icons (any, maskable, apple-touch) |
| `hamr-audio.mp3` | HAMR / pacer test audio |

## Known limitations (web)

- No haptics, no background notifications, no floating timer outside the app.
- Sounds start after the first tap (browser autoplay rules).
- iOS: the ring/silent switch mutes all sound.
- iOS: home-screen app storage is separate from Safari. Use Settings → Export to back up.
