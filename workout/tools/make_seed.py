#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_seed.py -- Body Composition Tracker.xlsx :: Workout Log  ->  src/data/seed.json

Produces the PR baseline the workout tracker loads on first run, so that
PRs are meaningful from the very first set logged in the new app.

Usage (from the workout/ folder):

    python tools/make_seed.py
    python tools/make_seed.py --cutoff 2026-06-01      # widen the window
    python tools/make_seed.py --all                    # every session ever

Requires openpyxl (already installed in this environment).

--------------------------------------------------------------------------
What it does
--------------------------------------------------------------------------
* Reads the `Workout Log` sheet (Date | Exercise | Set # | Weight | Reps |
  RPE | e1RM | Volume | Notes).
* Keeps rows on or after CUTOFF (default 2026-08-01 -- the current training
  phase, per the build spec).
* Groups rows into one session per date, preserving exercise order.
* Renames historical exercises to their new-routine names via ALIASES so the
  PR engine sees one continuous history per lift.
* Classifies each set as warmup or working (see classify_warmup).
* Extracts the legacy rotation label ("FB C round 4") from the notes when
  present -- displayed in history, not used for the new A/B/C rotation.

The output is data only. No PRs are computed here; the app's PR engine
recomputes everything from the full set log at runtime.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import OrderedDict
from datetime import datetime, date
from pathlib import Path

try:
    import openpyxl
except ImportError:  # pragma: no cover
    print("Need openpyxl.  Run:  pip install openpyxl", file=sys.stderr)
    sys.exit(1)

HERE = Path(__file__).resolve().parent
WORKOUT_DIR = HERE.parent
WORKBOOK = WORKOUT_DIR.parent / "Body Composition Tracker.xlsx"
OUTPUT = WORKOUT_DIR / "src" / "data" / "seed.json"

DEFAULT_CUTOFF = "2026-08-01"

# ---------------------------------------------------------------------------
# Exercise name mapping.
#
# Keys are the *historical* Kalos/spreadsheet names (lowercased, punctuation
# normalised); values are the new routine's canonical names.
#
# The entries marked [spec] come straight from Workout_Tracker_Spec.md.
# The rest are additions -- same movement, different label across the years of
# the log. They are listed separately so they are easy to audit or remove.
# ---------------------------------------------------------------------------
ALIASES_FROM_SPEC = {
    "barbell back squat": "Back Squat",
    "barbell deadlift": "Barbell Deadlift",
    "barbell overhead press": "Standing Barbell OHP",
    "barbell bench press": "Barbell Bench Press",
    "dumbbell incline bench press": "DB Incline Bench Press",
    "close grip lat pulldown": "Close-Grip Lat Pulldown",
    "dumbbell incline bicep curl": "DB Incline Curl",
    "lever squat machine - bss": "Bulgarian Split Squat (lever)",
    # "Cable Wide Grip Seated Row" and "Chest Fly Machine" are explicitly
    # kept under their own names -- no equivalent on the new routine.
}

ALIASES_ADDED = {
    # Same lift, older spreadsheet spelling.
    "barbell squat": "Back Squat",
    "barbell shoulder press": "Standing Barbell OHP",
    "barbell incline bench press": "Incline Barbell Bench Press",
    "dumbbell single arm row": "One-Arm DB Row",
    "dumbbell 3 point row": "One-Arm DB Row",
    "dumbbell incline row": "Chest-Supported DB Row",
    "dumbbell lateral raise": "DB Lateral Raise",
    "cable face pull": "Face Pull",
    "dumbbell shrug": "DB Shrug",
    "barbell shoulder shrug": "DB Shrug",
    "leg press": "Leg Press",
    "barbell bicep curl": "EZ-Bar Curl",
    "ez bar skullcrusher": "EZ-Bar Curl",  # see note below -- NOT the same lift
    "alternating dumbbell hammer curl": "Hammer Curl",
    "alt db hammer curl": "Hammer Curl",
    "dumbbell hammer curl": "Hammer Curl",
    "cable straight bar tricep pushdown": "Cable Tricep Pushdown",
    "cable bar tricep pushdown": "Cable Tricep Pushdown",
    "cable tricep pushdown": "Cable Tricep Pushdown",
    "cable rope tricep pushdown": "Cable Tricep Pushdown",
    "cable rope standing overhead tricep extension": "Rope Overhead Tricep Extension",
    "cable rope overhead tricep extension": "Rope Overhead Tricep Extension",
    "cable rope standing tricep extension": "Rope Overhead Tricep Extension",
    "dumbbell tricep extension": "Overhead Tricep Extension",
    "dumbbell standing overhead tricep extension": "Overhead Tricep Extension",
    "machine assisted pull up": "Assisted Pull-up",
    # Deliberately NOT merged with the machine: band tension is not a load and
    # the log records it as weight 0, which would make "least assist ever"
    # unbeatable forever.
    "band assisted pull up": "Band-Assisted Pull-up",
    "machine assisted chin up": "Assisted Chin-up",
}
# "ez bar skullcrusher" is a triceps lift, not a curl -- drop the bad mapping.
del ALIASES_ADDED["ez bar skullcrusher"]

ALIASES = {**ALIASES_FROM_SPEC, **ALIASES_ADDED}


def norm_key(name: str) -> str:
    """Lowercase, collapse whitespace, normalise every dash to a plain hyphen."""
    s = (name or "").strip().lower()
    s = s.replace("—", "-").replace("–", "-").replace("−", "-")
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s*-\s*", " - ", s)
    return s.strip()


def canonical(name: str) -> tuple[str, bool]:
    """Return (canonical_name, was_renamed)."""
    key = norm_key(name)
    if key in ALIASES:
        return ALIASES[key], True
    return (name or "").strip().replace("—", "—"), False


def normalize_date(raw) -> str | None:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw.date().isoformat()
    if isinstance(raw, date):
        return raw.isoformat()
    s = str(raw).strip()
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$", s)
    if m:
        mm, dd, yy = m.groups()
        yy = int(yy)
        if yy < 100:
            yy += 2000
        return f"{yy:04d}-{int(mm):02d}-{int(dd):02d}"
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return m.group(0)
    return None


def to_num(v):
    if v is None or v == "":
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return int(f) if f == int(f) else round(f, 2)


WARMUP_NOTE = re.compile(r"\bwarm[- ]?up\b", re.I)
WORKING_NOTE = re.compile(r"\bworking\b", re.I)
ROUND_LABEL = re.compile(r"\bFB\s+([ABC])\s+round\s+(\d+)", re.I)
SUPERSET_NOTE = re.compile(r"\bsuperset\b", re.I)


def classify_warmup(sets: list[dict]) -> None:
    """Mark each set of one exercise-in-one-session as warmup or working.

    Priority:
      1. An explicit "Warmup" / "Working" note wins.  The log is annotated that
         way for almost every session from August onward.
      2. Otherwise: a set that comes *before* the heaviest set of that exercise
         is a warmup if it is either under 80% of that heaviest load, or a
         single/double/triple below it (a ramp single).  That catches
         un-annotated ramps -- 9/7's 135x8 and 185x3 before 215x5 -- without
         ever demoting a back-off set, which comes *after* the top set.
    """
    weights = [s["weight"] for s in sets if s["weight"]]
    top = max(weights) if weights else 0
    top_idx = next((i for i, s in enumerate(sets) if s["weight"] == top), 0)

    for i, s in enumerate(sets):
        note = s.get("notes") or ""
        if WARMUP_NOTE.search(note):
            s["warmup"] = True
        elif WORKING_NOTE.search(note):
            s["warmup"] = False
        else:
            w = s["weight"] or 0
            r = s["reps"] or 0
            before_top = bool(top) and i < top_idx and w < top
            s["warmup"] = before_top and (w < 0.8 * top or r <= 3)


def build(cutoff: str | None) -> dict:
    if not WORKBOOK.exists():
        raise SystemExit(f"Workbook not found: {WORKBOOK}")

    wb = openpyxl.load_workbook(WORKBOOK, read_only=True, data_only=True)
    if "Workout Log" not in wb.sheetnames:
        raise SystemExit("Workbook has no 'Workout Log' sheet")
    ws = wb["Workout Log"]

    sessions: "OrderedDict[str, OrderedDict[str, dict]]" = OrderedDict()
    session_meta: dict[str, dict] = {}
    renamed: dict[str, str] = {}
    skipped = 0

    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i < 3:  # title, help text, header
            continue
        d = normalize_date(row[0])
        if not d:
            continue
        if cutoff and d < cutoff:
            continue

        raw_name = (row[1] or "").strip()
        if not raw_name:
            continue
        weight = to_num(row[3])
        reps = to_num(row[4])
        if reps is None:
            skipped += 1
            continue

        name, was_renamed = canonical(raw_name)
        if was_renamed:
            renamed[raw_name] = name

        notes = (row[8] or "").strip() if row[8] else ""
        rpe = to_num(row[5])

        meta = session_meta.setdefault(d, {"legacyLabel": None, "notes": []})
        m = ROUND_LABEL.search(notes)
        if m and not meta["legacyLabel"]:
            meta["legacyLabel"] = f"FB {m.group(1).upper()} round {m.group(2)}"

        by_ex = sessions.setdefault(d, OrderedDict())
        ex = by_ex.setdefault(
            name,
            {"name": name, "sourceName": raw_name, "superset": False, "sets": []},
        )
        if SUPERSET_NOTE.search(notes):
            ex["superset"] = True
        ex["sets"].append(
            {
                "setNum": to_num(row[2]) or (len(ex["sets"]) + 1),
                "weight": weight,
                "reps": reps,
                "rir": None,
                "rpe": rpe,
                "notes": notes,
            }
        )

    out_sessions = []
    for d, by_ex in sessions.items():
        exercises = []
        for ex in by_ex.values():
            classify_warmup(ex["sets"])
            exercises.append(ex)
        out_sessions.append(
            {
                "id": f"seed-{d}",
                "date": d,
                "day": None,  # the old rotation letters do not map onto the new A/B/C
                "legacyLabel": session_meta[d]["legacyLabel"],
                "source": "xlsx",
                "warmupCompleted": None,
                "exercises": exercises,
                "notes": "",
            }
        )
    out_sessions.sort(key=lambda s: s["date"])

    total_sets = sum(len(e["sets"]) for s in out_sessions for e in s["exercises"])
    working = sum(
        1
        for s in out_sessions
        for e in s["exercises"]
        for st in e["sets"]
        if not st["warmup"]
    )

    return {
        "schema": 1,
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "source": "Body Composition Tracker.xlsx :: Workout Log",
        "cutoff": cutoff,
        "stats": {
            "sessions": len(out_sessions),
            "sets": total_sets,
            "workingSets": working,
            "skippedRows": skipped,
        },
        "renamed": dict(sorted(renamed.items())),
        "sessions": out_sessions,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--cutoff", default=DEFAULT_CUTOFF, help="ISO date, inclusive")
    ap.add_argument("--all", action="store_true", help="ignore the cutoff entirely")
    ap.add_argument("--out", default=str(OUTPUT))
    args = ap.parse_args()

    data = build(None if args.all else args.cutoff)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")

    st = data["stats"]
    print(f"Wrote {out.relative_to(WORKOUT_DIR) if out.is_relative_to(WORKOUT_DIR) else out}")
    print(f"  sessions      {st['sessions']}")
    print(f"  sets          {st['sets']}  ({st['workingSets']} working)")
    print(f"  skipped rows  {st['skippedRows']}")
    print(f"  date range    {data['sessions'][0]['date']} -> {data['sessions'][-1]['date']}")
    print("  renamed exercises:")
    for old, new in data["renamed"].items():
        print(f"    {old:48s} -> {new}")


if __name__ == "__main__":
    main()
