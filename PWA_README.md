# Body Composition Tracker — PWA mode

Your dashboard is now an installable Progressive Web App with a workout logger.

## Files added in this pass

| File | What it does |
|---|---|
| `manifest.json` | Tells iOS/Android how to "install" the app (name, icons, theme color, fullscreen). |
| `service-worker.js` | Caches the page so it works offline after first load. |
| `db.js` | IndexedDB wrapper. All workout data lives in `window.BCDB`. |
| `log.html` | Workout logger UI (Kalos-style: name, date, duration, RPE, exercises, sets). |
| `icons/` | App icons in 192 / 512 / 180 (Apple) / 32 (favicon). |

Files edited:
- `index.html` — added PWA meta tags, "Log Workout" button on the Lifting & Recovery tab, service-worker registration.

## Installing on your iPhone

1. Push the new files to your GitHub Pages repo (see "Sync to GitHub" below).
2. On iPhone, open the GitHub Pages URL in **Safari** (must be Safari, not Chrome).
3. Tap the **Share** icon → **Add to Home Screen** → confirm.
4. The app appears as "BodyComp" with the barbell icon. Open it from the home screen — it runs fullscreen, no browser chrome.
5. Tap **Lifting & Recovery → + Log Workout** to start entering a workout.

## Data model

Saved in IndexedDB (lives on the device only — see "Backing up" below).

```js
workout = {
  id: 'uuid',
  date: '2026-05-14',
  start: '15:14',          // optional
  end:   '16:28',          // optional
  duration_min: 74,        // auto-computed from start/end, or manual override
  name: 'Toned | P0 | Lower A',
  rpe: 'challenging',      // easy | moderate | challenging | hard
  notes: 'free text',
  exercises: [
    {
      name: 'Barbell Box Squat',
      kind: 'weighted',     // weighted | reps | time
      sets: [
        { weight: 135, reps: 10 },
        { weight: 195, reps: 12 },
        ...
      ]
    },
    {
      name: 'TRX Lateral Lunge',
      kind: 'reps',
      sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }]
    },
    {
      name: 'Bicycle Crunch',
      kind: 'time',
      sets: [{ seconds: 27 }, { seconds: 20 }]
    }
  ]
}
```

e1RM is computed on the fly with Epley: `weight × (1 + reps/30)` (rounded). Shown next to each set in the entry UI.

## Backing up your data (do this regularly)

**The data is in IndexedDB on your phone.** If you clear Safari data, uninstall the app, or replace the phone, it's gone. Until you decide on a backend, **export to JSON regularly**:

1. Open the logger (`log.html`).
2. Tap **⬇ Export all data (JSON)** at the bottom.
3. A file like `body-comp-export-2026-05-14.json` downloads.
4. Save it somewhere safe — Files → iCloud Drive, AirDrop to your Mac, email yourself, etc.

To restore: tap **⬆ Import JSON** and pick the file. Imports merge by ID (re-importing the same file is safe).

## Sync to GitHub Pages

Same process as before — commit the new files to your repo:

```bash
git add manifest.json service-worker.js db.js log.html icons/ index.html PWA_README.md
git commit -m "Add PWA shell + workout logger (Phase 1: IndexedDB)"
git push
```

Wait ~1 minute for GitHub Pages to rebuild, then reload the URL on your phone. You'll see the new "+ Log Workout" button on the Lifting tab.

## Important caveat: service worker updates

Because of the service worker, **changes to `index.html` won't appear right away** after a deploy — the SW serves the cached copy first. The service worker uses a network-first strategy for HTML so it should pick up fresh content on the next load, but if you ever get stuck on a stale version:

1. iPhone Safari: Settings → Safari → Advanced → Website Data → search for the site → swipe to delete.
2. Reopen the app. Fresh fetch.
3. To force-update everyone after a big change, bump `CACHE_VERSION` in `service-worker.js` (e.g., `'bc-v1'` → `'bc-v2'`).

## What's NOT in this phase

Intentionally deferred — we'll iterate based on how this feels:

- **Food logging.** Holding off per your call.
- **Sync across devices.** Data is device-only. Add Supabase in Phase 2 if you want phone + laptop + tablet to share data.
- **Auto-import from Apple Health / Kalos.** Manual entry only for now.
- **Charts reading from IndexedDB.** The Lifting tab still shows the old hardcoded session summary. We'll wire it to read from new entries once you've logged a few workouts and want the dashboard to refresh from your fresh data.
- **Weigh-in / measurement entry.** Schema is stubbed in `db.js` (`weighins` store, `BCDB.saveWeighIn`) but no UI yet. Easy to add when you want.

## Phase 2 preview (when you're ready for sync)

The IndexedDB → Supabase migration looks roughly like:

1. Create free Supabase project (~5 min, no credit card).
2. Run a SQL migration to mirror the IndexedDB schema as Postgres tables.
3. Add ~50 lines to `db.js`: when online, mirror every save to Supabase; on load, pull anything newer from Supabase.
4. Export your current IndexedDB JSON and upload it once to seed.

Your exports from Phase 1 are forward-compatible — same schema.
