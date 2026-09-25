# Workout Tracker

A mobile-first, offline-first set logger for the 3-day full-body rotation (A / B / C),
built from `Workout_Tracker_Spec.md`. It runs as an installable PWA at `/workout/`,
alongside the existing body-composition dashboard at the site root.

Nothing leaves the phone. No account, no server, no network required after the
first load.

---

## Quick start

```bash
python workout/build.py --serve
```

Then open <http://localhost:8765>. `--watch` rebuilds on every save; plain
`python build.py` builds once.

There is no Node dependency and no `npm install` — the build is one stdlib-only
Python script.

> On `localhost` the service worker is deliberately **not** registered, because
> it would keep serving the previous build after every edit. Add `?sw=1` to the
> URL when you specifically want to test install/offline behaviour locally.

---

## Layout

```
workout/
  build.py              the build step (stdlib only)
  tools/make_seed.py    Body Composition Tracker.xlsx -> src/data/seed.json
  README.md

  src/                  SOURCE -- edit these
    index.html          shell; /*@STYLES*/ and /*@VERSION*/ are filled at build
    styles.css          inlined into index.html by the build
    sw.js               service worker template
    manifest.webmanifest
    icons/
    data/seed.json      generated from the spreadsheet
    js/
      app.js            bootstrap, hash router, bottom bar, SW registration
      store.js          localStorage persistence (key: workoutTracker.v1)
      calc.js           Epley, PR engine, volume, overload rule, warmup ramp
      routine.js        the A/B/C routine as data
      charts.js         hand-rolled inline SVG line + bar charts
      dom.js            element helpers, toasts, bottom sheets
      views/            home, session, history, summary, data

  index.html            BUILT -- do not edit
  app.js                BUILT
  sw.js                 BUILT
  manifest.webmanifest  BUILT
  icons/                BUILT
```

The built files sit at the folder root so the whole `workout/` directory can be
dragged into GitHub in one go and the app lives at `…/workout/`.

### What the build step actually does

1. **Bundles** `src/js/*.js` into a single `app.js`. The bundler in `build.py`
   handles exactly the ES-module subset the source uses — named imports,
   namespace imports, `export function/const/let/class`. Anything else
   (`export default`, re-exports, circular imports) is a build error with a file
   and line, never a silently broken bundle.
2. **Generates two virtual modules**: `generated/seed.js` (the spreadsheet
   history) and `generated/build.js` (version + timestamp, shown on the Export
   screen).
3. **Inlines** `styles.css` into `index.html`, so there is no flash of unstyled
   content on an offline cold start.
4. **Stamps the service worker** with a precache list and a cache name hashed
   over the built content. Deploying a change always busts the cache; rebuilding
   *without* a change does not. You never bump a version by hand.

---

## Deploying

Build first, then upload through the GitHub web UI:

```bash
python workout/build.py
```

1. Open the GitHub Pages repo in a browser → **Add file → Upload files**.
2. Drag the whole `workout` folder in.
3. Commit.

> **The one trap.** There are two files named `index.html`: the dashboard
> (~4.4 MB, at the repo root) and this app (~25 KB, at `workout/index.html`).
> GitHub's uploader drops files into whatever folder you were browsing when you
> clicked **Add file**, so uploading the dashboard while inside `workout/`
> silently overwrites the app with the dashboard. The symptom is that
> `/workout/` shows the dashboard, and its Log Workout button then 404s at
> `/workout/workout/`.
>
> Before committing an upload, check the breadcrumb above the drop zone says the
> folder you meant. After committing, check the file size in the repo: the
> dashboard is megabytes, this app's `index.html` is kilobytes.

Wait a minute for Pages to rebuild, then open `https://<your-pages-url>/workout/`
in **Safari** on the iPhone → Share → **Add to Home Screen**. It installs as
"Workout" with its own icon, separate from the "BodyComp" dashboard.

### One wrinkle worth knowing

The dashboard's own service worker (`/service-worker.js`, cache `bc-v5`) has
scope `/`, so it briefly handles `/workout/` requests on your very first visit,
before this app's worker registers. From the second load onward `/workout/sw.js`
wins, because a narrower scope takes precedence. If a stale `/workout/` page
ever sticks, open **Export → Check for update** and reload; bumping
`CACHE_VERSION` in the root `service-worker.js` clears it for good.

---

## How it behaves

**Session flow.** Home shows which day is next in the rotation and three big
start buttons. A session opens on the warmup checklist (dead bug / bird dog /
hip-flexor stretch — tap to complete, no weights), then steps through one
"station" at a time. Supersets are one station: the two lifts are shown
together and the app alternates which one it is asking for.

Every set writes to `localStorage` the instant you tap **Log set**. There is no
debounce and no in-memory-only state, which is what makes the app survive the
screen locking, app-switching, and Safari evicting the tab mid-session. The rest
timer is stored as an absolute timestamp, so it keeps counting correctly through
all of that too.

**PR detection.** Every set is scored against the full history of that lift:

| Flag | Meaning |
|---|---|
| `W-PR` | heaviest load ever moved on this lift for ≥ 1 rep |
| `R-PR` | most reps ever at exactly this load |
| `e1RM-PR` | best Epley estimate ever — `weight × (1 + reps/30)` |
| `A-PR` | *assisted* lifts only: least assistance ever |

Three judgement calls beyond the spec, all deliberate:

- **The first time a lift is ever performed sets no record.** Otherwise every
  new exercise on the routine (hip thrust, face pull, rear-delt fly) hands out a
  trophy on day one and the real PRs get lost in the noise. The *second*
  performance can PR normally.
- **A rep PR needs the load to have been worked before.** A brand-new weight
  setting a "rep record" against itself is not information.
- **Assisted pull-ups invert.** More assistance is not more strength, so Epley
  and weight PRs are suppressed there and a drop in assist load is the record
  instead. This matches the note in the 8/26 log entry.

Flags are never stored as truth — they are recomputed from the whole set log on
every load, so a bad flag can't get baked in and a corrected set re-scores
everything downstream.

**Progressive overload.** Hit the top of the rep range on your top set of a main
lift and the next session says so. Log RIR ≤ 1 on that set and it turns into a
hard suggestion with a number and a one-tap "Use 225" button — +2.5 lb on the
pressing lifts (bench, OHP, incline), +5 or +10 elsewhere. With no RIR logged
you get the soft version: a nudge, no number.

**Warmup ramp.** On squat, bench, deadlift, OHP, hip thrust and incline bench,
enter the working weight and the ramp calculator offers 40% × 5, 60% × 3,
75% × 2, 90% × 1, rounded to the nearest 5 lb and floored at the 45 lb bar. Tap
a row to log it as a warmup set. Warmup sets are excluded from volume and can
never set a PR.

**Charts.** Per exercise: top-set e1RM over time, best working-set weight over
time, volume per session. Three separate single-series plots — never two scales
on one axis — drawn as inline SVG with no chart library, because a CDN script is
the one thing a service worker can silently fail to have. PR sessions are
marked in green. Every chart has a **Table view** twin, so no value is reachable
only by hovering.

**Export.** `Export JSON` is the full backup (and the restore format — imports
merge by session id, so re-importing the same file is safe). `Export CSV` is one
row per set, for the spreadsheet. The Export screen nags until you have taken at
least one backup, because the data lives in one browser's storage and clearing
Safari data would take all of it.

---

## Seed history

`tools/make_seed.py` reads `Body Composition Tracker.xlsx` → `Workout Log` and
writes `src/data/seed.json`, which the build embeds. Current window: **14
sessions, 284 sets, 2026-08-03 → 2026-09-10** (the spec's "dates ≥ 8/1/2026"
cutoff).

```bash
python workout/tools/make_seed.py                    # default cutoff 2026-08-01
python workout/tools/make_seed.py --cutoff 2026-06-01
python workout/tools/make_seed.py --all
python workout/build.py                              # then rebuild
```

Old sessions come in with `day: null` and their original rotation label
("FB C round 4"). The old A/B/C letters do **not** line up with the new routine's
A/B/C — old "FB C" was the deadlift day, the new Day C is the hip-thrust day —
so imported sessions are not relabelled. They feed PR baselines and the history
view; the new rotation starts clean at Day A.

**Warmup vs working sets** are taken from the log's own notes ("Warmup",
"Warmup ramp", "Working top", "Working back-off") where they exist. Sessions
logged without notes fall back to a rule: a set before the heaviest set of that
exercise is a warmup if it is under 80% of that load, or a triple or lighter
below it. That correctly catches 9/7's `135×8` and `185×3` ahead of `215×5`
without ever demoting a back-off set, which comes *after* the top set.

**Exercise renames.** The spec's mapping table is applied verbatim. These are
additions — same movement, different spelling across the log's history — and are
listed in the app under **Export → Exercise renames applied** so they are easy
to audit:

| Spreadsheet name | Routine name |
|---|---|
| Barbell Squat | Back Squat |
| Barbell Shoulder Press | Standing Barbell OHP |
| Barbell Incline Bench Press | Incline Barbell Bench Press |
| Dumbbell Incline Row | Chest-Supported DB Row |
| Dumbbell Single Arm Row / Dumbbell 3 Point Row | One-Arm DB Row |
| Dumbbell Lateral Raise | DB Lateral Raise |
| Cable Face Pull | Face Pull |
| Dumbbell Shrug / Barbell Shoulder Shrug | DB Shrug |
| Barbell Bicep Curl | EZ-Bar Curl |
| Alt(ernating) DB Hammer Curl, Dumbbell Hammer Curl | Hammer Curl |
| Cable {Straight Bar, Bar, Rope} Tricep Pushdown | Cable Tricep Pushdown |
| Cable Rope Standing (Overhead) Tricep Extension | Rope Overhead Tricep Extension |
| Dumbbell (Standing Overhead) Tricep Extension | Overhead Tricep Extension |
| Machine Assisted Pull Up | Assisted Pull-up |
| Band Assisted Pull Up | Band-Assisted Pull-up *(kept separate — see below)* |

Band-assisted pull-ups are deliberately **not** merged with the machine. The
spreadsheet records band tension as weight `0`, and on an assisted lift the
record is the *lowest* load — folding a 0 in would make "least assist ever"
unbeatable forever. (The PR engine also ignores a logged 0 when tracking that
record, belt and braces.)

The one worth a second look is **Dumbbell Incline Row → Chest-Supported DB Row**.
They are the same movement, and merging them means the routine's row starts with
a real baseline (45 lb × 10 from 9/7) instead of nothing. If you would rather
keep them apart, delete that line from `ALIASES_ADDED` in `tools/make_seed.py`
and regenerate.

Exercises with no equivalent on the new routine — Cable Wide Grip Seated Row,
Chest Fly Machine, Seated Leg Extension Machine, and so on — keep their own
names. They appear in History under "History only" and never in the session
picker, exactly as the spec asks.

---

## Notes on the spec

- The spec labels Day B and Day C as "18 working sets" each, but the listed
  prescriptions add up to **19** for both (Day A really is 18). The app shows the
  true sum from the routine data.
- Day C's "Front Squat OR Leg Press" is a per-session swap: tap the exercise name
  to pick. The same mechanism covers the pull-up (assisted / weighted /
  bodyweight) and the Bulgarian split squat (lever machine / dumbbells).
- e1RM is shown to the nearest pound in set rows and to one decimal in charts and
  records. Epley to a tenth of a pound in a set row is false precision on a
  phone screen.
- Session notes are editable during the session (End → notes) and afterwards
  from the session's history page.

## If something goes wrong at the gym

Everything is in one localStorage key. From Safari's console, or by asking for
it later:

```js
__workout.store.exportPayload()   // the full state
__workout.store.activeSession()   // the in-progress session
__workout.BUILD                   // which build is running
```

Export → **Reset all data** wipes local sessions and restores the imported
history. Export first.
